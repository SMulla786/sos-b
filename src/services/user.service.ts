import prisma from '../client';
import {tokenService} from '@services/index';
import emailService from '../services/email.service';
import {ApiError, encryptPassword, isPasswordMatch, pick} from '@utils/index';
import {UserProfile} from 'types/response';
import {userValidation} from '@validations/index';
import {User} from '@prisma/client';
import {z} from 'zod';
import {DecodedToken} from './token.service';

type RegisterUser = z.infer<typeof userValidation.registerUserSchema>;
type LoginUser = z.infer<typeof userValidation.loginUserSchema>;
type ChangePassword = z.infer<typeof userValidation.changePasswordSchema>;
type UpdateUser = z.infer<typeof userValidation.updateUserSchema>;

class UserService {
    private async findUserById(userId: number): Promise<User> {
        const user = await prisma.user.findUnique({where: {id: userId}});
        if (!user) throw new ApiError(404, 'User not found');
        return user;
    }

    private async buildUserObject(user: UserProfile): Promise<UserProfile> {
        return pick(user, ['id', 'email', 'name', 'phone']);
    }

    public async registerUser(data: RegisterUser) {
        const {email, phone} = data;

        const existingUser = await prisma.user.findFirst({
            where: {OR: [{phone}, {email}]},
        });
        if (existingUser) {
            throw new ApiError(409, 'User with this phone or email already exists');
        }

        const user = await this.createUser(data);
        return this.buildUserObject(user);
    }

    public async createUser(data: Pick<User, 'name' | 'email' | 'password' | 'phone'>) {
        const hashedPassword = await encryptPassword(data.password);
        return prisma.user.create({
            data: {
                ...data,
                password: hashedPassword,
                isActive: true,
            },
        });
    }

    public async loginUser(data: LoginUser) {
        const {email, phone, password} = data;
        const user = await prisma.user.findFirst({
            where: {OR: [{phone}, {email}]},
        });

        if (!user) throw new ApiError(404, 'User does not exist');
        if (user.isDeleted) throw new ApiError(403, 'User account is not available.');
        if (!user.isActive)
            throw new ApiError(403, 'User account is not active. Please contact support!');

        await this.verifyPassword(password, user.password);
        const userProfile = await this.buildUserObject(user);
        const {accessToken, refreshToken} =
            await tokenService.generateAccessAndRefreshToken(userProfile);
        return {accessToken, refreshToken, user: userProfile};
    }

    private async verifyPassword(password: string, hashedPassword: string) {
        if (!(await isPasswordMatch(password, hashedPassword))) {
            throw new ApiError(401, 'Invalid credentials');
        }
    }

    public async logoutUser(userId: number) {
        await prisma.user.update({
            where: {id: userId},
            data: {refreshToken: null},
        });
    }

    public async refreshAccessToken(refreshToken: string) {
        const decodedToken = tokenService.verifyToken(refreshToken) as DecodedToken;
        const user = await this.findUserById(decodedToken.id);

        if (refreshToken !== user.refreshToken) {
            throw new ApiError(401, 'Invalid or expired refresh token');
        }

        const userProfile = await this.buildUserObject(user);

        return tokenService.generateAccessAndRefreshToken(userProfile);
    }

    public async changeCurrentPassword(userId: number, data: ChangePassword) {
        const user = await this.findUserById(userId);
        await this.verifyUserVerification(user);

        await this.verifyPassword(data.currentPassword, user.password);
        const hashedNewPassword = await encryptPassword(data.newPassword);
        return await prisma.user.update({
            where: {id: user.id},
            data: {password: hashedNewPassword},
        });
    }

    private async verifyUserVerification(user: User) {
        if (user.isDeleted) throw new ApiError(403, 'User account is not available.');
    }

    public async updateUser(userId: number, data: UpdateUser) {
        return await prisma.user.update({
            where: {id: userId},
            data,
            select: {id: true, email: true, name: true},
        });
    }

    public async requestPasswordReset(email: string) {
        const user = await prisma.user.findUnique({where: {email: email}});
        if (!user) throw new ApiError(404, 'User not found');
        await this.verifyUserVerification(user);

        const accessToken = tokenService.generateAccessToken(await this.buildUserObject(user));
        const emailResponse = await emailService.sendResetPasswordEmail(user.email, accessToken);
        if (!emailResponse.success) throw new ApiError(500, emailResponse.message);
    }

    public async resetPassword(userId: number, newPassword: string) {
        const hashedPassword = await encryptPassword(newPassword);
        await prisma.user.update({
            where: {id: userId},
            data: {password: hashedPassword},
        });
    }
}

export default new UserService();

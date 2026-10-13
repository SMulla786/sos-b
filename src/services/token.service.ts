import jwt, {JsonWebTokenError, NotBeforeError, TokenExpiredError} from 'jsonwebtoken';
import {config} from '@config/index';
import ApiError from '@utils/ApiError';
import prisma from '../client';

export interface DecodedToken {
    id: number;
    [key: string]: unknown;
}

type UserPayload = {
    id: number;
    email: string;
    name: string;
};

type TokenData = {
    refreshToken: string;
    accessToken: string;
};

class TokenService {
    public generateAccessToken = (user: UserPayload): string => {
        return jwt.sign(
            {
                ...user,
            },
            config.jwt.secret,
            {
                expiresIn: `${config.jwt.accessExpirationMinutes}m`,
            },
        );
    };

    public generateRefreshToken = (userId: number): string => {
        return jwt.sign(
            {
                id: userId,
            },
            config.jwt.secret,
            {
                expiresIn: `${config.jwt.refreshExpirationDays}d`,
            },
        );
    };

    public generateAccessAndRefreshToken = async (user: UserPayload): Promise<TokenData> => {
        const accessToken = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken(user.id);
        await prisma.user.update({where: {id: user.id}, data: {refreshToken}});
        return {accessToken, refreshToken};
    };

    public verifyToken = (token: string): DecodedToken => {
        try {
            return jwt.verify(token, config.jwt.secret) as DecodedToken;
        } catch (error) {
            if (error instanceof TokenExpiredError) {
                throw new ApiError(401, 'Token has expired. Please login again');
            } else if (error instanceof NotBeforeError) {
                throw new ApiError(401, 'Token is not yet valid');
            } else if (error instanceof JsonWebTokenError) {
                throw new ApiError(401, 'Invalid token');
            } else {
                throw new ApiError(500, 'Token verification failed! Please login again');
            }
        }
    };
}

export default new TokenService();

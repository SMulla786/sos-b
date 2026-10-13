import httpStatus from 'http-status';
import {userService} from '@services/index';
import {catchAsync, ApiResponse} from '@utils/index';
import {userValidation} from '@validations/index';

const loginUser = catchAsync(async (req, res) => {
    const {email, phone, password} = userValidation.loginUserSchema.parse(req.body);
    const data = await userService.loginUser({email, phone, password});
    const {accessToken, refreshToken, user} = data;

    const options = {
        httpOnly: true,
        secure: true,
    };
    return res
        .status(httpStatus.OK)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', refreshToken, options)
        .json(
            new ApiResponse(
                httpStatus.OK,
                {token: {accessToken, refreshToken}, user},
                'User logged in successfully',
            ),
        );
});
const registerUser = catchAsync(async (req, res) => {
    const data = userValidation.registerUserSchema.parse(req.body);
    const user = await userService.registerUser(data);

    return res
        .status(httpStatus.OK)
        .json(new ApiResponse(httpStatus.OK, user, 'User registered successfully'));
});
const logoutUser = catchAsync(async (req, res) => {
    await userService.logoutUser(req.user!.id);

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(httpStatus.OK)
        .clearCookie('accessToken', options)
        .clearCookie('refreshToken', options)
        .json(new ApiResponse(httpStatus.OK, {}, 'User logged out successfully'));
});

const refreshAccessToken = catchAsync(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    const {accessToken, refreshToken} = await userService.refreshAccessToken(incomingRefreshToken);

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(httpStatus.OK)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', refreshToken, options)
        .json(
            new ApiResponse(
                httpStatus.OK,
                {accessToken, refreshToken},
                'Token refreshed successfully',
            ),
        );
});

const getCurrentUser = catchAsync(async (req, res) => {
    return res
        .status(httpStatus.OK)
        .json(new ApiResponse(httpStatus.OK, req.user, 'User fetched successfully'));
});

const changeCurrentPassword = catchAsync(async (req, res) => {
    const {currentPassword, newPassword} = userValidation.changePasswordSchema.parse(req.body);
    await userService.changeCurrentPassword(req.user!.id, {currentPassword, newPassword});

    return res
        .status(httpStatus.OK)
        .json(new ApiResponse(httpStatus.OK, {}, 'Password changed successfully'));
});

const updateUser = catchAsync(async (req, res) => {
    const data = userValidation.updateUserSchema.parse(req.body);
    const user = await userService.updateUser(req.user!.id, data);

    return res
        .status(httpStatus.OK)
        .json(new ApiResponse(httpStatus.OK, user, 'User updated successfully'));
});

const requestPasswordReset = catchAsync(async (req, res) => {
    const {email} = userValidation.requestPasswordResetSchema.parse(req.body);
    await userService.requestPasswordReset(email);

    return res
        .status(httpStatus.CREATED)
        .json(
            new ApiResponse(
                httpStatus.CREATED,
                undefined,
                `Password reset email sent.... Please check your email!`,
            ),
        );
});

const resetPassword = catchAsync(async (req, res) => {
    const {newPassword} = userValidation.resetPasswordSchema.parse(req.body);
    await userService.resetPassword(req.user!.id, newPassword);

    return res
        .status(httpStatus.OK)
        .json(new ApiResponse(httpStatus.OK, {}, 'Password reset successfully'));
});

export default {
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    changeCurrentPassword,
    updateUser,
    requestPasswordReset,
    resetPassword,
    registerUser,
};

import {Request} from 'express';
import {catchAsync, ApiError} from '@utils/index';
import prisma from '../client';
import {tokenService} from '@services/index';
import httpStatus from 'http-status';
import {commonValidation} from '@validations/index';

const getTokenFromRequest = (req: Request): string => {
    const token =
        req.cookies?.accessToken || req.headers.authorization?.replace('Bearer ', '') || '';
    commonValidation.tokenSchema.parse(token);
    return token;
};

const verifyJWT = catchAsync(async (req, res, next) => {
    const token = getTokenFromRequest(req);
    const decodedToken = tokenService.verifyToken(token);

    const user = await prisma.user.findUnique({
        where: {id: decodedToken.id},
        select: {
            id: true,
            email: true,
            name: true,
            phone: true,
        },
    });

    if (!user) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
    }
    req.user = user;
    next();
});

export {verifyJWT};

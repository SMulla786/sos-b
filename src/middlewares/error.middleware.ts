import {Request, Response, NextFunction, ErrorRequestHandler} from 'express';
import {ZodError} from 'zod';
import httpStatus from 'http-status';
import {ApiError, ApiResponse, PrismaError} from '@utils/index';
import {Prisma} from '@prisma/client';

const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
    const message = `Cannot find the resource ${req.originalUrl} on the server at ${req.protocol}://${req.get('host')}`;
    const error = new ApiError(httpStatus.NOT_FOUND, message);
    res.status(httpStatus.NOT_FOUND).json(
        new ApiResponse(httpStatus.NOT_FOUND, undefined, message),
    );
    next(error);
};

const errorConverter: ErrorRequestHandler = (err, _req, _res, next) => {
    if (err instanceof ZodError) {
        const message = 'Validation failed';
        const errors = err.errors.map((error) => ({
            field: error.path.join('.'),
            message: error.message,
        }));

        err = new ApiError(httpStatus.BAD_REQUEST, message, errors);
    } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
        err = new PrismaError(err);
    } else if (!(err instanceof ApiError)) {
        const statusCode = httpStatus.INTERNAL_SERVER_ERROR;
        const message = err.message || httpStatus[statusCode];
        err = new ApiError(statusCode, message);
    }

    next(err);
};

const errorHandler: ErrorRequestHandler = (err, _, res, next) => {
    let {statusCode} = err;
    const {message} = err;
    statusCode = statusCode || httpStatus.INTERNAL_SERVER_ERROR;
    res.locals.errorMessage = message;
    res.status(statusCode).json(
        new ApiResponse(statusCode, undefined, message, err.errors || undefined),
    );
    next();
};

export {errorHandler, errorConverter, notFoundHandler};

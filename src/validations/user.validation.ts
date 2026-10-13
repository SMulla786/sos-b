import {z} from 'zod';
import {
    password,
    emailSchema,
    usernameSchema,
    fullnameSchema,
    phoneNumberSchema,
} from './custom.validation';

import {commonValidation} from '@validations/index';

const registerUserSchema = z.object({
    name: fullnameSchema.trim(),
    email: emailSchema.trim(),
    password: password,
    phone: phoneNumberSchema.trim(),
});

const loginUserSchema = z.object({
    email: emailSchema.optional(),
    phone: usernameSchema.optional(),
    password: password,
});

const changePasswordSchema = z.object({
    currentPassword: password,
    newPassword: password,
});

const requestPasswordResetSchema = z.object({
    email: emailSchema,
});

const resetPasswordSchema = z.object({
    newPassword: password,
});

const updateUserSchema = registerUserSchema
    .omit({
        email: true,
        password: true,
    })
    .partial();

const refreshTokenRequestSchema = z.object({
    refreshToken: commonValidation.refreshTokenSchema,
    cookies: z
        .object({
            refreshToken: commonValidation.refreshTokenSchema,
        })
        .refine((data) => data.refreshToken, {
            message: 'Refresh token is required',
            path: ['refreshToken'],
        }),
});

export default {
    registerUserSchema,

    loginUserSchema,
    changePasswordSchema,
    updateUserSchema,
    requestPasswordResetSchema,
    refreshTokenRequestSchema,
    resetPasswordSchema,
};

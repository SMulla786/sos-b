import {z} from 'zod';

const idSchema = z.string().uuid('Invalid ID format.');
const nameSchema = z.string().min(1, 'Name is required.');
const tokenSchema = z.string().min(1, 'Token is required for authentication');
const refreshTokenSchema = z.string().optional();

const paginationSchema = z.object({
    page: z
        .string()
        .transform((val) => parseInt(val, 10))
        .refine((val) => val >= 1, {message: 'Page must be greater than 0'})
        .default('1'),
    limit: z
        .string()
        .transform((val) => parseInt(val, 10))
        .refine((val) => val >= 1, {message: 'Limit must be greater than 0'})
        .default('10'),
});
const searchSchema = z.object({
    searchTerm: z.string().optional().default(''),
});

const paginationAndSearchSchema = paginationSchema.merge(searchSchema);

export default {
    idSchema,
    nameSchema,
    tokenSchema,
    paginationSchema,
    searchSchema,
    paginationAndSearchSchema,
    refreshTokenSchema,
};

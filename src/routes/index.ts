import {Router} from 'express';
import userRoute from './user.routes';

const router = Router();

router.use('/users', userRoute);

export default router;

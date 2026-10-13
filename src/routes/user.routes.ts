import {Router} from 'express';
import {userController} from '@controllers/index';
import {verifyJWT} from '@middlewares/index';

const {
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    changeCurrentPassword,
    updateUser,
    requestPasswordReset,
    resetPassword,
    registerUser,
} = userController;

const router = Router();

// Public routes
router.route('/login').post(loginUser);
router.route('/register').post(registerUser);
router.route('/reset-password-request').post(requestPasswordReset);
router.route('/refresh').post(refreshAccessToken);

// Private routes
router.use(verifyJWT);
router.route('/logout').post(logoutUser);
router.route('/reset-password').post(resetPassword);
router.route('/change-password').post(changeCurrentPassword);
router.route('/me').get(getCurrentUser);
router.route('/update').patch(updateUser);

export default router;

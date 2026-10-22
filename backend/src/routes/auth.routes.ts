import { Router } from 'express';
import {
  login,
  register,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
uploadAvatar,
  verifyEmail,
  resendVerificationEmail,
  googleLogin,
} from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { uploadAvatar as uploadAvatarMiddleware, handleUploadError } from '../middlewares/upload.middleware';

const router = Router();

// Register Account
router.post('/register', register);

// Log In
router.post('/login', login);

// Sign in / sign up with Google
router.post('/google', googleLogin);

// Email verification (registration)
router.get('/verify-email', verifyEmail);
router.post('/resend-email-verify', resendVerificationEmail);

// Get authenticated user
router.get('/me', authenticate, getMe);

// Update Personal Information
router.put('/profile', authenticate, updateProfile);

// Upload Avatar (multipart/form-data)
router.post(
  '/avatar',
  authenticate,
  uploadAvatarMiddleware.single('avatar'),
  handleUploadError,
  uploadAvatar
);

// Change Password
router.post('/change-password', authenticate, changePassword);

// Forgot Password
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export { router as authRouter };

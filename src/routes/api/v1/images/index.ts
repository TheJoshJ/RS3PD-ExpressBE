import express from 'express';
import uploadRoutes from './upload';
import viewRoutes from './view';
import { requireApiKey } from '../../../../middlewares/authMiddleware';

const router = express.Router();

// Apply API key authentication to all image routes
router.use(requireApiKey);

// Image upload routes
router.use('/upload', uploadRoutes);

// Image viewing routes
router.use('/view', viewRoutes);

export default router;

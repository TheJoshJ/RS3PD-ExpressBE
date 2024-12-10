import express from 'express';
import v1Routes from './api/v1';

const router = express.Router();

// Versioned API routes
router.use('/v1', v1Routes);

export default router;

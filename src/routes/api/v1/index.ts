import express from 'express';
import experienceHistoryRoute from './getExperienceHistory'
import playerData from './getPlayerData'
import highScores from './getHighScores'
import images from './images'
import vote from './vote'

const router = express.Router();

router.use('/experience-history', experienceHistoryRoute);
router.use('/player-data', playerData);
router.use('/high-scores', highScores);
router.use('/images', images);
router.use('/vote', vote);
export default router;

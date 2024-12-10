import express from 'express';
import experienceHistoryRoute from './getExperienceHistory'
import playerData from './getPlayerData'
import highScores from './getHighScores'

const router = express.Router();

router.use('/experience-history', experienceHistoryRoute);
router.use('/player-data', playerData);
router.use('/high-scores', highScores);
export default router;

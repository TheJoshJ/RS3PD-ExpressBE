import express, { Request, Response } from 'express';

const router = express.Router();

// Cache for high scores to prevent memory leaks and improve performance
interface HighScoresCache {
  data: any;
  timestamp: number;
  ttl: number;
}

let highScoresCache: HighScoresCache | null = null;
const HIGH_SCORES_CACHE_TTL = 15 * 60 * 1000; // 15 minutes cache for high scores

// Helper function to get cached high scores
function getCachedHighScores(): any | null {
  if (highScoresCache && (Date.now() - highScoresCache.timestamp) < highScoresCache.ttl) {
    return highScoresCache.data;
  }

  // Clear expired cache
  highScoresCache = null;
  return null;
}

// Helper function to set cached high scores
function setCachedHighScores(data: any): void {
  highScoresCache = {
    data,
    timestamp: Date.now(),
    ttl: HIGH_SCORES_CACHE_TTL
  };
}

/**
 * @swagger
 * /api/v1/high-scores:
 *   get:
 *     summary: Get RuneScape high scores ranking
 *     tags: [High Scores]
 *     description: Retrieves the top 50 players from RuneScape's overall skill ranking
 *     responses:
 *       200:
 *         description: High scores data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: RuneScape high scores data structure
 *       500:
 *         description: Server error
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Check cache first
    const cachedData = getCachedHighScores();
    if (cachedData) {
      return res.json(cachedData);
    }

    const response = await fetch(
      'https://secure.runescape.com/m=hiscore/ranking.json?table=0&category=0&size=50'
    );

    if (!response.ok) {
      throw new Error('Failed to fetch high score data');
    }

    const data = await response.json();

    // Cache the result before returning
    setCachedHighScores(data);

    return res.json(data);
  } catch (error: any) {
    console.error(error);
    return res
      .status(500)
      .json({ error: error.message || 'Internal Server Error' });
  }
});

export default router;

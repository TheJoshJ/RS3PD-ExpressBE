import express, { Request, Response } from 'express';

const router = express.Router();

// Cache for vote data to prevent memory leaks and improve performance
interface VoteDataCache {
  data: any;
  timestamp: number;
  ttl: number;
}

let voteDataCache: VoteDataCache | null = null;
const VOTE_DATA_CACHE_TTL = 10 * 1000; // 10 seconds cache for vote data

// Helper function to get cached vote data
function getCachedVoteData(): any | null {
  if (voteDataCache && (Date.now() - voteDataCache.timestamp) < voteDataCache.ttl) {
    return voteDataCache.data;
  }

  // Clear expired cache
  voteDataCache = null;
  return null;
}

// Helper function to set cached vote data
function setCachedVoteData(data: any): void {
  voteDataCache = {
    data,
    timestamp: Date.now(),
    ttl: VOTE_DATA_CACHE_TTL
  };
}

/**
 * @swagger
 * /api/v1/vote:
 *   get:
 *     summary: Get RuneScape Treasure Hunter poll results
 *     tags: [Vote Data]
 *     description: Retrieves the current vote count for the Treasure Hunter poll
 *     responses:
 *       200:
 *         description: Vote data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 votes:
 *                   type: integer
 *                   description: Number of votes in the poll
 *                   example: 25940
 *       500:
 *         description: Server error
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Check cache first
    const cachedData = getCachedVoteData();
    if (cachedData) {
      return res.json(cachedData);
    }

    const response = await fetch(
      'https://secure.runescape.com/m=poll/a=13/treasure-hunter-poll-results-ajax'
    );

    if (!response.ok) {
      throw new Error('Failed to fetch vote data');
    }

    const data = await response.json();

    // Cache the result before returning
    setCachedVoteData(data);

    return res.json(data);
  } catch (error: any) {
    console.error(error);
    return res
      .status(500)
      .json({ error: error.message || 'Internal Server Error' });
  }
});

export default router;

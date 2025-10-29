import express from 'express';

const router = express.Router();

// Cache for experience history to prevent memory leaks and improve performance
interface ExpHistoryCache {
  data: any;
  timestamp: number;
  ttl: number;
}

const expHistoryCache = new Map<string, ExpHistoryCache>();
const EXP_HISTORY_CACHE_TTL = 30 * 60 * 1000; // 30 minutes cache for exp history

// Helper function to get cached exp history
function getCachedExpHistory(cacheKey: string): any | null {
  const cached = expHistoryCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < cached.ttl) {
    return cached.data;
  }

  // Clean up expired cache entries
  if (cached) {
    expHistoryCache.delete(cacheKey);
  }

  return null;
}

// Helper function to set cached exp history
function setCachedExpHistory(cacheKey: string, data: any): void {
  expHistoryCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    ttl: EXP_HISTORY_CACHE_TTL
  });
}

/**
 * @swagger
 * /api/v1/experience-history:
 *   get:
 *     summary: Get player's monthly experience history for a specific skill
 *     tags: [Experience History]
 *     parameters:
 *       - in: query
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: RuneScape player username
 *         example: "Zezima"
 *       - in: query
 *         name: skillId
 *         required: true
 *         schema:
 *           type: string
 *         description: Skill ID (0-28)
 *         example: "0"
 *     responses:
 *       200:
 *         description: Experience history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: Monthly experience gain data for the specified skill
 *       400:
 *         description: Username and skillId parameters are required
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  const username = req.query.username as string;
  const skillId = req.query.skillId as string;

  if (!username || !skillId) {
    return res
      .status(400)
      .json({ error: 'username and skillId query parameters are required.' });
  }

  try {
    // Create cache key based on username and skillId
    const cacheKey = `${username.toLowerCase()}:${skillId}`;

    // Check cache first
    const cachedData = getCachedExpHistory(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    const response = await fetch(
      `https://apps.runescape.com/runemetrics/xp-monthly?searchName=${encodeURIComponent(
        username
      )}&skillid=${encodeURIComponent(skillId)}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch player exp history');
    }

    const data = await response.json();

    // Cache the result before returning
    setCachedExpHistory(cacheKey, data);

    return res.json(data);
  } catch (error: any) {
    console.error(error);
    return res
      .status(500)
      .json({ error: error.message || 'Internal Server Error' });
  }
});

export default router;

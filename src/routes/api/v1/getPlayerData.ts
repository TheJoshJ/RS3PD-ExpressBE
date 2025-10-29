import express, { Request, Response } from 'express';

interface activities {
  date: string;
  details: string;
  text: string;
}

interface skillValues {
  level: number;
  xp: number;
  rank: number;
  id: number;
}

interface quest {
  title: string;
  status: string;
  difficulty: number;
  members: boolean;
  questPoints: number;
  userEligible: boolean;
}

interface PlayerData {
  magic: number;
  questsStarted: number;
  totalskill: number;
  questscomplete: number;
  questsstarted: number;
  totalXp: number;
  ranged: number;
  activities: activities[];
  skillvalues: skillValues[];
  name: string;
  melee: number;
  combatlevel: number;
  loggedIn: string;
  quests: quest[];
}

const router = express.Router();

// Cache for player data to prevent memory leaks and improve performance
interface PlayerDataCache {
  data: PlayerData;
  timestamp: number;
  ttl: number;
}

const playerDataCache = new Map<string, PlayerDataCache>();
const PLAYER_DATA_CACHE_TTL = 10 * 60 * 1000; // 10 minutes cache for player data

// Helper function to get cached player data
function getCachedPlayerData(cacheKey: string): PlayerData | null {
  const cached = playerDataCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < cached.ttl) {
    return cached.data;
  }

  // Clean up expired cache entries
  if (cached) {
    playerDataCache.delete(cacheKey);
  }

  return null;
}

// Helper function to set cached player data
function setCachedPlayerData(cacheKey: string, data: PlayerData): void {
  playerDataCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    ttl: PLAYER_DATA_CACHE_TTL
  });
}

/**
 * @swagger
 * /api/v1/player-data:
 *   get:
 *     summary: Get RuneScape player data
 *     tags: [Player Data]
 *     parameters:
 *       - in: query
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: RuneScape player username
 *         example: "Zezima"
 *       - in: query
 *         name: quests
 *         schema:
 *           type: string
 *           enum: ["true"]
 *         description: Include quest data in response
 *         example: "true"
 *     responses:
 *       200:
 *         description: Player data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 magic:
 *                   type: integer
 *                 questsStarted:
 *                   type: integer
 *                 totalskill:
 *                   type: integer
 *                 questscomplete:
 *                   type: integer
 *                 questsstarted:
 *                   type: integer
 *                 totalXp:
 *                   type: integer
 *                 ranged:
 *                   type: integer
 *                 activities:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                       details:
 *                         type: string
 *                       text:
 *                         type: string
 *                 skillvalues:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       level:
 *                         type: integer
 *                       xp:
 *                         type: integer
 *                       rank:
 *                         type: integer
 *                       id:
 *                         type: integer
 *                 name:
 *                   type: string
 *                 melee:
 *                   type: integer
 *                 combatlevel:
 *                   type: integer
 *                 loggedIn:
 *                   type: string
 *                 quests:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                       status:
 *                         type: string
 *                       difficulty:
 *                         type: integer
 *                       members:
 *                         type: boolean
 *                       questPoints:
 *                         type: integer
 *                       userEligible:
 *                         type: boolean
 *       400:
 *         description: Username parameter is required
 *       500:
 *         description: Server error
 */
router.get(
  '/',
  async (
    req: Request<unknown, unknown, unknown, { username?: string; quests?: string }>,
    res: Response
  ) => {
    const { username, quests } = req.query;

    if (!username) {
      return res
        .status(400)
        .json({ error: 'The "username" query parameter is required.' });
    }

    try {
      // Create cache key based on username and quests parameter
      const cacheKey = `${username.toLowerCase()}:${quests || 'false'}`;

      // Check cache first
      const cachedData = getCachedPlayerData(cacheKey);
      if (cachedData) {
        return res.json(cachedData);
      }

      // Fetch the main player data
      const playerResponse = await fetch(
        `https://apps.runescape.com/runemetrics/profile/profile?user=${encodeURIComponent(
          username
        )}&activities=0`
      );

      if (!playerResponse.ok) {
        throw new Error('Failed to fetch player data');
      }

      const data = (await playerResponse.json()) as PlayerData;

      // If quests is 'true', fetch and merge the quest data
      if (quests === 'true') {
        const questResponse = await fetch(
          `https://apps.runescape.com/runemetrics/quests?user=${encodeURIComponent(username)}`
        );

        if (!questResponse.ok) {
          throw new Error('Failed to fetch quest data');
        }

        const questData = (await questResponse.json()) as { quests: quest[] };
        data.quests = questData.quests;
      }

      // Cache the result before returning
      setCachedPlayerData(cacheKey, data);

      return res.json(data);
    } catch (error: any) {
      console.error(error);
      return res
        .status(500)
        .json({ error: error.message || 'Internal Server Error' });
    }
  }
);

export default router;

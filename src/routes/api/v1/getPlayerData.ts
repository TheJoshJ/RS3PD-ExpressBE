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
}

const router = express.Router();

router.get(
  '/',
  async (
    req: Request<unknown, unknown, unknown, { username?: string }>,
    res: Response
  ) => {
    const { username } = req.query;

    if (!username) {
      return res
        .status(400)
        .json({ error: 'The "username" query parameter is required.' });
    }

    try {
      const response = await fetch(
        `https://apps.runescape.com/runemetrics/profile/profile?user=${encodeURIComponent(
          username
        )}&activities=0`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch player data');
      }

      const data = (await response.json()) as PlayerData;
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

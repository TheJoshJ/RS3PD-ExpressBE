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

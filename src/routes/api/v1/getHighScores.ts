import express, { Request, Response } from 'express';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const response = await fetch(
      'https://secure.runescape.com/m=hiscore/ranking.json?table=0&category=0&size=50'
    );

    if (!response.ok) {
      throw new Error('Failed to fetch high score data');
    }

    const data = await response.json();

    return res.json(data);
  } catch (error: any) {
    console.error(error);
    return res
      .status(500)
      .json({ error: error.message || 'Internal Server Error' });
  }
});

export default router;

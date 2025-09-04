import express, { Request, Response } from 'express';

const router = express.Router();

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

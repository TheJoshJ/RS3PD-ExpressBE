import express from 'express';

const router = express.Router();

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
    const response = await fetch(
      `https://apps.runescape.com/runemetrics/xp-monthly?searchName=${encodeURIComponent(
        username
      )}&skillid=${encodeURIComponent(skillId)}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch player exp history');
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

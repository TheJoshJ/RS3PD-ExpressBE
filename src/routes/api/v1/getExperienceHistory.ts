import express from 'express';

const router = express.Router();

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

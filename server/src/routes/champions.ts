import { Router, Request, Response } from 'express';
import Champion from '../models/Champion';

const router = Router();

//GET /api/champions - list all champions
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const champions = await Champion.find().select('-__v').lean();
    res.json(champions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch champions' });
  }
});

//GET /api/champions/:id - single champion by Data Dragon ID
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const champion = await Champion.findOne({ id: req.params.id })
      .select('-__v')
      .lean();

    if (!champion) {
      res.status(404).json({ error: `Champion '${req.params.id}' not found` });
      return;
    }

    res.json(champion);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch champion' });
  }
});

export default router;

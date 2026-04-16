import { Router } from 'express';
import { recommend } from '../controllers/recommendController';

const router = Router();

//POST /api/recommend
router.post('/', recommend);

export default router;

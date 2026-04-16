import { Router } from 'express';
import { getBuild } from '../controllers/buildController';

const router = Router();

//POST /api/build
router.post('/', getBuild);

export default router;

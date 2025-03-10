import { Router } from 'express';
import * as aiController from '../controllers/ai.controller.js';
const router = Router();

router.get('/get-result', aiController.getResult)

//get export
export default router;
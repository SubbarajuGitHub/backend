import express from 'express';
import { receiveEvent } from '../controllers/tracking.js';

const router = express.Router();

router.post('/event', receiveEvent);

export default router;

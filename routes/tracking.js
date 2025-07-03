import express from 'express';
import { getBrowsers, getCountries, getSessionStats, getTopChannels, getTopEntryPages, getTopExitPages, getUniqueVisitorCount, receiveEvent } from '../controllers/tracking.js';
import {getEvents} from "../controllers/tracking.js"

const router = express.Router();

router.post('/event', receiveEvent);

export default router;

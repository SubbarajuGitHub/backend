import express from 'express';
import trackingRoutes from './routes/tracking.js';
import getStats from "./routes/stats.js";
import cors from 'cors';

const app = express();
app.use(express.json()); // Required for JSON body
app.use(cors());
app.use(cors({
  origin: '*', // the origin serving your test.html
  methods: ['GET', 'POST', 'OPTIONS'],
}));

// Mount route
app.use('/track', trackingRoutes);
app.use("/stats", getStats )

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

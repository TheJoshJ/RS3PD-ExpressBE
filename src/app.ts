import express from 'express';
import cors from 'cors';
import apiRouter from './routes';

export const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Healthcheck
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// REST API
app.use('/api', apiRouter);

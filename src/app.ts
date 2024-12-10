import express from 'express';
import cors from 'cors';
import apiRouter from './routes';

export const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.raw({ type: 'application/vnd.custom-type' }));
app.use(express.text({ type: 'text/html' }));

// Healthcheck
app.get('/', (req, res) => {
  res.status(200).send({ status: 'ok' });
});

// v1 routes
app.use('/api', apiRouter);
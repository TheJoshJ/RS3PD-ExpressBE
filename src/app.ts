import express from 'express';
import cors from 'cors';
import apiRouter from './routes';
import { buildSchema } from 'graphql';
import { createHandler } from 'graphql-http/lib/use/express';

var schema = buildSchema(`
  type Query {
    hello: String
  }
`);

var root = {
  hello() {
    return 'Hello world!';
  }
};

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

app.all(
  '/graphql',
  createHandler({
    schema: schema,
    rootValue: root
  })
);

// v1 routes
app.use('/api', apiRouter);

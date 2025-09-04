import express from 'express';
import cors from 'cors';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import apiRouter from './routes';

export const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Healthcheck
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'RS3 Player Dashboard API',
      version: '1.0.0',
      description: 'API for RuneScape 3 Player Dashboard with image upload and management',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'API Key',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/**/*.ts'], // Path to the API routes
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// REST API
app.use('/api', apiRouter);

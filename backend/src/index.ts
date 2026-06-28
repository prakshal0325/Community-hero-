import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import env from './config/env.js';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { generalLimiter } from './middlewares/rateLimiter.js';
import { initializeSocket } from './socket/index.js';

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = initializeSocket(httpServer);

// ─── Security Middleware ─────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin: [env.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(generalLimiter);

// ─── Body Parsing ────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Static Files ────────────────────────────────────────────
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ─── Swagger Documentation ───────────────────────────────────
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Community Hero API',
      version: '1.0.0',
      description: 'AI-Powered Hyperlocal Problem Solver API',
      contact: {
        name: 'Community Hero Team',
        email: 'support@communityhero.app',
      },
    },
    servers: [
      { url: `http://localhost:${env.PORT}`, description: 'Development server' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Community Hero API Docs',
  customCss: '.swagger-ui .topbar { display: none }',
}));

app.get('/api/docs.json', (_req, res) => {
  res.json(swaggerSpec);
});

// ─── API Routes ──────────────────────────────────────────────
app.use('/api/v1', routes);

// ─── Root Route ──────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    name: 'Community Hero API',
    version: '1.0.0',
    docs: '/api/docs',
    health: '/api/v1/health',
  });
});

// ─── Error Handler ───────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────────
const PORT = parseInt(env.PORT);

httpServer.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════════╗');
  console.log('  ║                                              ║');
  console.log('  ║   🦸 Community Hero API Server               ║');
  console.log('  ║                                              ║');
  console.log(`  ║   🚀 Server:  http://localhost:${PORT}          ║`);
  console.log(`  ║   📖 API Docs: http://localhost:${PORT}/api/docs ║`);
  console.log(`  ║   🔌 Socket.IO: Connected                    ║`);
  console.log(`  ║   🌍 Environment: ${env.NODE_ENV.padEnd(24)}║`);
  console.log('  ║                                              ║');
  console.log('  ╚══════════════════════════════════════════════╝');
  console.log('');
});

// ─── Graceful Shutdown ───────────────────────────────────────
const shutdown = async () => {
  console.log('\n🛑 Shutting down gracefully...');
  io.close();
  httpServer.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('⚠️  Forced shutdown');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default app;

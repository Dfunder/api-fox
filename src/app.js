const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { sendSuccess } = require('./utils/response');
const { getLoggerStream } = require('./utils/logger');
const authRoutes = require('./routes/auth.routes');

const app = express();

const allowedOrigins =
  process.env.ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()) || [];

app.use(express.json());
app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Authorization', 'Content-Type'],
  })
);
app.use(helmet());

// Determine logging format based on environment
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat, { stream: getLoggerStream() }));

app.get('/api/health', (req, res) => {
  sendSuccess(res, { status: 'ok' }, 200, 'Server is healthy');
});

// Auth routes
app.use('/api/auth', authRoutes);

// Global error handling middleware - must be registered last
const errorHandler = require('./middlewares/errorHandler');
app.use(errorHandler);

module.exports = app;

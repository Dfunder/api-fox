require('dotenv').config();

const { validateEnvironmentVariables } = require('./config/env');
const app = require('./app');
const connectDB = require('./config/db');

// Validate required environment variables on startup
validateEnvironmentVariables();

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
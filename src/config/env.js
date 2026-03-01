/**
 * Environment variable validation utility
 * Validates required environment variables on application startup
 */

const requiredEnvVars = [
  'PORT',
  'MONGO_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'JWT_EXPIRES_IN',
  'EMAIL_HOST',
  'EMAIL_PORT',
  'EMAIL_USER',
  'EMAIL_PASS',
  'STELLAR_HORIZON_URL',
  'STELLAR_NETWORK'
];

/**
 * Validates that all required environment variables are present
 * Throws an error if any required variable is missing
 */
const validateEnvironmentVariables = () => {
  const missingEnvVars = [];

  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      missingEnvVars.push(envVar);
    }
  });

  if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingEnvVars.forEach(envVar => {
      console.error(`   - ${envVar}`);
    });
    console.error('\nPlease add these variables to your .env file');
    process.exit(1);
  }

  console.log('✅ All required environment variables are present');
};

module.exports = { validateEnvironmentVariables };
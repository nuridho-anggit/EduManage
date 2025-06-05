require('dotenv').config({ path: __dirname + '/../../.env' }); // Load environment variables
const Jwt = require('@hapi/jwt');

// Destructure environment variables for JWT config
const {
  JWT_SECRET,
  JWT_AUDIENCE,
  JWT_ISSUER,
  JWT_ALGORITHM,
} = process.env;

/**
 * Generates a JWT for the authenticated user.
 * 
 * @param {Object} user - User object from DynamoDB.
 * @returns {string} - JWT token string.
 */
const generateToken = (user) => {
  const token = Jwt.token.generate(
    {
      aud: JWT_AUDIENCE,
      iss: JWT_ISSUER,
      sub: user.userId, // Use userId from DynamoDB
      user: user,
    },
    {
      key: JWT_SECRET,
      algorithm: JWT_ALGORITHM,
    },
    {
      ttlSec: 14400, // 4 hours
    }
  );

  return token;
};

/**
 * Validates a JWT token.
 * 
 * @param {Object} artifacts - Decoded token payload.
 * @param {Object} request - Hapi.js request.
 * @param {Object} h - Hapi.js response toolkit.
 * @returns {Object} - Token validity and user credentials.
 */
const validateToken = (artifacts, request, h) => {
  const isValid = artifacts.decoded.payload.aud === JWT_AUDIENCE;
  const sub = artifacts.decoded.payload.sub;

  if (!sub) {
    console.log('Token sub value is missing or invalid');
    return { isValid: false };
  }

  return {
    isValid,
    credentials: { user: artifacts.decoded.payload.user },
  };
};

module.exports = { generateToken, validateToken };
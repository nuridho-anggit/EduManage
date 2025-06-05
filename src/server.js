require('dotenv').config(); // Load environment variables from .env file
const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');
const routes = require('./routes');
const { validateToken } = require('./config/token');

const init = async () => {
    // Create the Hapi server instance
    const server = Hapi.server({
        port: process.env.PORT || 3000,
        host: 'localhost',
        routes: {
            cors: { origin: ['*'] }, // Enable CORS for all origins
        },
    });

  // Register JWT plugin for handling authentication
  await server.register(Jwt);

  // Configure JWT authentication
  const jwtConfig = {
    keys: process.env.JWT_SECRET, // Secret key used to sign JWT
    verify: {
      aud: process.env.JWT_AUDIENCE, // Audience of the token (application identifier)
      iss: process.env.JWT_ISSUER, // Issuer of the token
      sub: false, // Do not check for subject
    },
    validate: validateToken, // Function to validate JWT on each request
  };

  // Set up JWT authentication strategy
  server.auth.strategy('jwt', 'jwt', jwtConfig);

  // Register routes defined in the routes file
  server.route(routes);


  // Start the Hapi server
  await server.start();
  console.log(`Server running on ${server.info.uri}`); // Log server URL
};

// Handle unhandled promise rejections (e.g., database connection errors, unhandled routes, etc.)
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  process.exit(1); // Exit the process if an unhandled rejection occurs
});

init();

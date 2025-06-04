require('dotenv').config(); // Load environment variables from .env file
const Hapi = require('@hapi/hapi');
const routes = require('./routes');

const init = async () => {
    // Create the Hapi server instance
    const server = Hapi.server({
        port: process.env.PORT || 3000,
        host: 'localhost',
        routes: {
            cors: { origin: ['*'] }, // Enable CORS for all origins
        },
    });

    // Register routes defined in the routes file
    server.route(routes);

    // Start the Hapi server
    await server.start();
    console.log(`Server running on ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err.message);
    process.exit(1);
});

init();

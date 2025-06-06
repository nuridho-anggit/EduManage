const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");
require("dotenv").config();

// Initialize DynamoDB client and DocumentClient
const ddbClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_DYNAMODB,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_DYNAMODB,
  },
});
const docClient = DynamoDBDocumentClient.from(ddbClient);

/**
 * Handles user profile retrieval by extracting user ID from the JWT token.
 *
 * @param {Object} request - The Hapi.js request object, which includes the authorization header with the JWT token.
 * @param {Object} h - The Hapi.js response toolkit.
 * @returns {Object} - User profile data if successful, or error message.
 */
const getProfileHandler = async (request, h) => {
  const { user } = request.auth.credentials;
  const userId = user.userId || user.UserId;

  try {
    // Query DynamoDB to retrieve the user profile
    const result = await docClient.send(
      new GetCommand({
        TableName: "userAccess",
        Key: { UserId: userId },
      })
    );

    // Check if the user is found in the table
    if (!result.Item) {
      return h.response({ status: "fail", message: "User tidak ditemukan" }).code(404);
    }

    // Extract the necessary attributes from the result
    const { UserId, nama, email, role } = result.Item;

    // Return the user profile data
    return h.response({
      status: "success",
      data: { UserId, nama, email, role },
    }).code(200);

  } catch (error) {
    console.error("Get profile error:", error);
    return h
      .response({ status: "fail", message: "Terjadi kesalahan server" })
      .code(500);
  }
};

module.exports = getProfileHandler;

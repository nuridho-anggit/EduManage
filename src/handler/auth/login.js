const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const bcrypt = require("bcrypt");
const { generateToken } = require("../../config/token");
require("dotenv").config();

/**
 * Handles user login with DynamoDB.
 *
 * @param {Object} request - The Hapi.js request object.
 * @param {Object} h - The Hapi.js response toolkit.
 * @returns {Object} - JWT token and user data if successful, or error message.
 */
const loginHandler = async (request, h) => {
  const { email, password } = request.payload;

  // Init DynamoDB
  const client = new DynamoDBClient({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_DYNAMODB,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_DYNAMODB,
    },
  });

  const docClient = DynamoDBDocumentClient.from(client);

  try {
    const scanCommand = new ScanCommand({
      TableName: "userAccess",
      FilterExpression: "email = :email",
      ExpressionAttributeValues: {
        ":email": email,
      },
    });

    const result = await docClient.send(scanCommand);

    if (!result.Items || result.Items.length === 0) {
      return h.response({
        status: 401,
        message: "User not found",
      }).code(401);
    }

    const user = result.Items[0];

    // Normalize userId from UserId if necessary
    user.userId = user.userId || user.UserId;

    if (!user.userId) {
      console.error("userId is missing from user record:", user);
      return h.response({
        status: 500,
        message: "User data invalid (missing userId)",
      }).code(500);
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return h.response({
        status: 401,
        message: "Wrong password",
      }).code(401);
    }

    const token = generateToken(user);

    return h
      .response({
        status: 200,
        message: "Login successful",
        data: {
          token,
          user: {
            id: user.userId,
            name: user.nama, // jika pakai `nama`, bukan `name`
            email: user.email,
            role: user.role,
          },
        },
      })
      .code(200);
  } catch (error) {
    console.error("Login error:", error);
    return h.response({
      status: 500,
      message: "Internal Server Error",
    }).code(500);
  }
};

module.exports = loginHandler;
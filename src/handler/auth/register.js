require("dotenv").config();
const { nanoid } = require("nanoid");
const bcrypt = require("bcrypt");
const { docClient } = require("../../utils/AWS-Client"); 

const { ScanCommand, GetCommand, PutCommand } = require("@aws-sdk/lib-dynamodb");

/**
 * Handler function to register a new user in DynamoDB.
 *
 * @param {Object} request - The Hapi.js request object containing name, email, password.
 * @param {Object} h - The Hapi.js response toolkit.
 * @returns {Object} - Response indicating success or failure.
 */
const registerHandler = async (request, h) => {
  const { nama, email, password, nomorTelepon, alamat, tanggalLahir, role} = request.payload;

  try {
    // Check if the email already exists
    const scanCommand = new ScanCommand({
      TableName: "userAccess",
      FilterExpression: "email = :email",
      ExpressionAttributeValues: {
        ":email": email,
      },
    });

    const scanResult = await docClient.send(scanCommand);

    if (scanResult.Items && scanResult.Items.length > 0) {
      return h.response({
        status: 400,
        message: "Email already exists",
      }).code(400);
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const UserId = `user-${nanoid(16)}`;

    const newUser = {
      UserId,
      nama,
      email,
      password: hashedPassword,
      role, // Default role
      nomorTelepon,
      alamat,
      tanggalLahir
    };

    const putCommand = new PutCommand({
      TableName: "userAccess",
      Item: newUser,
    });

    await docClient.send(putCommand);

    return h.response({
      status: 201,
      message: "User registered successfully",
      data: {
        UserId,
        nama,
        email,
        role: newUser.role,
      },
    }).code(201);
  } catch (error) {
    console.error("Register error:", error);
    return h.response({
      status: 500,
      message: "Server error",
    }).code(500);
  }
  
};

module.exports = registerHandler;
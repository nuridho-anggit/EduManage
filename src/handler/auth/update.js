require("dotenv").config();
const bcrypt = require("bcrypt");
const { docClient } = require("../../utils/AWS-Client");
const { UpdateCommand } = require("@aws-sdk/lib-dynamodb");

/**
 * Handler function to update user information in DynamoDB.
 *
 * @param {Object} request - The Hapi.js request object containing user data.
 * @param {Object} h - The Hapi.js response toolkit.
 * @returns {Object} - Response indicating success or failure.
 */
const updateHandler = async (request, h) => {
  const { email, password, nomorTelepon, alamat, tanggalLahir } = request.payload;
  const { user } = request.auth.credentials;
  const userId = user.userId || user.UserId;

  try {
    // Initialize expression components
    const updateExpressionParts = [];
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    // Dynamically build the update expression
    if (email) {
      updateExpressionParts.push("#email = :email");
      expressionAttributeValues[":email"] = email;
      expressionAttributeNames["#email"] = "email";
    }
    if (password) {
      const hashedPassword = bcrypt.hashSync(password, 10);
      updateExpressionParts.push("#password = :password");
      expressionAttributeValues[":password"] = hashedPassword;
      expressionAttributeNames["#password"] = "password";
    }
    if (nomorTelepon) {
      updateExpressionParts.push("#nomorTelepon = :nomorTelepon");
      expressionAttributeValues[":nomorTelepon"] = nomorTelepon;
      expressionAttributeNames["#nomorTelepon"] = "nomorTelepon";
    }
    if (alamat) {
      updateExpressionParts.push("#alamat = :alamat");
      expressionAttributeValues[":alamat"] = alamat;
      expressionAttributeNames["#alamat"] = "alamat";
    }
    if (tanggalLahir) {
      updateExpressionParts.push("#tanggalLahir = :tanggalLahir");
      expressionAttributeValues[":tanggalLahir"] = tanggalLahir;
      expressionAttributeNames["#tanggalLahir"] = "tanggalLahir";
    }

    // If no fields to update, return an error
    if (updateExpressionParts.length === 0) {
      return h.response({
        status: 400,
        message: "No fields to update",
      }).code(400);
    }

    // Construct the update expression
    const updateExpression = "SET " + updateExpressionParts.join(", ");

    // Prepare the update command
    const updateCommand = new UpdateCommand({
      TableName: "userAccess",
      Key: { UserId: userId },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW",
    });

    // Execute the update command
    const result = await docClient.send(updateCommand);

    // Return the updated user data
    return h.response({
      status: 200,
      message: "User updated successfully",
      data: result.Attributes,
    }).code(200);
  } catch (error) {
    console.error("Update error:", error);
    return h.response({
      status: 500,
      message: "Server error",
    }).code(500);
  }
};

module.exports = updateHandler;

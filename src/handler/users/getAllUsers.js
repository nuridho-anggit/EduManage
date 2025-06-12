const { ScanCommand } = require("@aws-sdk/lib-dynamodb");
const { docClient } = require("../../utils/AWS-Client");

const getAllUsersHandler = async (request, h) => {
  const { user } = request.auth.credentials;

  // Pastikan hanya admin yang boleh akses
  if (user.role !== "admin") {
    return h.response({ status: "fail", message: "Akses ditolak" }).code(403);
  }

  try {
    const result = await docClient.send(
      new ScanCommand({
        TableName: "userAccess",
      })
    );

    return h.response({
      status: "success",
      data: result.Items,
    }).code(200);
  } catch (error) {
    console.error("Error fetching users:", error);
    return h.response({
      status: "fail",
      message: "Gagal mengambil data user",
    }).code(500);
  }
};

module.exports = getAllUsersHandler;

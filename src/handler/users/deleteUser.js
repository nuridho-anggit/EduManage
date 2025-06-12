const { DeleteCommand } = require("@aws-sdk/lib-dynamodb");
const { docClient } = require("../../utils/AWS-Client");

const deleteUserByIdHandler = async (request, h) => {
  const { user } = request.auth.credentials;
  const { id } = request.params;

  if (user.role !== "admin") {
    return h.response({ message: "Akses ditolak" }).code(403);
  }

  try {
    await docClient.send(
      new DeleteCommand({
        TableName: "userAccess",
        Key: { UserId: id },
      })
    );

    return h.response({ message: "User berhasil dihapus" }).code(200);
  } catch (err) {
    console.error(err);
    return h.response({ message: "Gagal menghapus user" }).code(500);
  }
};

module.exports = deleteUserByIdHandler;
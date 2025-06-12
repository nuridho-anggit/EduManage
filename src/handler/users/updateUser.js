const { UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { docClient } = require("../../utils/AWS-Client");
const bcrypt = require("bcrypt");

const updateUserByIdHandler = async (request, h) => {
  const { user } = request.auth.credentials;
  const { id } = request.params;
  const { email, password, nomorTelepon, alamat, tanggalLahir, role } = request.payload;

  if (user.role !== "admin") {
    return h.response({ message: "Akses ditolak" }).code(403);
  }

  try {
    const updateParts = [];
    const attrValues = {};
    const attrNames = {};

    if (email) {
      updateParts.push("#email = :email");
      attrValues[":email"] = email;
      attrNames["#email"] = "email";
    }
    if (password) {
      updateParts.push("#password = :password");
      attrValues[":password"] = bcrypt.hashSync(password, 10);
      attrNames["#password"] = "password";
    }
    if (nomorTelepon) {
      updateParts.push("#nomorTelepon = :nomorTelepon");
      attrValues[":nomorTelepon"] = nomorTelepon;
      attrNames["#nomorTelepon"] = "nomorTelepon";
    }
    if (alamat) {
      updateParts.push("#alamat = :alamat");
      attrValues[":alamat"] = alamat;
      attrNames["#alamat"] = "alamat";
    }
    if (tanggalLahir) {
      updateParts.push("#tanggalLahir = :tanggalLahir");
      attrValues[":tanggalLahir"] = tanggalLahir;
      attrNames["#tanggalLahir"] = "tanggalLahir";
    }
    if (role) {
      updateParts.push("#role = :role");
      attrValues[":role"] = role;
      attrNames["#role"] = "role";
    }

    if (updateParts.length === 0) {
      return h.response({ message: "Tidak ada data untuk diperbarui" }).code(400);
    }

    const updateCommand = new UpdateCommand({
      TableName: "userAccess",
      Key: { UserId: id },
      UpdateExpression: "SET " + updateParts.join(", "),
      ExpressionAttributeNames: attrNames,
      ExpressionAttributeValues: attrValues,
      ReturnValues: "ALL_NEW",
    });

    const result = await docClient.send(updateCommand);

    return h.response({
      message: "User berhasil diperbarui",
      data: result.Attributes,
    }).code(200);
  } catch (err) {
    console.error(err);
    return h.response({ message: "Gagal memperbarui user" }).code(500);
  }
};

module.exports = updateUserByIdHandler;

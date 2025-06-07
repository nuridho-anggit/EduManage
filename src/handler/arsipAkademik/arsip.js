const { PutCommand, QueryCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const { nanoid } = require("nanoid");
const mime = require("mime-types");
const dayjs = require("dayjs");
const { uploadToS3Private, docClient } = require("../../utils/AWS-Client"); // hanya ini sekarang
require("dotenv").config();

const inputArsipAkademikHandler = async (request, h) => {
  const { namaFile, file } = request.payload;
  const { user } = request.auth.credentials;

  const userId = user.userId || user.UserId;
  const nama = user.nama;
  const role = user.role;
  const userUploader = userId

  if (!file || !file.hapi || !file.hapi.headers) {
    return h.response({  
      status: "fail",
      message: "File tidak ditemukan atau format tidak valid",
    }).code(400);
  }

  try {
    const contentType = file.hapi.headers["content-type"];
    const fileExtension = mime.extension(contentType);
    const fileName = `${namaFile}.${fileExtension}`;

    // Read file buffer
    const chunks = [];
    for await (const chunk of file) {
      chunks.push(chunk);
    }
    const fileBuffer = Buffer.concat(chunks);

    // Upload to S3 dan dapatkan URL publik
    const fileLocation = await uploadToS3Private(process.env.AWS_S3_BUCKET_NAME_ARSIP_AKADEMIK, userUploader, fileName, fileBuffer, contentType);

    // Simpan data izin ke DynamoDB
    const arsipId = `arsip-${nanoid(4)}`;
    const tanggal = dayjs().format("YYYY-MM-DD");

    const newArsip = {
      arsipId,
      userId,
      namaFile,
      nama,
      tanggal,
      file: fileLocation,
    };

    await docClient.send(
      new PutCommand({
        TableName: "arsipAkademik",
        Item: newArsip,
      })
    );

    return h.response({
      status: "success",
      message: "Arsip berhasil disimpan",
      data: newArsip,
    }).code(201);
  } catch (error) {
    console.error("Input izin error:", error);
    return h
      .response({ status: "fail", message: "Terjadi kesalahan server" })
      .code(500);
  }
};

const getArsipAkademikHandler = async (request, h) => {
  const { user } = request.auth.credentials;
  const userId = user.userId || user.UserId;

  // BUG: kalau dari dynamoDB role user diubah.. maka disini tidak bisa berubah

  try {
    const result = await docClient.send(
      new ScanCommand({
        TableName: "arsipAkademik", // Nama tabel utama
        FilterExpression: "userId = :userId", // Filter berdasarkan userId
        ExpressionAttributeValues: {
          ":userId": userId, // Ganti dengan userId yang dicari
        },
      })
    );

    return h.response({ status: "success", data: result.Items }).code(200);
  } catch (error) {
    console.error("Get Arsip Akademik error:", error);
    return h
      .response({ status: "fail", message: "Terjadi kesalahan server" })
      .code(500);
  }
};

module.exports = { inputArsipAkademikHandler, getArsipAkademikHandler };

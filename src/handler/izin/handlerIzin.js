const { PutCommand, QueryCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { nanoid } = require("nanoid");
const { ScanCommand } = require("@aws-sdk/lib-dynamodb");

const mime = require("mime-types");
const dayjs = require("dayjs");
const { uploadToS3Private, docClient } = require("../../utils/AWS-Client"); // hanya ini sekarang
require("dotenv").config();


const inputIzinHandler = async (request, h) => {
  const { keterangan, file } = request.payload;
  const { user } = request.auth.credentials;

  const userId = user.userId || user.UserId;
  const nama = user.nama;
  const role = user.role;
  const userUploader = user.userId;
  const nomorIzinId = nanoid(8);

  if (!file || !file.hapi || !file.hapi.headers) {
    return h.response({
      status: "fail",
      message: "File tidak ditemukan atau format tidak valid",
    }).code(400);
  }

  try {
    const contentType = file.hapi.headers["content-type"];
    const fileExtension = mime.extension(contentType);
    const fileName = `${keterangan}-${nomorIzinId}.${fileExtension}`;

    // Read file buffer
    const chunks = [];
    for await (const chunk of file) {
      chunks.push(chunk);
    }
    const fileBuffer = Buffer.concat(chunks);

    // Upload to S3 dan dapatkan URL publik
    const fileLocation = await uploadToS3Private(process.env.AWS_S3_BUCKET_NAME_SURAT_IZIN, userUploader, fileName, fileBuffer, contentType);

    // Simpan data izin ke DynamoDB
    const izinId = `${keterangan}-${nomorIzinId}`;
    const tanggal = dayjs().format("YYYY-MM-DD");

    const newIzin = {
      izinId,
      userId,
      nama,
      keterangan,
      tanggal,
      file: fileLocation,
    };

    await docClient.send(
      new PutCommand({
        TableName: "suratIzin",
        Item: newIzin,
      })
    );

    return h.response({
      status: "success",
      message: "Izin berhasil diajukan",
      data: newIzin,
    }).code(201);
  } catch (error) {
    console.error("Input izin error:", error);
    return h
      .response({ status: "fail", message: "Terjadi kesalahan server" })
      .code(500);
  }
};

const getIzinSiswaHandler = async (request, h) => {
  const { user } = request.auth.credentials;
  const role = user.role;
  const namaa = user.nama;
  const userId = user.userId || user.UserId;

  // Check if the user's role is 'siswa'
  if (role !== "siswa") {
    return h.response({ status: "fail", data: { namaa, role }, message: "Akses ditolak" }).code(403);
  }

  // BUG: kalau dari dynamoDB role user diubah.. maka disini tidak bisa berubah

  try {
    const result = await docClient.send(
      new ScanCommand({
        TableName: "suratIzin", // Nama tabel utama
        FilterExpression: "userId = :userId", // Filter berdasarkan userId
        ExpressionAttributeValues: {
          ":userId": userId, // Ganti dengan userId yang dicari
        },
      })
    );

    // Return the result if successful
    return h.response({ status: "success", data: result.Items }).code(200);
  } catch (error) {
    console.error("Get izin siswa error:", error);
    // Return error response if there is a server-side issue
    return h.response({ status: "fail", message: "Terjadi kesalahan server" }).code(500);
  }
};


const getIzinGuruHandler = async (request, h) => {
  const { user } = request.auth.credentials;
  const role = user.role;
  const nama = user.nama;
  const userId = user.userId || user.UserId;

  if (role !== "guru") {
    return h.response({ status: "fail",data:{nama, role}, message: "Akses ditolak" }).code(403);
  }

  // BUG: kalau dari dynamoDB role user diubah.. maka disini tidak bisa berubah

  try {
    const result = await docClient.send(
      new ScanCommand({
        TableName: "suratIzin", // Nama tabel utama
        FilterExpression: "userId = :userId", // Filter berdasarkan userId
        ExpressionAttributeValues: {
          ":userId": userId, // Ganti dengan userId yang dicari
        },
      })
    );

    return h.response({ status: "success", data: result.Items }).code(200);
  } catch (error) {
    console.error("Get izin guru error:", error);
    return h
      .response({ status: "fail", message: "Terjadi kesalahan server" })
      .code(500);
  }
};

const getIzinHandler = async (request, h) => {
  const { user } = request.auth.credentials;
  const role = user.role;
  const nama = user.nama;
  const userId = user.userId || user.UserId;

  // BUG: kalau dari dynamoDB role user diubah.. maka disini tidak bisa berubah

  try {
    const result = await docClient.send(
      new ScanCommand({
        TableName: "suratIzin", // Nama tabel utama
        FilterExpression: "userId = :userId", // Filter berdasarkan userId
        ExpressionAttributeValues: {
          ":userId": userId, // Ganti dengan userId yang dicari
        },
      })
    );

    return h.response({ status: "success", data: result.Items }).code(200);
  } catch (error) {
    console.error("Get izin guru error:", error);
    return h
      .response({ status: "fail", message: "Terjadi kesalahan server" })
      .code(500);
  }
};

module.exports = {
  inputIzinHandler,
  getIzinSiswaHandler,
  getIzinGuruHandler,
  getIzinHandler,
};

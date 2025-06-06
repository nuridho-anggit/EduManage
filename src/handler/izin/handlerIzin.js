const { PutCommand, QueryCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { nanoid } = require("nanoid");
const mime = require("mime-types");
const dayjs = require("dayjs");
const { uploadToS3, docClient } = require("../../utils/AWS-Client"); // hanya ini sekarang
require("dotenv").config();


const inputIzinHandler = async (request, h) => {
  const { keterangan, file } = request.payload;
  const { user } = request.auth.credentials;

  const userId = user.userId || user.UserId;
  const nama = user.nama;
  const role = user.role;

  if (!file || !file.hapi || !file.hapi.headers) {
    return h.response({
      status: "fail",
      message: "File tidak ditemukan atau format tidak valid",
    }).code(400);
  }

  try {
    const contentType = file.hapi.headers["content-type"];
    const fileExtension = mime.extension(contentType);
    const fileName = `izin-${nanoid(8)}.${fileExtension}`;

    // Read file buffer
    const chunks = [];
    for await (const chunk of file) {
      chunks.push(chunk);
    }
    const fileBuffer = Buffer.concat(chunks);

    // Upload to S3 dan dapatkan URL publik
    const fileLocation = await uploadToS3(fileName, fileBuffer, contentType);

    // Simpan data izin ke DynamoDB
    const izinId = `izin-${nanoid(12)}`;
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
  const userId = user.userId || user.UserId;

  if (role !== "siswa") {
    return h.response({ status: "fail", message: "Akses ditolak" }).code(403);
  }

  try {
    const result = await docClient.send(
      new QueryCommand({
        TableName: "suratIzin",
        IndexName: "userId-index",
        KeyConditionExpression: "userId = :uid",
        ExpressionAttributeValues: {
          ":uid": userId,
        },
      })
    );

    return h.response({ status: "success", data: result.Items }).code(200);
  } catch (error) {
    console.error("Get izin siswa error:", error);
    return h
      .response({ status: "fail", message: "Terjadi kesalahan server" })
      .code(500);
  }
};

const getIzinGuruHandler = async (request, h) => {
  const { user } = request.auth.credentials;
  const role = user.role;
  const userId = user.userId || user.UserId;

  if (role !== "guru") {
    return h.response({ status: "fail", message: "Akses ditolak" }).code(403);
  }

  try {
    const result = await docClient.send(
      new QueryCommand({
        TableName: "suratIzin",
        IndexName: "userId-index",
        KeyConditionExpression: "userId = :uid",
        ExpressionAttributeValues: {
          ":uid": userId,
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
};

const { PutCommand, QueryCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { nanoid } = require("nanoid");
const mime = require("mime-types");
const dayjs = require("dayjs");
const { uploadToS3Private, docClient } = require("../../utils/AWS-Client"); // hanya ini sekarang
require("dotenv").config();

const inputArsipAkademik = async (request, h) => {
  const { keterangan, file } = request.payload;
  const { user } = request.auth.credentials;

  const userId = user.userId || user.UserId;
  const nama = user.nama;
  const role = user.role;
  const userUploader = user.Id

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
    const fileLocation = await uploadToS3Private(process.env.AWS_S3_BUCKET_NAME_SURAT_IZIN, userUploader, fileName, fileBuffer, contentType);

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

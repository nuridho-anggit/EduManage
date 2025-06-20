const {
  PutCommand,
  ScanCommand,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");
const { nanoid } = require("nanoid");
const mime = require("mime-types");
const dayjs = require("dayjs");
const { uploadToS3Private, docClient } = require("../../utils/AWS-Client"); // hanya ini sekarang
require("dotenv").config();

/**
 * Menangani permintaan pengajuan izin
 *
 * Fungsi ini bertugas untuk menangani permintaan pengajuan izin, mengunggah file ke S3, dan menyimpan data izin ke DynamoDB.
 *
 * @param {Object} request - Objek yang berisi data permintaan, termasuk file dan keterangan izin.
 * @param {Object} h - Objek yang digunakan untuk mengembalikan respons HTTP.
 * @returns {Object} Respons hasil pengajuan izin, status dan pesan yang relevan.
 */
const inputIzinHandler = async (request, h) => {
  const { keterangan, file } = request.payload; // Mendapatkan keterangan dan file dari payload permintaan
  const { user } = request.auth.credentials; // Mendapatkan data pengguna yang terotentikasi

  const userId = user.userId || user.UserId; // Menentukan ID pengguna
  const nama = user.nama; // Nama pengguna
  const role = user.role; // Role pengguna
  const userUploader = user.userId; // ID pengguna yang mengupload
  const nomorIzinId = nanoid(8); // Membuat ID izin unik menggunakan nanoid

  // Validasi file yang diunggah
  if (!file || !file.hapi || !file.hapi.headers) {
    return h
      .response({
        status: "fail",
        message: "File tidak ditemukan atau format tidak valid", // Menangani jika file tidak valid
      })
      .code(400);
  }

  try {
    const contentType = file.hapi.headers["content-type"]; // Mendapatkan tipe konten file
    const fileExtension = mime.extension(contentType); // Mendapatkan ekstensi file berdasarkan tipe konten
    const fileName = `${keterangan}-${nomorIzinId}.${fileExtension}`; // Nama file dengan format yang sesuai

    // Membaca buffer file
    const chunks = [];
    for await (const chunk of file) {
      chunks.push(chunk); // Menyimpan bagian-bagian file yang dibaca
    }
    const fileBuffer = Buffer.concat(chunks); // Menggabungkan buffer menjadi satu

    // Mengunggah file ke S3 dan mendapatkan URL publik file
    const fileLocation = await uploadToS3Private(
      process.env.AWS_S3_BUCKET_NAME_SURAT_IZIN,
      userUploader,
      fileName,
      fileBuffer,
      contentType
    );

    // Membuat ID izin yang unik dan mendapatkan tanggal saat ini
    const izinId = `${keterangan}-${nomorIzinId}`;
    const tanggal = dayjs().format("YYYY-MM-DD");

    // Membuat objek izin yang akan disimpan
    const newIzin = {
      izinId,
      userId,
      nama,
      keterangan,
      tanggal,
      file: fileLocation, // Menyimpan lokasi file di S3
    };

    // Menyimpan data izin ke DynamoDB
    await docClient.send(
      new PutCommand({
        TableName: "suratIzin",
        Item: newIzin, // Menyimpan item izin baru ke DynamoDB
      })
    );

    // Mengembalikan respons berhasil
    return h
      .response({
        status: "success",
        message: "Izin berhasil diajukan", // Pesan sukses
        data: newIzin, // Mengembalikan data izin yang baru diajukan
      })
      .code(201); // Kode status HTTP 201 (Created)
  } catch (error) {
    console.error("Input izin error:", error); // Menangani error jika terjadi kegagalan
    return h
      .response({ status: "fail", message: "Terjadi kesalahan server" }) // Menangani kesalahan server
      .code(500); // Kode status HTTP 500 (Internal Server Error)
  }
};

/**
 * Menangani permintaan untuk mengambil data izin
 *
 * Fungsi ini digunakan untuk mengambil data izin dari DynamoDB berdasarkan peran pengguna (admin atau bukan).
 *
 * @param {Object} request - Objek yang berisi data permintaan.
 * @param {Object} h - Objek yang digunakan untuk mengembalikan respons HTTP.
 * @returns {Object} Respons yang berisi data izin yang diambil.
 */
const getIzinHandler = async (request, h) => {
  const { user } = request.auth.credentials;
  const role = user.role;
  const userId = user.userId || user.UserId;

  try {
    const params = { TableName: "suratIzin" };

    if (role !== "admin") {
      params.FilterExpression = "userId = :userId";
      params.ExpressionAttributeValues = { ":userId": userId };
    }

    const result = await docClient.send(new ScanCommand(params));

    if (result.Items.length === 0) {
      return h.response({
        status: "success",
        data: [],
        message: "Anda belum pernah mengajukan Surat izin",
      }).code(200);
    }

    // Tambahkan role ke tiap izin dengan fetch profile user terkait
    const dataWithRole = await Promise.all(
      result.Items.map(async (item) => {
        try {
          const userProfileResult = await docClient.send(new GetCommand({
            TableName: "users",
            Key: { userId: item.userId },
          }));
          const userProfile = userProfileResult.Item || {};
          return {
            ...item,
            role: userProfile.role || "Tidak diketahui",
          };
        } catch {
          return { ...item, role: "Tidak diketahui" };
        }
      })
    );

    return h.response({ status: "success", data: dataWithRole }).code(200);
  } catch (error) {
    console.error("Get izin error:", error);
    return h.response({ status: "fail", message: "Terjadi kesalahan server" }).code(500);
  }
};

const deleteIzinHandler = async (request, h) => {
  const { id } = request.params;

  try {
    await docClient.send(
      new DeleteCommand({
        TableName: "suratIzin",
        Key: { izinId: id },
      })
    );

    return h
      .response({
        status: "success",
        message: "Data izin berhasil dihapus",
      })
      .code(200);
  } catch (error) {
    console.error("Delete izin error:", error);
    return h
      .response({ status: "fail", message: "Gagal menghapus izin" })
      .code(500);
  }
};

module.exports = {
  inputIzinHandler,
  getIzinHandler,
  deleteIzinHandler,
};

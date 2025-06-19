const { PutCommand, QueryCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const { nanoid } = require("nanoid");
const mime = require("mime-types");
const dayjs = require("dayjs");
const { uploadToS3Private, docClient } = require("../../utils/AWS-Client"); // hanya ini sekarang
require("dotenv").config();

/**
 * Menangani pengajuan arsip akademik
 * 
 * Fungsi ini mengelola pengajuan arsip akademik, mengunggah file ke S3, 
 * dan menyimpan informasi arsip ke DynamoDB.
 * 
 * @param {Object} request - Objek yang berisi data permintaan, termasuk file arsip dan nama file.
 * @param {Object} h - Objek yang digunakan untuk mengembalikan respons HTTP.
 * @returns {Object} - Respons berisi status dan pesan terkait pengajuan arsip akademik.
 */
const inputArsipAkademikHandler = async (request, h) => {
  const { namaFile, file } = request.payload; // Mengambil nama file dan file dari payload
  const { user } = request.auth.credentials;  // Mendapatkan data pengguna yang terotentikasi

  const userId = user.userId || user.UserId;  // Menentukan ID pengguna
  const nama = user.nama;                      // Nama pengguna
  const role = user.role;                      // Role pengguna
  const userUploader = userId;                 // ID pengguna yang mengupload arsip

  // Validasi file yang diunggah
  if (!file || !file.hapi || !file.hapi.headers) {
    return h.response({
      status: "fail",
      message: "File tidak ditemukan atau format tidak valid", // Menangani jika file tidak valid
    }).code(400); // Kode status HTTP 400 (Bad Request)
  }

  try {
    const contentType = file.hapi.headers["content-type"];  // Mendapatkan tipe konten file
    const fileExtension = mime.extension(contentType);      // Mendapatkan ekstensi file berdasarkan tipe konten
    const fileName = `${namaFile}.${fileExtension}`;         // Membuat nama file berdasarkan nama file dan ekstensi

    // Membaca buffer file
    const chunks = [];
    for await (const chunk of file) {
      chunks.push(chunk); // Menyimpan bagian-bagian file yang dibaca
    }
    const fileBuffer = Buffer.concat(chunks); // Menggabungkan buffer menjadi satu

    // Mengunggah file ke S3 dan mendapatkan URL publik
    const fileLocation = await uploadToS3Private(process.env.AWS_S3_BUCKET_NAME_ARSIP_AKADEMIK, userUploader, fileName, fileBuffer, contentType);

    // Membuat ID arsip yang unik dan mendapatkan tanggal saat ini
    const arsipId = `arsip-${nanoid(4)}`;
    const tanggal = dayjs().format("YYYY-MM-DD");

    // Membuat objek arsip yang akan disimpan
    const newArsip = {
      arsipId,
      userId,
      namaFile,
      nama,
      tanggal,
      file: fileLocation, // Menyimpan lokasi file di S3
    };

    // Menyimpan data arsip ke DynamoDB
    await docClient.send(
      new PutCommand({
        TableName: "arsipAkademik", // Nama tabel DynamoDB yang digunakan
        Item: newArsip,             // Item arsip yang akan disimpan
      })
    );

    // Mengembalikan respons berhasil
    return h.response({
      status: "success",
      message: "Arsip berhasil disimpan", // Pesan sukses
      data: newArsip,                   // Mengembalikan data arsip yang baru diajukan
    }).code(201); // Kode status HTTP 201 (Created)
  } catch (error) {
    console.error("Input arsip error:", error); // Menangani kesalahan jika terjadi kegagalan
    return h
      .response({ status: "fail", message: "Terjadi kesalahan server" }) // Menangani kesalahan server
      .code(500); // Kode status HTTP 500 (Internal Server Error)
  }
};

/**
 * Menangani permintaan untuk mengambil arsip akademik
 * 
 * Fungsi ini mengambil data arsip akademik yang disimpan di DynamoDB berdasarkan userId.
 * 
 * @param {Object} request - Objek yang berisi data permintaan.
 * @param {Object} h - Objek yang digunakan untuk mengembalikan respons HTTP.
 * @returns {Object} - Respons yang berisi data arsip akademik yang diambil.
 */
const getArsipAkademikHandler = async (request, h) => {
  const { user } = request.auth.credentials;  // Mendapatkan data pengguna yang terotentikasi
  const userId = user.userId || user.UserId;  // Menentukan ID pengguna

  // BUG: Jika dari DynamoDB role pengguna diubah, maka disini tidak bisa berubah

  try {
    // Mengambil data arsip akademik dari DynamoDB
    const result = await docClient.send(
      new ScanCommand({
        TableName: "arsipAkademik", // Nama tabel DynamoDB
        FilterExpression: "userId = :userId", // Filter berdasarkan userId
        ExpressionAttributeValues: {
          ":userId": userId, // Ganti dengan userId yang dicari
        },
      })
    );

    // Mengecek jika data arsip akademik kosong
    if (result.Items.length === 0) {
      return h.response({
        status: "success",
        message: "Anda belum pernah menambahkan arsip akademik", // Pesan jika tidak ada arsip akademik
      }).code(200); // Kode status HTTP 200 (OK)
    }

    // Mengembalikan respons dengan data arsip akademik yang ditemukan
    return h.response({ status: "success", data: result.Items }).code(200); // Kode status HTTP 200 (OK)
  } catch (error) {
    console.error("Get Arsip Akademik error:", error); // Menangani kesalahan jika gagal mengambil data arsip
    return h
      .response({ status: "fail", message: "Terjadi kesalahan server" }) // Menangani kesalahan server
      .code(500); // Kode status HTTP 500 (Internal Server Error)
  }
};

// Mengekspos handler untuk digunakan dalam routing
module.exports = { inputArsipAkademikHandler, getArsipAkademikHandler };

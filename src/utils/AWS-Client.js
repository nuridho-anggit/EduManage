const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
require("dotenv").config();

// Inisialisasi S3 Client
// Membuat instance S3Client untuk mengakses Amazon S3 dengan kredensial yang disediakan
const s3Client = new S3Client({
  region: process.env.AWS_REGION, // Menentukan region AWS yang digunakan
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_DYNAMODB, // Mendapatkan akses key dari environment variables
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_DYNAMODB, // Mendapatkan secret key dari environment variables
  },
});

/**
 * Fungsi untuk mengunggah file ke S3 dan mengembalikan URL publik file yang diunggah
 * 
 * @param {string} destinatedFolder - Folder tujuan dalam bucket S3 tempat file akan diunggah
 * @param {string} userUploader - ID pengguna yang mengunggah file
 * @param {string} fileName - Nama file yang akan diunggah
 * @param {Buffer} fileBuffer - Buffer file yang akan diunggah
 * @param {string} contentType - Tipe konten dari file yang diunggah
 * @returns {Promise<string>} - URL file yang diunggah di S3
 * 
 * Fungsi ini mengunggah file ke S3 dan mengembalikan URL file yang dapat diakses secara publik.
 */
const uploadToS3Private = async (destinatedFolder, userUploader, fileName, fileBuffer, contentType) => {
  // Menyiapkan parameter untuk unggahan file ke S3
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME, // Nama bucket S3 yang digunakan
    Key: `${destinatedFolder}/${userUploader}/${fileName}`, // Lokasi file dalam bucket S3
    Body: fileBuffer, // Data file yang akan diunggah
    ContentType: contentType, // Tipe konten file
    ContentLength: fileBuffer.length, // Ukuran file
  };

  try {
    // Membuat objek PutObjectCommand dengan parameter yang sudah disiapkan
    const command = new PutObjectCommand(params);
    // Mengirimkan perintah untuk mengunggah file ke S3
    await s3Client.send(command);

    // Membuat URL publik untuk file yang baru diunggah
    const fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${destinatedFolder}/${userUploader}/${fileName}`;
    return fileUrl; // Mengembalikan URL file
  } catch (error) {
    console.error("Upload to S3 error:", error); // Menangani kesalahan jika terjadi kegagalan dalam unggahan
    throw error; // Melemparkan error untuk penanganan lebih lanjut
  }
};

// Inisialisasi DynamoDB Client
// Membuat instance DynamoDBClient untuk mengakses DynamoDB dengan kredensial yang disediakan
const dynamoDBClient = new DynamoDBClient({
  region: process.env.AWS_REGION, // Menentukan region AWS yang digunakan
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_DYNAMODB, // Mendapatkan akses key dari environment variables
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_DYNAMODB, // Mendapatkan secret key dari environment variables
  },
});

// Membuat instance DynamoDBDocumentClient untuk bekerja dengan DynamoDB dalam format dokumen
const docClient = DynamoDBDocumentClient.from(dynamoDBClient);

// Mengekspos objek yang digunakan di luar modul ini
module.exports = {
  s3Client, // Klien S3 untuk interaksi dengan layanan S3
  docClient, // Klien DynamoDB untuk interaksi dengan layanan DynamoDB
  uploadToS3Private, // Fungsi untuk mengunggah file ke S3
};

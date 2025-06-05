const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
require("dotenv").config();

// Inisialisasi S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_DYNAMODB,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_DYNAMODB,
  },
});

/**
 * Upload file ke S3 dan return URL publik
 * @param {string} fileName 
 * @param {Buffer} fileBuffer 
 * @param {string} contentType 
 * @returns {Promise<string>} - URL file publik
 */
const uploadToS3 = async (fileName, fileBuffer, contentType) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: fileName,
    Body: fileBuffer,
    ContentType: contentType,
    ContentLength: fileBuffer.length,
  };

  try {
    const command = new PutObjectCommand(params);
    await s3Client.send(command);

    // Generate public URL
    const fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
    return fileUrl;
  } catch (error) {
    console.error("Upload to S3 error:", error);
    throw error;
  }
};

module.exports = {
  s3Client,
  uploadToS3,
};
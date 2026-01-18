import dotenv from "dotenv";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs/promises";
import path from "path";

dotenv.config();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const uploadOnS3 = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const fileContent = await fs.readFile(localFilePath);
    const fileName = `videos/${Date.now()}-${path.basename(localFilePath)}`;

    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileName,
      Body: fileContent,
      ContentType: "video/mp4"
    };

    const command = new PutObjectCommand(uploadParams);
    await s3.send(command);

    await fs.unlink(localFilePath);

    const fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

    console.log("File uploaded to S3:", fileUrl);

    return {
      url: fileUrl,
      key: fileName
    };

  } catch (error) {
    console.error("S3 upload error:", error);
    await fs.unlink(localFilePath);
    return null;
  }
};

export { uploadOnS3 };

import sharp from "sharp";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const processImage = async (fileBuffer, type = "avatar") => {
  const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
  const uploadPath = path.join(__dirname, "..", "uploads", type === "avatar" ? "avatars" : "logos", fileName);

  const size = type === "avatar" ? 200 : 512;

  await sharp(fileBuffer)
    .resize(size, size, {
      fit: "cover",
      position: "center",
    })
    .webp({ quality: 80 })
    .toFile(uploadPath);

  return `/uploads/${type === "avatar" ? "avatars" : "logos"}/${fileName}`;
};

export const deleteOldImage = (imagePath) => {
  if (!imagePath || imagePath.startsWith("http") || !imagePath.startsWith("/uploads/")) return;

  const fullPath = path.join(__dirname, "..", imagePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};

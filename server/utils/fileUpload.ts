import multer from "multer";
import path from "path";
import { randomBytes } from "crypto";

// 配置multer存储
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), "uploads"));
  },
  filename: (req, file, cb) => {
    const randomName = randomBytes(16).toString("hex");
    const extension = path.extname(file.originalname);
    cb(null, `${randomName}${extension}`);
  },
});

// 创建multer实例
export const upload = multer({
  storage: multerStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB最大文件大小
  },
  fileFilter: (req, file, cb) => {
    // 只接受图片文件
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      // 使用类型断言来解决TypeScript错误
      return cb(new Error("只允许图片文件!") as any, false);
    }
    cb(null, true);
  },
});

export default upload;
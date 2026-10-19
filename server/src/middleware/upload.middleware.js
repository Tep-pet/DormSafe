import multer from 'multer';

/** Shared in-memory upload (5 MB) for permits, room images, receipts */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

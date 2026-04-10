import multer from "multer";

const storage = multer.diskStorage({
  // Where to save the file temporarily
  destination: function (req, file, cb) {
    cb(null, "./public/temp"); // ← temp folder on your server
  },

  // What to name the file
  filename: function (req, file, cb) {
    cb(null, file.originalname); // ← keep original filename
  },
});

export const upload = multer({ storage });

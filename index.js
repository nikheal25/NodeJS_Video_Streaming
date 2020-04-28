const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const app = express();

app.set("view engine", "ejs");
// Public Folder
app.use(express.static("./public"));

app.get("/", function (req, res) {
  res.render("index");
});

// Set The Storage Engine
const storage = multer.diskStorage({
  destination: "./public/uploads/",
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

// Init Upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 },
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
}).single("myImage");

// Check File Type
function checkFileType(file, cb) {
  // Allowed ext
  const filetypes = /jpeg|mp4|png|gif/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb("Error: Images Only!");
  }
}

app.get("/video", function (req, res) {
  const path = "assets/sample.mp4";
  const stat = fs.statSync(path);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize) {
      res
        .status(416)
        .send("Requested range not satisfiable\n" + start + " >= " + fileSize);
      return;
    }

    const chunksize = end - start + 1;
    const file = fs.createReadStream(path, { start, end });
    const head = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": "video/mp4",
    };

    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      "Content-Length": fileSize,
      "Content-Type": "video/mp4",
    };
    res.writeHead(200, head);
    fs.createReadStream(path).pipe(res);
  }
});

app.get("/upload", (req, res) => {
  res.render("upload");
});

app.post("/uploadfile", (req, res) => {
  console.log(req.file);

  upload(req, res, (err) => {
    if (err) {
      console.log(`The error is - ${err}`);
      res.render("index");
    } else {
      if (req.file == undefined) {
        console.log("ERROOOOOOOR");
      } else {
        console.log("working");

        res.render("index", {
          msg: "File Uploaded!",
          file: `uploads/${req.file.filename}`,
        });
      }
    }
  });
});

app.listen(4500, function () {
  console.log("Listening on port 3001!");
});

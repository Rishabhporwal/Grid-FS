const express = require('express');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const multer = require('multer')
const GridfsStorage = require('multer-gridfs-storage')
const Grid = require('gridfs-stream')
const methodOverride = require('method-override')
const bodyparser = require('body-parser')

const app = express();

app.use(bodyparser.json());
app.use(methodOverride('_method'))
app.set('view engine', 'ejs');

// Mongo URI
const mongoURI = "mongodb://localhost:27017/gridfs";

const conn = mongoose.createConnection(mongoURI ,{
    useNewUrlParser: true,
    useUnifiedTopology: true
})

//intitalize gfs
let gfs;

conn.once('open', () => {
    // init stream
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
})

// Create Storage Engine
const storage = new GridfsStorage({ url: mongoURI });
// const storage = new GridfsStorage({
//     url:  mongoURI,
//     file: (req, file) => {
//         return new Promise((resolve, reject) => {
//             crypto.randomBytes(16, (err, buf) => {
//                 if(err){
//                     return reject(err);
//                 }
//                 const filename = buf.toString('hex') + path.extname(file.originalname);
//                 const fileInfo = {
//                     filename: filename,
//                     bucketName: 'uploads'
//                 };
//                 resolve(fileInfo);
//             })
//         })
//     }
// })

const upload = multer({ storage });

app.get('/', (req, res, next) => { 
    res.render('index');
})

app.post('/upload', upload.single('file'), (req, res, next) => {
    res.json({ file: req.file })
})

// Display all the files in JSON
app.get('/files', (req, res) => {
    gfs.files.find().toArray((err, files) => {
        // Check if exist
        if(!files || files.length === 0){
            return res.status(404).json({
                err: "No files exist"
            })
        }

        return res.json(files);
    })
})

// Display file in JSON
app.get('/files/:filename', (req, res) => {
    gfs.files.findOne({filename: req.params.filename}, (err, file) => {
        // check if file exist
        if(!file || file.length === 0){
            return res.status(404).json({
                err: "No files exist"
            })
        }
        return res.json(file);
    })
})

// Display single file
app.get('/image/:filename', (req, res) => {
    gfs.files.findOne({filename: req.params.filename}, (err, file) => {
        // check if file exist
        if(!file || file.length === 0){
            return res.status(404).json({
                err: "No files exist"
            })
        }

        // Check if image
        if(file.contentType === 'image/jpeg' || file.contentType === 'image/png'){
            // Read output to browser
            const readstream = gfs.createReadStream(file.filename);
            readstream.pipe(res)
        }else{
            res.status(404).json({
                err: 'Not an image '
            })
        }
    })
})

app.listen(3000, () => {
    console.log('server started on 3000 port')
})
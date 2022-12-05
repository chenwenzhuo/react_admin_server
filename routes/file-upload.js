const path = require('path');
const fs = require('fs');
const multer = require('multer')
// import multer from 'multer';

const dirPath = path.join(__dirname, '..', 'public/upload');

//存储引擎
//diskStorage将文件存储在磁盘上，memoryStorage将文件存储在内存中
const storage = multer.diskStorage({
    //为destination传入string时，服务器将自动创建对应文件夹
    //为destination传入函数时，需要在函数中手动创建文件夹
    destination: (req, file, cb) => {
        if (fs.existsSync(dirPath)) { //路径存在时，不进行创建
            cb(null, dirPath);
            return;
        }
        //路径不存在，创建
        fs.mkdirSync(dirPath, err => {
            if (err) {
                console.log(err);
            } else {
                cb(null, dirPath);
            }
        });
    },
    filename: (req, file, cb) => {
        var ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + Date.now() + ext);
    }
});

const upload = multer({
    storage: storage
});

const uploadSingle = upload.single('image');

const fileUpload = router => {
    //上传图片
    router.post('/manage/img/upload', (req, res) => {
        uploadSingle(req, res, err => {
            if (err) {
                res.send({
                    status: 1,
                    msg: '上传文件失败'
                });
                return;
            }
            const file = req.file;
            res.send({
                status: 0,
                data: {
                    name: file.filename,
                    url: 'http://localhost:5001/upload/' + file.filename
                }
            });
        });
    });
    //删除图片
    router.post('/manage/img/delete', (req, res) => {
        const {
            name //文件名
        } = req.body;
        fs.unlink(path.join(dirPath, name), err => {
            if (err) {
                console.log(err);
                res.send({
                    status: 1,
                    msg: '删除文件失败'
                });
            } else {
                res.send({
                    status: 0
                });
            }
        });
    });
}

module.exports = fileUpload;
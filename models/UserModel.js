/**
 *  用户模型
 */
//1.引入所需模块
const mongoose = require('mongoose');
const md5 = require('blueimp-md5');

//2.定义schema
const Schema = mongoose.Schema;
const UserType = { //数据格式
    username: { //用户名
        type: String,
        required: true
    },
    password: { //密码
        type: String,
        required: true
    },
    phone: String, //电话
    email: String, //邮箱
    create_time: {
        type: Number,
        default: Date.now
    },
    role_id: String
};

//3.创建Model，即一张名为users的数据库表
const UserModel = mongoose.model("users", new Schema(UserType));

//初始化默认用户：admin/admin
UserModel.findOne({ //查找名为admin的用户
        username: 'admin'
    })
    .then(user => {
        if (user) //若admin用户存在，直接返回
            return;
        //admin用户不存在，创建
        UserModel.create({
                username: 'admin',
                password: md5('admin'),
            })
            .then(user => {
                console.log('初始化用户: 用户名: admin 密码为: admin');
            });
    });

//4. 向外暴露UserModel
module.exports = UserModel
/**
 *  角色模型
 */
//1.引入所需模块
const mongoose = require('mongoose');

//2.定义schema
const Schema = mongoose.Schema;
const RoleType = {
    name: { //角色名称
        type: String,
        required: true
    },
    auth_name: String, //授权人
    auth_time: Number, //授权时间
    create_time: { //角色创建时间
        type: Number,
        default: Date.now
    },
    menus: Array //角色的菜单权限
};

//3.创建Model，即一张名为roles的数据库表
const RoleModel = mongoose.model('roles', new Schema(RoleType));

//4.暴露RoleModel
module.exports = RoleModel;
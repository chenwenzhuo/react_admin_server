const mongoose = require('mongoose')

const Schema = mongoose.Schema;
const ProductType = {
    categoryId: { // 产品所属分类的id
        type: String,
        required: true
    },
    pCategoryId: { // 所属分类的父分类id
        type: String,
        required: true
    },
    name: { // 名称
        type: String,
        required: true
    },
    price: { // 价格
        type: Number,
        required: true
    },
    desc: { //描述
        type: String
    },
    status: { // 商品状态: 1:在售, 2: 下架
        type: Number,
        default: 1
    },
    imgs: { // n个图片文件名的json字符串
        type: Array,
        default: []
    },
    detail: { // 详细信息字符串
        type: String
    }
};

const ProductModel = mongoose.model('products', new Schema(ProductType));

module.exports = ProductModel;
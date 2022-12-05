const mongoose = require('mongoose')

const Schema = mongoose.Schema;
const CategoryType = {
    name: {
        type: String,
        required: true
    },
    parentId: {
        type: String,
        required: true,
        default: '0'
    }
};

const CategoryModel = mongoose.model('categories', new Schema(CategoryType));

module.exports = CategoryModel;
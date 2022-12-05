const express = require('express');
const md5 = require('blueimp-md5');
const router = express.Router();

//引入数据模型
const UserModel = require('../models/UserModel');
const RoleModel = require('../models/RoleModel');
const CategoryModel = require('../models/CategoryModel');
const ProductModel = require('../models/ProductModel');

//文件上传模块
const fileUpload = require('./file-upload');
fileUpload(router); //注册文件上传路由

// 登陆
router.post('/login', (req, res) => {
  //获取请求参数，用户名、密码
  const {
    username,
    password
  } = req.body;
  //查询数据库，检查当前用户是否存在
  UserModel.findOne({
      username,
      password: md5(password)
    })
    .then(user => {
      if (user === null) { //用户不存在，登陆失败
        res.send({
          status: 1,
          msg: '用户名或密码不正确！'
        });
        // return;
        // 此处不进行return，则代码继续向下执行，由于user为null，故会引发异常，进入catch中
      }
      //用户存在，登陆成功
      res.cookie('userid', user._id, { //生成一个cookie(userid: user._id), 并交给浏览器保存
        maxAge: 1000 * 60 * 60 //有效时间1小时
      });
      //查询用户的角色信息
      if (user.role_id) { //若用户已分配角色
        //查询用户的角色信息
        RoleModel.findOne({
            _id: user.role_id
          })
          .then(role => {
            user._doc.role = role; //将角色信息加入用户对象中
            console.log(`role of user ${user.username}`, role);
            //返回用户信息
            res.send({
              status: 0,
              data: user
            });
          });
      } else { //用户没有角色信息时
        user._doc.role = {
          menus: []
        };
        res.send({
          status: 0,
          data: user
        });
      }
    })
    .catch(error => {
      console.error('登陆异常', error);
      res.send({
        status: 1,
        msg: '登陆异常, 请稍后重试'
      });
    });
});

//添加用户
router.post('/manage/user/add', (req, res) => {
  //获取请求参数
  const {
    username,
    password
  } = req.body;
  //检查用户是否存在
  UserModel.findOne({
      username
    })
    .then(async user => {
      if (user) { //用户已存在
        res.send({
          status: 1,
          msg: '此用户已存在'
        });
      } else {
        //用户不存在时，添加用户
        const newUser = await UserModel.create({
          ...req.body,
          password: md5(password || (username + 'pwd')) //有密码则使用传入的密码，否则默认username+pwd为密码
        });
        res.send({ //返回新用户对象
          status: 0,
          data: newUser
        })
      }
    })
    .catch(error => {
      console.error('注册异常', error);
      res.send({
        status: 1,
        msg: '添加用户异常, 请稍后重试'
      });
    });
});

//更新用户
router.post('/manage/user/update', (req, res) => {
  const user = req.body;
  //findOneAndUpdate方法在then的成功回调中会返回原user对象
  UserModel.findOneAndUpdate({
      _id: user._id
    }, user)
    .then(oldUser => {
      if (oldUser === null) {
        res.send({
          status: 1,
          msg: "当前用户不存在，更新失败"
        });
      } else {
        //将新user对象作为数据返回
        res.send({
          status: 0,
          data: {
            ...oldUser,
            ...user
          }
        });
      }
    })
    .catch(error => {
      console.error('更新用户异常', error);
      res.send({
        status: 1,
        msg: '更新用户异常, 请稍后重试'
      });
    });
});

//删除用户
router.post('/manage/user/delete', (req, res) => {
  const {
    userId
  } = req.body; //根据用户id进行删除
  UserModel.findOneAndDelete({
      _id: userId
    })
    .then(delUser => {
      if (delUser === null) {
        res.send({
          status: 1,
          msg: '此用户不存在，删除失败'
        });
      } else {
        res.send({
          status: 0,
          msg: '删除用户成功'
        });
      }
    }).catch(error => {
      console.error('删除用户异常', error);
      res.send({
        status: 1,
        msg: '删除用户异常, 请稍后重试'
      });
    });
});

//获取所有用户列表
router.get('/manage/user/list', (req, res) => {
  UserModel.find({
    username: {
      '$ne': 'admin'
    }
  }).then(users => {
    RoleModel.find().then(roles => {
      res.send({
        status: 0,
        data: {
          users,
          roles
        }
      });
    });
  }).catch(error => {
    console.error('获取用户列表异常', error)
    res.send({
      status: 1,
      msg: '获取用户列表异常, 请稍后重试'
    })
  });
});

//添加角色
router.post('/manage/role/add', (req, res) => {
  const {
    roleName
  } = req.body;
  //查询待添加的角色是否存在
  RoleModel.findOne({
    name: roleName
  }).then(role => {
    if (role) { //角色已存在，不进行添加
      res.send({
        status: 1,
        msg: '角色已存在，添加失败'
      });
    } else {
      //角色不存在时，添加新角色
      RoleModel.create({
        name: roleName
      }).then(newRole => {
        res.send({
          status: 0,
          data: newRole
        });
      });
    }
  }).catch(error => {
    console.error('添加角色异常', error);
    res.send({
      status: 1,
      msg: '添加角色异常, 请稍后重试'
    });
  });
});

//获取角色列表
router.get('/manage/role/list', (req, res) => {
  RoleModel.find().then(roles => {
    res.send({
      status: 0,
      data: roles
    });
  }).catch(error => {
    console.error('获取角色列表异常', error);
    res.send({
      status: 1,
      msg: '获取角色列表异常, 请稍后重试'
    });
  });
});

//更新角色（设置角色权限）
router.post('/manage/role/update', (req, res) => {
  const role = req.body;
  role.auth_time = Date.now();
  //查找当前角色，并进行更新
  RoleModel.findOneAndUpdate({
      _id: role._id
    }, role)
    .then(oldRole => {
      if (oldRole === null) {
        res.send({
          status: 1,
          msg: "当前角色不存在，更新失败"
        });
      } else {
        res.send({
          status: 0,
          data: {
            ...oldRole,
            ...role
          }
        });
      }
    })
    .catch(error => {
      console.error('更新角色异常', error);
      res.send({
        status: 1,
        msg: '更新角色异常, 请稍后重试'
      });
    });
});

//删除角色
router.post('/manage/role/delete', (req, res) => {
  const {
    roleId
  } = req.body; //根据角色id进行删除
  RoleModel.findOneAndDelete({
      _id: roleId
    })
    .then(oldRole => {
      if (oldRole === null) {
        res.send({
          status: 1,
          msg: '当前角色不存在，删除失败'
        });
      } else {
        res.send({
          status: 0,
          msg: '删除角色成功'
        });
      }
    })
    .catch(error => {
      console.error('删除角色异常', error);
      res.send({
        status: 1,
        msg: '删除角色异常, 请稍后重试'
      });
    });
});

//添加分类
router.post('/manage/category/add', (req, res) => {
  //获取请求参数
  const {
    categoryName,
    parentId
  } = req.body;
  //检查分类是否存在
  CategoryModel.findOne({
      name: categoryName
    })
    .then(category => {
      if (category) {
        res.send({
          status: 1,
          msg: '该品类已存在，添加失败'
        });
        return;
      }
      //添加分类
      CategoryModel.create({
          name: categoryName,
          parentId: parentId || '0'
        })
        .then(category => {
          res.send({
            status: 0,
            data: category
          });
        });
    })
    .catch(error => {
      console.error('添加分类异常', error);
      res.send({
        status: 1,
        msg: '添加分类异常, 请稍后重试'
      });
    });
});

//获取分类列表（查询指定分类id的子分类，或查询一级分类）
router.get('/manage/category/list', (req, res) => {
  const parentId = req.query.parentId || '0';
  CategoryModel.find({
      parentId
    })
    .then(categories => {
      res.send({
        status: 0,
        data: categories
      });
    })
    .catch(error => {
      console.error('获取分类列表异常', error);
      res.send({
        status: 1,
        msg: '获取分类列表异常, 请稍后重试'
      });
    });
});

//删除分类
router.post('/manage/category/delete', (req, res) => {
  const {
    categoryId
  } = req.body;
  CategoryModel.findOneAndDelete({
      _id: categoryId
    })
    .then(category => {
      if (category === null) {
        res.send({
          status: 0,
          msg: '指定分类不存在，删除失败'
        });
      } else {
        res.send({
          status: 0,
          msg: '删除分类成功'
        });
      }
    }).catch(error => {
      console.error('删除分类异常', error);
      res.send({
        status: 1,
        msg: '删除分类异常，请稍后重试'
      });
    })
});

//更新分类名称
router.post('/manage/category/update', (req, res) => {
  const {
    categoryId,
    categoryName
  } = req.body;
  //检查制定分类是否存在
  CategoryModel.findOneAndUpdate({
      _id: categoryId
    }, {
      name: categoryName
    })
    .then(oldCategory => {
      if (oldCategory === null) {
        res.send({
          status: 1,
          msg: '指定分类不存在，更新失败'
        });
      } else {
        res.send({
          status: 0
        });
      }
    })
    .catch(error => {
      console.error('获取商品列表异常', error);
      res.send({
        status: 1,
        msg: '获取商品列表异常，请稍后重试'
      });
    })
});

//根据分类ID获取分类
router.get('/manage/category/info', (req, res) => {
  const categoryId = req.query.categoryId;
  CategoryModel.findOne({
      _id: categoryId
    })
    .then(category => {
      if (category === null) {
        res.send({
          status: 1,
          msg: '指定分类不存在'
        });
      } else {
        res.send({
          status: 0,
          data: category
        });
      }
    })
    .catch(error => {
      console.error('获取分类信息异常', error);
      res.send({
        status: 1,
        msg: '获取分类信息异常，请稍后重试'
      });
    });
});

//添加商品
router.post('/manage/product/add', (req, res) => {
  const productParam = req.body;
  //检查当前商品是否存在
  ProductModel.findOne({
      name: productParam.name
    })
    .then(product => {
      if (product) {
        res.send({
          status: 1,
          msg: '当前商品已存在，添加失败'
        });
        return;
      }
      //商品不存在时，进行添加
      ProductModel.create(productParam)
        .then(newProduct => {
          res.send({
            status: 0,
            data: newProduct
          });
        })
    })
    .catch(error => {
      console.error('添加商品异常', error);
      res.send({
        status: 1,
        msg: '添加商品异常，请稍后重试'
      });
    });
});

//获取商品分页列表
router.get('/manage/product/list', (req, res) => {
  const {
    pageNum,
    pageSize
  } = req.query
  ProductModel.find()
    .then(products => {
      res.send({
        status: 0,
        data: pageFilter(products, pageNum, pageSize)
      })
    })
    .catch(error => {
      console.error('获取商品列表异常', error);
      res.send({
        status: 1,
        msg: '获取商品列表异常, 请稍后重试'
      });
    })
});

// 搜索商品列表
router.get('/manage/product/search', (req, res) => {
  const {
    pageNum,
    pageSize,
    searchType,
    productName,
    productDesc
  } = req.query
  let contition = {}
  if (searchType === 'productName') {
    contition = {
      name: new RegExp(`^.*${productName}.*$`)
    }
  } else if (searchType === 'productDesc') {
    contition = {
      desc: new RegExp(`^.*${productDesc}.*$`)
    }
  } else {
    res.send({
      status: 1,
      msg: '搜索类型参数有误'
    });
  }
  ProductModel.find(contition)
    .then(products => {
      res.send({
        status: 0,
        data: pageFilter(products, pageNum, pageSize)
      });
    })
    .catch(error => {
      console.error('搜索商品列表异常', error)
      res.send({
        status: 1,
        msg: '搜索商品列表异常, 请稍后重试'
      });
    })
});

// 更新商品
router.post('/manage/product/update', (req, res) => {
  const product = req.body
  ProductModel.findOneAndUpdate({
      _id: product._id
    }, product)
    .then(oldProduct => {
      if (oldProduct === null) {
        res.send({
          status: 1,
          msg: '指定商品不存在，更新失败'
        });
      } else {
        res.send({
          status: 0
        });
      }
    })
    .catch(error => {
      console.error('更新商品异常', error)
      res.send({
        status: 1,
        msg: '更新商品名称异常, 请稍后重试'
      })
    });
});

// 更新商品状态(上架/下架)
router.post('/manage/product/updateStatus', (req, res) => {
  const {
    productId,
    status
  } = req.body;
  ProductModel.findOneAndUpdate({
      _id: productId
    }, {
      status
    })
    .then(oldProduct => {
      if (oldProduct === null) {
        res.send({
          status: 1,
          msg: `指定商品不存在，${status===1?'上架':'下架'}失败`
        });
      } else {
        res.send({
          status: 0
        });
      }
    })
    .catch(error => {
      console.error('更新商品状态异常', error)
      res.send({
        status: 1,
        msg: '更新商品状态异常, 请稍后重试'
      })
    })
})

//得到指定数组的分页信息对象
function pageFilter(arr, pageNum, pageSize) {
  //将字符串形式的参数转为数字
  pageNum = pageNum * 1;
  pageSize = pageSize * 1;
  //获取分页数据
  const total = arr.length;
  const pages = Math.floor((total + pageSize - 1) / pageSize); //向下取整
  const start = pageSize * (pageNum - 1)
  const end = (start + pageSize) <= total ? start + pageSize : total;
  const list = [];
  for (var i = start; i < end; i++) {
    list.push(arr[i]);
  }
  return {
    pageNum,
    total,
    pages,
    pageSize,
    list
  }
}

module.exports = router;
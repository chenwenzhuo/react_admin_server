var createError = require('http-errors');
var express = require('express');
var session = require('express-session');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');


var app = express();

// 使用ejs模版文件
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev')); //记录请求日志
//接收json参数
app.use(express.json()); //解析Content-Type: application/json形式的post参数
app.use(express.urlencoded({
  extended: false
})); //解析Content-Type: application/x-www-form-urlencoded形式的post参数
// app.use(cookieParser()); //声明使用解析cookie数据的中间件
app.use(express.static(path.join(__dirname, 'public'))); //将public目录设为静态资源目录

//注册路由中间件
var indexRouter = require('./routes/index');
app.use('/', indexRouter);

// catch 404 and forward to error handler
// 以上路由都不匹配时，产生404错误
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
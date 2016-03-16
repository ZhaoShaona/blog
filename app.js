
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var MongoStore = require('connect-mongo')(express);
var settings = require('./settings');
var flash = require('connect-flash');
var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(flash());
app.use(express.favicon());
app.use(express.logger('dev'));
// app.use(express.json());
// app.use(express.urlencoded());
// app.use(express.bodyParser());//解析请求体
app.use(express.bodyParser({keepExtensions: true, uploadDir: './public/images'}));//保留上传文件的扩展名，并设置上传目录
app.use(express.methodOverride());//协助处理post请求

app.use(express.cookieParser());
app.use(express.session({
	secret: settings.cookieSecret,
	key: settings.db,
	cookie: {maxAge: 1000 * 60 * 60 * 24 * 30},
	store: new MongoStore({
		// db: settings.db
		url: 'mongodb://localhost/blog'
	})
}));



app.use(app.router);//路由解析规则
app.use(express.static(path.join(__dirname, 'public')));//将public文件夹设置位存放css js 图片 等静态文件的目录

// development only
if ('development' == app.get('env')) {//错误处理
  app.use(express.errorHandler());
}
//路由处理
// app.get('/', routes.index);

routes(app);

//创建http服务器并创建接口
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

var mongodb = require('./db');

function Comment(name, day, title, comment) {
	this.name = name;
	this.day = day;
	this.title = title;
	this.comment = comment;
}

module.exports = Comment;

//存储一条留言信息
Comment.prototype.save = function (callback) {
	var name = this.name,
	    day = this.day,
	    title = this.title,
	    comment = this.comment;
	//打开数据库

	mongodb.open(function (err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('posts', function (err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			//找到文档，然后把一条留言对象添加到该文档的comments数组里
			collection.update({
				"name": name,
				"time.day": day,
				"title": title
			}, {
				$push: {'comments': comment}
			}, function (err) {
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null);
			});
		});
	});
};
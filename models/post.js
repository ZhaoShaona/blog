var mongodb = require('./db');
    markdown = require('markdown').markdown;

function Post(name, head, title, tags, post) {
	this.name = name;
	this.head = head;
	this.title = title;
	this.tags = tags;
	this.post = post;
}
module.exports = Post;

//存储一篇文章及其信息

Post.prototype.save = function (callback) {
	var date = new Date();
	var time = {
		//存储各种时间格式，方便以后扩展
		date: date,
		year: date.getFullYear(),
		month: date.getFullYear() + "-" + (date.getMonth() + 1),
		day: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate(),
		minute: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + '-' + 
			date.getHours() + ':' + (date.getMinutes() > 10 ? date.getMinutes() : ('0' + date.getMinutes()))
	}
	var post = {
		name: this.name,
		head: this.head,
		time: time,
		title: this.title,
		tags: this.tags,
		post: this.post,
		comments: [],
		reprint_info: {},
		pv: 0
	}
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

			collection.insert(post, {
				safe: true
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

//读取文章相关信息

Post.getTen = function (name, page, callback) {
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

			var query = {};
			if (name) {
				query.name = name;
			}
			//使用count返回特定查询的文档数
			collection.count(query, function (err, total) {
				//根据query对象查询文章
				collection.find(query, {
					skip: (page - 1) * 10,
					limit: 10
				}).sort({
					time: -1
				}).toArray(function (err, docs) {
					mongodb.close();
					if (err) {
						return callback(err);
					}
					//解析 markdown为 html
					docs.forEach(function (doc) {
						doc.post = markdown.toHTML(doc.post);
					});
					callback(null, docs, total);
				});
			});
			
		}); 
	});
};

//获取第一篇文章
Post.getOne = function (name, day, title, callback) {
	//打开数据库
	mongodb.open(function (err, db) {
		if (err) {
			return callback(err);
		}
		//读取post集合

		db.collection('posts', function (err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}

			collection.findOne({
				'name': name,
				'time.day': day,
				'title': title
			}, function (err, doc) {
				
				if (err) {
					mongodb.close();
					return callback(err);
				}

				//解析markdown为 html
				// doc.post = markdown.toHTML(doc.post);
				if (doc) {
					//每访问一次增加1pv
					collection.update({
						"name": name,
						"time.day": day,
						"title": title
					}, {
						$inc: {"pv": 1}
					}, function (err) {
						mongodb.close();
						if (err) {
							return callback(err);
						}
						
					});
					
					doc.post = markdown.toHTML(doc.post);
					doc.comments.forEach(function (comment) {
						comment.content = markdown.toHTML(comment.content);
					});
					callback(null, doc);
				}
				 
			});
		});
	});
};

//返回原始发表的内容（markdown格式）
Post.edit = function (name, day, title, callback) {
	//打开数据库
	mongodb.open(function (err, db) {
		if (err) {
			return callback(err);
		}
		//读取posts集合
		db.collection('posts', function (err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			collection.findOne({
				'name': name,
				'time.day': day,
				'title': title
			}, function (err, doc) {
				if (err) {
					return callback(err);
				}
				callback(null, doc);
			});
		});
	});
};

Post.update = function (name, day, title, post, callback) {
	mongodb.open(function (err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('posts', function (err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			collection.update({
				"name": name,
				"time.day": day,
				"title": title
			}, {
				$set: {post: post}
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

Post.remove = function (name, day, title, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //读取posts
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            //根据用户名、日期和标题查找并删除一篇文章
            collection.remove({
                'name': name,
                'time.day': day,
                'title': title
            }, {
                w: 1
            }, function (err) {
                mongodb.close();
                if (err) {
                    callback(err);
                }
                callback(null);
            });
        });
    });
};

Post.getArchive = function (callback) {
	mongodb.open(function (err, db) {
		if (err) {
			return callback(err);
		}

		db.collection('posts', function (err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}

			//返回只包含name， title，time属性的文档组成的存档数据
			collection.find({}, {
				"name": 1,
				"time": 1,
				"title": 1
			}).sort({
				time: -1
			}).toArray(function (err, docs) {
				mongodb.close();

				if (err) {
					return callback(err);
				}
				callback(null, docs);
			});
		});
	});
};

Post.getTags = function (callback) {
	mongodb.open(function (err, db) {
		if (err) {
			return callback(err);
		};
		db.collection('posts', function (err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			//用distinct来找出给定键的所有不同值
			collection.distinct('tags', function (err, docs) {
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null, docs);
			});
		});
	});
};

Post.getTag = function (tag, callback) {
	mongodb.open(function (err, db) {
		if (err) {
			return callback(err);
		};
		db.collection('posts', function (err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			//查询所有tags数组内包含tag的文档
			//并返回只含有name，time，title组成的数组
			collection.find({
				"tags": tag
			},{
				"name": 1,
				"time": 1,
				"title": 1
			}).sort({
				time: -1
			}).toArray(function (err, docs) {
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null, docs);
			});
			
		});
	});
};


//返回通过标题关键字查询的所有文章信息

Post.search = function (keyword, callback) {
	mongodb.open(function (err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('posts', function (err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			var pattern = new RegExp("^.*" + keyword + ".*$", "i");
			collection.find({
				"title": pattern
			}, {
				"name": 1,
				"time": 1,
				"title":1
			}).sort({
				time: -1
			}).toArray(function (err, docs) {
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null, docs);
			});
			
		});
	});
};

Post.reprint = function (reprint_from, reprint_to, callback) {
	mongodb.open(function (err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('posts', function (err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			//找到被转载的文章的原文档
			collection.findOne({
				"name": reprint_from.name,
				"time.day": reprint_from.day,
				"title": reprint_from.title
			}, function (err, doc) {

				if (err) {
					mongodb.close();
					return callback(err);
				}

				var date = new Date();
				var time = {
					data: date,
					year: date.getFullYear(),
					month: date.getFullYear() + '-' + (date.getMonth() + 1),
					day: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate(),
					minute: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + '' +
						    date.getHours() + ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())

				}
				
			
				delete doc._id;//要删除原来的id

				doc.name = reprint_to.name;
				doc.head = reprint_to.head;
				doc.time = time;
				doc.title = (doc.title.search('/[转载]/') > -1) ? doc.title : "[转载]" + doc.title;
				doc.comments = [];
				doc.reprint_info = {'reprint_from': reprint_from};
				doc.pv = 0;


				//更新被转载的原文档的 reprint_info 内的 reprint_to

				collection.update({
					"name": reprint_from.name,
					"time.day": reprint_from.day,
					"title": reprint_from.title
				}, {
					$push: {
						"reprint_info.reprint_to": {
							"name": doc.name,
							"day": time.day,
							"title": doc.title
						}
					}
				}, function (err) {
					if (err) {
						mongodb.close();
						return callback(err);
					}
				});
				//将转载生成的副本修改后存入数据库， 并返回存储后的文档
                
				collection.insert (doc, {
					safe: true
				}, function (err, post) {
					mongodb.close();
					if (err) {
						return callback(err);
					}
					console.log(post);
					callback(err, post.ops[0]);
				});
			});
		});
	});
}
var setting = require('../settings'),
    Db = require('mongodb').Db,
    Connection = require('mongodb').Connection,
    Server = require('mongodb').Server;
//Connection.DEFAULT_POST
module.exports = new Db(setting.db, new Server(setting.host, '27017'), {safe: true});

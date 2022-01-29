const fs = require('fs'),
	config = require('./config/config.js'),
	date = require('date-and-time');

exports.appendSysLog = function(message, timestamp = date.format(new Date(), 'ddd DD MMM YYYY hh:mm:ss')) {
	const sysLog = fs.createWriteStream(config.logFilePath, { flags: 'a' });
	sysLog.write(`${timestamp}: ${message}\n`);
	console.log(message);
	sysLog.end();
};
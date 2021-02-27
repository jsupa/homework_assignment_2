var crypto = require('crypto'),
	config = require('./config.js'),
	https = require('https'),
	querystring = require('querystring');

helpers = {};

helpers.hash = function (string) {
	if (typeof (string) == 'string' && string.length > 0) {
		var hash = crypto.createHmac('sha256', config.hashSecret).update(string).digest('hex');
		return hash;
	} else {
		return false;
	}
}

helpers.parseJsonToObject = function (string) {
	try {
		var obj = JSON.parse(string);
		return obj;
	} catch (e) {
		return {};
	}
}



module.exports = helpers;
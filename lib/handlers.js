var handlers = {},
	config = require('./config.js');

handlers.ping = function (data, callback) {
	callback(200, { 'status': 200, 'message': 'Pong' });
}

handlers.notFound = function (data, callback) {
	callback(404, { 'status': 404, 'message': 'Not Found' });
};

module.exports = handlers;
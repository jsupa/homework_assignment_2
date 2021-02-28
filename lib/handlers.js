var handlers = {},
	_data = require('./data'),
	helpers = require('./helpers.js'),
	util = require('util'),
	debug = util.debuglog('handlers'),
	config = require('./config.js');


//* NODE_DEBUG=handlers node index.js

handlers._users = {};
handlers._tokens = {};

handlers.users = function (data, callback) {
	var acceptableMethods = ['post'];
	if (acceptableMethods.indexOf(data.Method) > -1) {
		handlers._users[data.Method](data, callback);
	} else {
		callback(405);
	}
};

handlers.tokens = function (data, callback) {
	var acceptableMethods = ['post','get'];
	if (acceptableMethods.indexOf(data.Method) > -1) {
		handlers._tokens[data.Method](data, callback);
	} else {
		callback(405);
	}
};

handlers._users.post = function (data, callback) {
	var firstName = typeof (data.Payload.firstName) == 'string' && data.Payload.firstName.trim().length > 0 ? data.Payload.firstName.trim() : false;
	var lastName = typeof (data.Payload.lastName) == 'string' && data.Payload.lastName.trim().length > 0 ? data.Payload.lastName.trim() : false;
	var phone = typeof (data.Payload.phone) == 'string' && data.Payload.phone.trim().length >= 10 ? data.Payload.phone.trim() : false;
	var password = typeof (data.Payload.password) == 'string' && data.Payload.password.trim().length > 0 ? data.Payload.password.trim() : false;
	var tosAgreement = typeof (data.Payload.tosAgreement) == 'boolean' && data.Payload.tosAgreement == true ? true : false;
	if (firstName && lastName && phone && password && tosAgreement) {
		_data.read('users', phone, function (err, data) {

			debug('\x1b[31m%s\x1b[0m', 'line 36  : ', err);

			if (err) {
				var hashedPassword = helpers.hash(password);
				if (hashedPassword) {
					var userObject = {
						firstName,
						lastName,
						phone,
						hashedPassword,
						tosAgreement
					};
					_data.create('users', phone, userObject, function (err) {

						debug('\x1b[31m%s\x1b[0m', 'line 52 : ', err);

						if (!err) {
							callback(200, {
								'statusCode': 200,
								'message': 'User created'
							})
						} else {
							callback(500, {
								'statusCode': 500,
								'message': 'Could not create new user'
							})
						}
					})
				} else {
					callback(500, {
						'statusCode': 500,
						'message': 'Could not hash the user password'
					})
				}
			} else {
				callback(400, {
					'statusCode': 400,
					'message': 'A user with that phone number already exists'
				})
			}
		})
	} else {
		callback(400, {
			'statusCode': 400,
			'message': 'Missing required fields'
		});
	}
};

handlers._tokens.post = function (data, callback) {
	var phone = typeof (data.Payload.phone) == 'string' && data.Payload.phone.trim().length >= 10 ? data.Payload.phone.trim() : false;
	var password = typeof (data.Payload.password) == 'string' && data.Payload.password.trim().length > 0 ? data.Payload.password.trim() : false;
	if (phone && password) {
		_data.read('users', phone, function (err, userData) {
			debug('\x1b[31m%s\x1b[0m', 'line 95  : ', err);
			debug('\x1b[31m%s\x1b[0m', 'line 96  : ', userData);
			if (!err && userData) {
				var hashedPassword = helpers.hash(password);
				if (hashedPassword == userData.hashedPassword) {
					var tokenID = helpers.createRandomString(20),
						expires = Date.now() + 1000 * 60 * 60,
						tokenObject = {
							phone,
							'id': tokenID,
							expires
						};
					_data.create('tokens', tokenID, tokenObject, function (err) {
						debug('\x1b[31m%s\x1b[0m', 'line 108  : ', err);
						if (!err) {
							callback(200, {
								'statusCode': 200,
								'message': 'Get token data',
								'data': tokenObject
							});
						} else {
							callback(500, {
								'statusCode': 500,
								'message': 'Could not create the new token'
							})
						}
					})
				} else {
					callback(400, {
						'statusCode': 400,
						'message': 'Password did not match'
					})
				}
			} else {
				callback(400, {
					'statusCode': 400,
					'message': 'Could not find the specified user'
				})
			}
		})
	} else {
		callback(400, {
			'statusCode': 400,
			'message': 'Missing required fields'
		})
	}
}

handlers._tokens.get = function (data, callback) {
	var id = typeof (data.QueryStringObject.id) == 'string' && data.QueryStringObject.id.trim().length == 20 ? data.QueryStringObject.id.trim() : false;
	if (id) {
		_data.read('tokens', id, function (err, tokenData) {
			if (!err && tokenData) {
				callback(200, {
					'statusCode': 200,
					'message': 'Get token data',
					'data': tokenData
				});
			} else {
				callback(404, {
					'statusCode': 200,
					'message': 'Could not find specified id'
				});
			}
		})
	} else {
		callback(400, {
			'statusCode': 200,
			'message': 'Missing required field'
		})
	}
}

handlers.ping = function (data, callback) {
	callback(200, {
		'statusCode': 200,
		'message': 'Pong'
	});
};

handlers.notFound = function (data, callback) {
	callback(404, {
		'statusCode': 404,
		'message': 'Not Found'
	});
};

module.exports = handlers;
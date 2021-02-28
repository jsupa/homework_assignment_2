var handlers = {},
	_data = require('./data'),
	helpers = require('./helpers.js'),
	util = require('util'),
	debug = util.debuglog('handlers'),
	config = require('./config.js');


//* NODE_DEBUG=handlers node index.js

handlers.users = function (data, callback) {
	var acceptableMethods = ['post', 'get', 'put', 'delete'];
	if (acceptableMethods.indexOf(data.Method) > -1) {
		handlers._users[data.Method](data, callback);
	} else {
		callback(405);
	}
};

handlers._users = {};

/*	
	> REGISTER USER
	? firstName, lastName, phone, password, tosAgreement
*/
handlers._users.post = function (data, callback) {
	var firstName = typeof (data.Payload.firstName) == 'string' && data.Payload.firstName.trim().length > 0 ? data.Payload.firstName.trim() : false;
	var lastName = typeof (data.Payload.lastName) == 'string' && data.Payload.lastName.trim().length > 0 ? data.Payload.lastName.trim() : false;
	var phone = typeof (data.Payload.phone) == 'string' && data.Payload.phone.trim().length >= 10 ? data.Payload.phone.trim() : false;
	var password = typeof (data.Payload.password) == 'string' && data.Payload.password.trim().length > 0 ? data.Payload.password.trim() : false;
	var tosAgreement = typeof (data.Payload.tosAgreement) == 'boolean' && data.Payload.tosAgreement == true ? true : false;
	if (firstName && lastName && phone && password && tosAgreement) {
		_data.read('users', phone, function (err, data) {

			//! DEBUG ID : _data.read.users phone 
			debug('\x1b[31m%s\x1b[0m', 'line 36 | _data.read.users phone : ' + err);

			if (err) {
				var hashedPassword = helpers.hash(password);
				if (hashedPassword) {
					var userObject = {
						firstName,
						lastName,
						phone,
						hashedPassword,
						tosAgreement,
						'archived': false
					};
					_data.create('users', phone, userObject, function (err) {

						//! DEBUG ID : _data.create.user
						debug('\x1b[31m%s\x1b[0m', 'line 52 | _data.create.user : ' + err);

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
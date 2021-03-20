const handlers = {};
const util = require('util');
const _data = require('./data');
const helpers = require('./helpers.js');

const debug = util.debuglog('handlers');

//* NODE_DEBUG=handlers node index.js

handlers._users = {};
handlers._tokens = {};
handlers._cart = {};
handlers._item = {};

handlers.users = function (data, callback) {
	const acceptableMethods = ['post', 'put'];
	if (acceptableMethods.indexOf(data.Method) > -1) {
		handlers._users[data.Method](data, callback);
	} else {
		callback(405);
	}
};

handlers.tokens = function (data, callback) {
	const acceptableMethods = ['post', 'get'];
	if (acceptableMethods.indexOf(data.Method) > -1) {
		handlers._tokens[data.Method](data, callback);
	} else {
		callback(405);
	}
};

handlers.cart = function (data, callback) {
	const acceptableMethods = ['get', 'put', 'delete'];
	if (acceptableMethods.indexOf(data.Method) > -1) {
		handlers._cart[data.Method](data, callback);
	} else {
		callback(405);
	}
};

handlers.item = function (data, callback) {
	const acceptableMethods = ['put', 'delete'];
	if (acceptableMethods.indexOf(data.Method) > -1) {
		handlers._item[data.Method](data, callback);
	} else {
		callback(405);
	}
};

handlers._users.post = function (data, callback) {
	const firstName = typeof (data.Payload.firstName) === 'string' && data.Payload.firstName.trim().length > 0 ? data.Payload.firstName.trim() : false;
	const lastName = typeof (data.Payload.lastName) === 'string' && data.Payload.lastName.trim().length > 0 ? data.Payload.lastName.trim() : false;
	const email = typeof (data.Payload.email) === 'string' && data.Payload.email.trim().length > 0 ? data.Payload.email.trim() : false;
	const phone = typeof (data.Payload.phone) === 'string' && data.Payload.phone.trim().length >= 10 ? data.Payload.phone.trim() : false;
	const password = typeof (data.Payload.password) === 'string' && data.Payload.password.trim().length > 0 ? data.Payload.password.trim() : false;
	const tosAgreement = !!(typeof (data.Payload.tosAgreement) === 'boolean' && data.Payload.tosAgreement === true);
	if (firstName && lastName && phone && password && tosAgreement && email) {
		_data.read('users', phone, (err) => {
			debug('\x1b[31m%s\x1b[0m', 'line 36  : ', err);

			if (err) {
				const hashedPassword = helpers.hash(password);
				if (hashedPassword) {
					const userObject = {
						firstName,
						lastName,
						email,
						phone,
						hashedPassword,
						tosAgreement,
						adress: null,
					};
					_data.create('users', phone, userObject, (err) => {
						debug('\x1b[31m%s\x1b[0m', 'line 52 : ', err);

						if (!err) {
							callback(200, {
								statusCode: 200,
								message: 'User created',
							});
						} else {
							callback(500, {
								statusCode: 500,
								message: 'Could not create new user',
							});
						}
					});
				} else {
					callback(500, {
						statusCode: 500,
						message: 'Could not hash the user password',
					});
				}
			} else {
				callback(400, {
					statusCode: 400,
					message: 'A user with that phone number already exists',
				});
			}
		});
	} else {
		callback(400, {
			statusCode: 400,
			message: 'Missing required fields',
		});
	}
};

handlers._users.put = function (data, callback) {
	const adress = typeof (data.Payload.adress) === 'string' && data.Payload.adress.trim().length > 0 ? data.Payload.adress.trim() : false;
	const id = typeof (data.QueryStringObject.id) === 'string' && data.QueryStringObject.id.trim().length === 20 ? data.QueryStringObject.id.trim() : false;
	if (adress && id) {
		_data.read('tokens', id, (err, tokenData) => {
			if (!err && tokenData) {
				if (tokenData.expires > Date.now()) {
					_data.read('users', tokenData.phone, (err, userData) => {
						userData.adress = adress;
						_data.update('users', tokenData.phone, userData, (err) => {
							if (!err) {
								callback(200, userData);
							} else {
								callback(500, {
									statusCode: 500,
									message: 'Could not update the user with the new check',
								});
							}
						});
					});
				} else {
					callback(404, {
						statusCode: 200,
						message: 'This token has expired',
					});
				}
			} else {
				callback(404, {
					statusCode: 200,
					message: 'Could not find specified id',
				});
			}
		});
	} else {
		callback(400, {
			statusCode: 400,
			message: 'Missing required fields',
		});
	}
};

handlers._tokens.post = function (data, callback) {
	const phone = typeof (data.Payload.phone) === 'string' && data.Payload.phone.trim().length >= 10 ? data.Payload.phone.trim() : false;
	const password = typeof (data.Payload.password) === 'string' && data.Payload.password.trim().length > 0 ? data.Payload.password.trim() : false;
	if (phone && password) {
		_data.read('users', phone, (err, userData) => {
			debug('\x1b[31m%s\x1b[0m', 'line 95  : ', err);
			debug('\x1b[31m%s\x1b[0m', 'line 96  : ', userData);
			if (!err && userData) {
				const hashedPassword = helpers.hash(password);
				if (hashedPassword === userData.hashedPassword) {
					const tokenID = helpers.createRandomString(20);
					const expires = Date.now() + 1000 * 60 * 60;
					const tokenObject = {
						phone,
						id: tokenID,
						expires,
					};
					_data.create('tokens', tokenID, tokenObject, (err) => {
						debug('\x1b[31m%s\x1b[0m', 'line 108  : ', err);
						if (!err) {
							callback(200, {
								statusCode: 200,
								message: 'Get token data',
								data: tokenObject,
							});
						} else {
							callback(500, {
								statusCode: 500,
								message: 'Could not create the new token',
							});
						}
					});
				} else {
					callback(400, {
						statusCode: 400,
						message: 'Password did not match',
					});
				}
			} else {
				callback(400, {
					statusCode: 400,
					message: 'Could not find the specified user',
				});
			}
		});
	} else {
		callback(400, {
			statusCode: 400,
			message: 'Missing required fields',
		});
	}
};

handlers._tokens.get = function (data, callback) {
	const id = typeof (data.QueryStringObject.id) === 'string' && data.QueryStringObject.id.trim().length === 20 ? data.QueryStringObject.id.trim() : false;
	if (id) {
		_data.read('tokens', id, (err, tokenData) => {
			if (!err && tokenData) {
				if (tokenData.expires > Date.now()) {
					_data.read('users', tokenData.phone, (err, userData) => {
						callback(200, {
							statusCode: 200,
							message: 'Get token data',
							tokenData,
							userData,

						});
					});
				} else {
					callback(400, {
						statusCode: 400,
						message: 'This token has expired',
					});
				}
			} else {
				callback(404, {
					statusCode: 404,
					message: 'Could not find specified id',
				});
			}
		});
	} else {
		callback(404, {
			statusCode: 404,
			message: 'Missing required field',
		});
	}
};

handlers._cart.put = function (data, callback) {
	const tokenID = typeof (data.Payload.id) === 'string' && data.Payload.id.trim().length === 20 ? data.Payload.id.trim() : false;
	const pizzaID = typeof (data.Payload.pizza) === 'number' && data.Payload.pizza.toString().length >= 1 ? data.Payload.pizza : false;
	const message = typeof (data.Payload.message) === 'string' && data.Payload.message.trim().length > 0 ? data.Payload.message : null;
	if (tokenID && pizzaID) {
		_data.read('tokens', tokenID, (err, tokenData) => {
			if (!err && tokenData) {
				if (tokenData.expires > Date.now()) {
					_data.read('menu', 'menu', (err, menuData) => {
						const pizza = menuData.find((el) => el.id === pizzaID);
						if (pizza) {
							const cartObject = {
								cart: [{
									id: 1,
									name: pizza.name,
									price: pizza.price,
									message,
								}],
								status: 'waiting for customer to make order',
							};
							_data.create('cart', tokenData.phone, cartObject, (err) => {
								debug('\x1b[31m%s\x1b[0m', 'line 108  : ', err);
								if (!err) {
									callback(200, {
										statusCode: 200,
										message: 'Pizza added to cart',
										data: cartObject,
									});
								} else {
									handlers._item.put(data, callback);
								}
							});
						} else {
							callback(404, {
								statusCode: 404,
								message: 'Pizza does not exist',
							});
						}
					});
				} else {
					callback(400, {
						statusCode: 400,
						message: 'This token has expired',
					});
				}
			} else {
				callback(404, {
					statusCode: 404,
					message: 'Could not find specified id',
				});
			}
		});
	} else {
		callback(400, {
			statusCode: 400,
			message: 'Missing required field',
		});
	}
};

handlers._item.put = function (data, callback) {
	const tokenID = typeof (data.Payload.id) === 'string' && data.Payload.id.trim().length === 20 ? data.Payload.id.trim() : false;
	const pizzaID = typeof (data.Payload.pizza) === 'number' && data.Payload.pizza.toString().length >= 1 ? data.Payload.pizza : false;
	const message = typeof (data.Payload.message) === 'string' && data.Payload.message.trim().length > 0 ? data.Payload.message : null;
	if (tokenID && pizzaID) {
		_data.read('tokens', tokenID, (err, tokenData) => {
			if (!err && tokenData) {
				if (tokenData.expires > Date.now()) {
					_data.read('menu', 'menu', (err, menuData) => {
						const pizza = menuData.find((el) => el.id === pizzaID);
						if (pizza) {
							_data.read('cart', tokenData.phone, (err, cartData) => {
								const NextId = cartData.cart[cartData.cart.length - 1].id;
								cartData.cart.push({
									id: NextId + 1,
									name: pizza.name,
									message,
									price: pizza.price,
								});
								_data.update('cart', tokenData.phone, cartData, (err) => {
									if (!err) {
										callback(200, {
											statusCode: 200,
											message: 'Pizza added to the cart',
											data: cartData,
										});
									} else {
										callback(500, {
											statusCode: 500,
											message: 'Could not update the cart with the new pizza',
										});
									}
								});
							});
						} else {
							callback(404, {
								statusCode: 404,
								message: 'Pizza does not exist',
							});
						}
					});
				} else {
					callback(400, {
						statusCode: 400,
						message: 'This token has expired',
					});
				}
			} else {
				callback(404, {
					statusCode: 404,
					message: 'Could not find specified id',
				});
			}
		});
	} else {
		callback(400, {
			statusCode: 400,
			message: 'Missing required field',
		});
	}
};

handlers._item.delete = function (data, callback) {
	const tokenID = typeof (data.Payload.id) === 'string' && data.Payload.id.trim().length === 20 ? data.Payload.id.trim() : false;
	const itemID = typeof (data.Payload.item) === 'number' ? data.Payload.item : false;
	if (tokenID && itemID) {
		_data.read('tokens', tokenID, (err, tokenData) => {
			if (!err && tokenData) {
				if (tokenData.expires > Date.now()) {
					_data.read('cart', tokenData.phone, (err, cartData) => {
						const checkItemID = cartData.cart.find((el) => el.id === itemID);
						if (checkItemID) {
							helpers.removeById(cartData.cart, itemID);
							_data.update('cart', tokenData.phone, cartData, (err) => {
								if (!err) {
									callback(200, {
										statusCode: 200,
										message: 'Pizza deleted from the cart',
										data: cartData,
									});
								} else {
									callback(500, {
										statusCode: 500,
										message: 'Could not deleted pizza from the cart',
									});
								}
							});
						} else {
							callback(404, {
								statusCode: 404,
								message: 'Could not find item id in cart',
							});
						}
					});
				} else {
					callback(400, {
						statusCode: 400,
						message: 'This token has expired',
					});
				}
			} else {
				callback(404, {
					statusCode: 404,
					message: 'Could not find specified id',
				});
			}
		});
	} else {
		callback(400, {
			statusCode: 400,
			message: 'Missing required field',
		});
	}
};

handlers._cart.get = function (data, callback) {
	const tokenID = typeof (data.QueryStringObject.id) === 'string' && data.QueryStringObject.id.trim().length === 20 ? data.QueryStringObject.id.trim() : false;
	if (tokenID) {
		_data.read('tokens', tokenID, (err, tokenData) => {
			if (!err && tokenData) {
				if (tokenData.expires > Date.now()) {
					_data.read('cart', tokenData.phone, (err, cartData) => {
						if (!err) {
							let total = 0;
							cartData.cart.forEach((item) => {
								total += item.price;
							});
							callback(200, {
								statusCode: 200,
								message: 'Get cart data',
								total,
								data: cartData,
							});
						} else {
							callback(500, {
								statusCode: 500,
								message: 'Could find active cart',
								error: err,
							});
						}
					});
				} else {
					callback(400, {
						statusCode: 400,
						message: 'This token has expired',
					});
				}
			} else {
				callback(404, {
					statusCode: 404,
					message: 'Could not find specified token id',
				});
			}
		});
	} else {
		callback(400, {
			statusCode: 400,
			message: 'Missing required field',
		});
	}
};

handlers._cart.delete = function (data, callback) {
	const tokenID = typeof (data.QueryStringObject.id) === 'string' && data.QueryStringObject.id.trim().length === 20 ? data.QueryStringObject.id.trim() : false;
	if (tokenID) {
		_data.read('tokens', tokenID, (err, tokenData) => {
			if (!err && tokenData) {
				if (tokenData.expires > Date.now()) {
					_data.delete('cart', tokenData.phone, (err) => {
						if (!err) {
							callback(200, {
								statusCode: 200,
								message: 'Data successfully deleted',
							});
						} else {
							callback(500, {
								statusCode: 500,
								error: err,
							});
						}
					});
				} else {
					callback(400, {
						statusCode: 400,
						message: 'This token has expired',
					});
				}
			} else {
				callback(404, {
					statusCode: 404,
					message: 'Could not find specified token id',
				});
			}
		});
	} else {
		callback(400, {
			statusCode: 400,
			message: 'Missing required field',
		});
	}
};

handlers.menu = function (data, callback) {
	const acceptableMethods = ['get'];
	if (acceptableMethods.indexOf(data.Method) > -1) {
		_data.read('menu', 'menu', (err, menuData) => {
			if (!err && menuData) {
				callback(200, {
					statusCode: 200,
					message: 'Today menu',
					data: menuData,
				});
			} else {
				callback(400, {
					statusCode: 400,
					message: 'Could not find the specified user',
				});
			}
		});
	} else {
		callback(404, {
			statusCode: 404,
			message: 'Method not Found',
		});
	}
};

handlers.ping = function (data, callback) {
	callback(200, {
		statusCode: 200,
		message: 'Pong',
	});
};

handlers.notFound = function (data, callback) {
	callback(404, {
		statusCode: 404,
		message: 'Not Found',
	});
};

module.exports = handlers;

const crypto = require('crypto');
const https = require('https');
const querystring = require('querystring');

const config = require('./config.js');

const helpers = {};

helpers.hash = function (string) {
	if (typeof (string) === 'string' && string.length > 0) {
		const hash = crypto.createHmac('sha256', config.hashSecret).update(string).digest('hex');
		return hash;
	} else {
		return false;
	}
};

helpers.parseJsonToObject = function (string) {
	try {
		const obj = JSON.parse(string);
		return obj;
	} catch (e) {
		return {};
	}
};

helpers.createRandomString = function (length) {
	length = typeof (length) === 'number' && length > 0 ? length : false;
	if (length) {
		const possibleCharactes = 'abcdefghijklmnopqrstuvwxyz0123456789';
		let str = '';
		for (let i = 1; i <= length; i++) {
			const randomCharacter = possibleCharactes.charAt(Math.floor(Math.random() * possibleCharactes.length));
			str += randomCharacter;
		}
		return str;
	} else {
		return false;
	}
};

helpers.removeById = (arr, id) => {
	const requiredIndex = arr.findIndex((el) => el.id === id);
	if (requiredIndex === -1) {
		return false;
	}
	return !!arr.splice(requiredIndex, 1);
};

helpers.purchase = function (data, callback) {
	const price = typeof (data.price) === 'number' ? data.price : false;
	const customer = typeof (data.customer) === 'string' ? data.customer : 'you';

	const requestDetails = querystring.stringify({
		currency: config.currency,
		source: 'tok_mastercard',
		description: `Some good pizza for ${customer}`,
		amount: price,
	});

	const options = {
		protocol: 'https:',
		hostname: 'api.stripe.com',
		method: 'POST',
		auth: 'sk_test_4eC39HqLyjWDarjtT1zdp7dc',
		path: '/v1/charges',
		headers: {
			'Content-Length': Buffer.byteLength(requestDetails),
			Accept: 'application/json',
			'Content-Type': 'application/x-www-form-urlencoded',
		},
	};

	// eslint-disable-next-line consistent-return
	const req = https.request(options, (res) => {
		if (res.statusCode === 200 || res.statusCode === 201) {
			res.on('data', (d) => {
				data = helpers.parseJsonToObject(d);
				callback(data.receipt_url);
			});
		} else {
			callback({ Error: 'Payment error' });
		}
	});

	req.on('error', (error) => (error));

	req.write(requestDetails);
	req.end();
};

module.exports = helpers;

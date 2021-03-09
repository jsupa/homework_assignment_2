const fs = require('fs');
const path = require('path');
const helpers = require('./helpers.js');

const lib = {};

// eslint-disable-next-line no-undef
lib.baseDir = path.join(__dirname, './../data/');

lib.create = function (dir, file, data, callback) {
	fs.open(`${lib.baseDir + dir}/${file}.json`, 'wx', (err, fileDescriptor) => {
		if (!err && fileDescriptor) {
			const stringData = JSON.stringify(data);
			fs.writeFile(fileDescriptor, stringData, (err) => {
				if (!err) {
					fs.close(fileDescriptor, (err) => {
						if (!err) {
							callback(false);
						} else {
							callback('Error closing new file', err);
						}
					});
				} else {
					callback('Error writing to new file', err);
				}
			});
		} else {
			callback('Could not create new file, it may already exist', err);
		}
	});
};

lib.read = function (dir, file, callback) {
	fs.readFile(`${lib.baseDir + dir}/${file}.json`, 'utf8', (err, data) => {
		if (!err && data) {
			const parseData = helpers.parseJsonToObject(data);
			callback(false, parseData);
		} else {
			callback(err, data);
		}
	});
};

lib.update = function (dir, file, data, callback) {
	fs.open(`${lib.baseDir + dir}/${file}.json`, 'r+', (err, fileDescriptor) => {
		if (!err && fileDescriptor) {
			const stringData = JSON.stringify(data);
			fs.ftruncate(fileDescriptor, (err) => {
				if (!err) {
					fs.writeFile(fileDescriptor, stringData, (err) => {
						if (!err) {
							fs.close(fileDescriptor, (err) => {
								if (!err) {
									callback(false);
								} else {
									callback('Error closing existing file', err);
								}
							});
						} else {
							callback('Error writing to existing file', err);
						}
					});
				} else {
					callback('Error truncating file', err);
				}
			});
		} else {
			callback('Could not open the file for updating, it may not exist yet', err);
		}
	});
};

lib.delete = function (dir, file, callback) {
	fs.unlink(`${lib.baseDir + dir}/${file}.json`, (err) => {
		if (!err) {
			callback(false);
		} else {
			callback('Error deleting file', err);
		}
	});
};

module.exports = lib;

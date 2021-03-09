const server = require('./lib/server');

const app = {};

app.init = function () {
    server.init();
};

app.init();

module.exports = app;

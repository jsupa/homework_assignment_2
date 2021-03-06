const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const stringDecoder = require('string_decoder').StringDecoder;
const util = require('util');
const path = require('path');
const config = require('./config.js');
const handlers = require('./handlers.js');
const helpers = require('./helpers.js');

const debug = util.debuglog('server');

//* NODE_DEBUG=server node index.js

const server = {};

server.httpsServerOptions = {
    // eslint-disable-next-line no-undef
    key: fs.readFileSync(path.join(__dirname, '/../https/key.pen')),
    // eslint-disable-next-line no-undef
    cert: fs.readFileSync(path.join(__dirname, '/../https/cart.pen')),
};

server.httpServer = http.createServer((req, res) => {
    server.unifiedServer(req, res);
});

server.httpsServer = https.createServer(server.httpsServerOptions, (req, res) => {
    server.unifiedServer(req, res);
});

server.unifiedServer = function (req, res) {
    const ParsedUrl = url.parse(req.url, true);
    const Path = ParsedUrl.pathname;
    const TrimmedPath = Path.replace(/^\/+|\/+$/g, '');
    const Method = req.method.toLowerCase();
    const QueryStringObject = ParsedUrl.query;
    const Headers = req.headers;
    const Decoder = new stringDecoder('utf-8');
    let buffer = '';

    req.on('data', (data) => {
        buffer += Decoder.write(data);
    });

    req.on('end', () => {
        buffer += Decoder.end();

        const ChoseHandler = typeof (server.router[TrimmedPath]) !== 'undefined' ? server.router[TrimmedPath] : handlers.notFound;

        const data = {
            TrimmedPath,
            QueryStringObject,
            Method,
            Headers,
            Payload: helpers.parseJsonToObject(buffer),
        };

        ChoseHandler(data, (statusCode, Payload) => {
            statusCode = typeof (statusCode) === 'number' ? statusCode : 200;
            Payload = typeof (Payload) === 'object' ? Payload : Payload;
            const PayloadString = JSON.stringify(Payload);

            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(PayloadString);

            if (statusCode === 200) {
                debug('\x1b[32m%s\x1b[0m', `${Method.toUpperCase()} /${TrimmedPath} ${statusCode}`);
            } else {
                debug('\x1b[31m%s\x1b[0m', `${Method.toUpperCase()} /${TrimmedPath} ${statusCode}`);
            }
        });
    });
};

server.router = {
    ping: handlers.ping,
    users: handlers.users,
    tokens: handlers.tokens,
    menu: handlers.menu,
    cart: handlers.cart,
    item: handlers.item,
    order: handlers.order,
};

server.init = function () {
    server.httpServer.listen(config.httpPort, () => {
        console.log('\x1b[36m%s\x1b[0m', `Server listening on port ${config.httpPort}`);
    });

    server.httpsServer.listen(config.httpsPort, () => {
        console.log('\x1b[35m%s\x1b[0m', `Server listening on port ${config.httpsPort}`);
    });
};

module.exports = server;

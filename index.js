const environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';
const config = require('./config').get(environment);
const http = require('http');
const server = require('./app');

server.appTitle(environment, config.server.port);

http.createServer(function (req, res) {
    server.webhook(req, res, function (err) {});
    server.serveStatic(req,res);
}).listen(config.server.port);

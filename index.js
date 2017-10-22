var config = require('./config');
var http = require('http');
var createHandler = require('github-webhook-handler');
var handler = createHandler({
    path: config.path,
    secret: config.hash
});

http.createServer(function (req, res) {
    console.log("Github-Webhook-Server is listening on port " + config.port);
    handler(req, res, function (err) {
        res.statusCode = 404;
        res.end('no such location');
    });
}).listen(config.port);

handler.on('error', function (err) {
    console.error('Error:', err.message);
});

handler.on('push', function (event) {
    console.log('Received a push event for %s to %s',
        event.payload.repository.name,
        event.payload.ref);
    console.log(event.payload);
});

handler.on('issues', function (event) {
    console.log('Received an issue event for %s action=%s: #%d %s',
        event.payload.repository.name,
        event.payload.action,
        event.payload.issue.number,
        event.payload.issue.title);
});

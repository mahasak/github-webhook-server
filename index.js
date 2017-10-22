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
    // event.payload.ref -> ref branch
    // event.payload.head_commit.id -> head commit hash id
    // event.payload.head_commits.lenght -> commits in pushs
    /**
     * head_commit:
        { id: 'b622b2c5faf7130fdc8c459537935f5c57f23d45',
            tree_id: '948e408a6ee9fb5297861cf5bd183ffb4f81c02d',
            distinct: true,
            message: 'add debug to test',
            timestamp: '2017-10-22T22:31:22+07:00',
            url: 'https://github.com/mahasak/github-webhook-server/commit/b622b2c5faf7130fdc8c459537935f5c57f23d45',
            author:
            { name: 'Mahasak Pijittum',
                email: 'mahasak@gmail.com',
                username: 'mahasak' },
            committer:
            { name: 'Mahasak Pijittum',
                email: 'mahasak@gmail.com',
                username: 'mahasak' },
            added: [],
            removed: [],
            modified: [ 'index.js' ] 
        }
     */

});

handler.on('issues', function (event) {
    console.log('Received an issue event for %s action=%s: #%d %s',
        event.payload.repository.name,
        event.payload.action,
        event.payload.issue.number,
        event.payload.issue.title);
});

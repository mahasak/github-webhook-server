var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';
var config = require('./config').get(environment);
var http = require('http');
var createHandler = require('github-webhook-handler');

var firebase = require('firebase');
var firebaseApp = firebase.initializeApp(config.firebase);
var Influx = require('influx');
var os = require('os');
var influx = new Influx.InfluxDB(config.influx);
const url = require('url');
const fs = require('fs');
const path = require('path');
const dashboard = require('./app');

var handler = createHandler({
    path: config.github.path,
    secret: config.github.hash
});

var serveStatic = (req, res) => {
    console.log(`STATIC Handler => ${req.method} ${req.url}`);

    // parse URL
    const parsedUrl = url.parse(req.url);
    
    // extract URL path
    let pathname = (parsedUrl.pathname === '/') ? `./static/index.html` : `./static/${parsedUrl.pathname}`;
    
    // based on the URL path, extract the file extention. e.g. .js, .doc, ...
    const ext = path.parse(pathname).ext;

    // maps file extention to MIME typere
    const map = {
        '.ico': 'image/x-icon',
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.json': 'application/json',
        '.css': 'text/css',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.wav': 'audio/wav',
        '.mp3': 'audio/mpeg',
        '.svg': 'image/svg+xml',
        '.pdf': 'application/pdf',
        '.doc': 'application/msword'
    };

    fs.exists(pathname, function (exist) {
        if (!exist) {
            // if the file is not found, return 404
            res.statusCode = 404;
            res.end(`File ${pathname} not found!`);
            return;
        }

        // if is a directory search for index file matching the extention
        if (fs.statSync(pathname).isDirectory()) pathname += '/index' + ext;

        // read file from file system
        fs.readFile(pathname, function (err, data) {
            if (err) {
                res.statusCode = 500;
                res.end(`Error getting the file: ${err}.`);
            } else {
                // if the file is found, set Content-type and send data
                res.setHeader('Content-type', map[ext] || 'text/plain');
                res.end(data);
            }
        });
    });
}




dashboard.appTitle(environment, config.server.port);

http.createServer(function (req, res) {
    

    handler(req, res, function (err) {
        //res.statusCode = 404;
        //res.end('no such location');
    });

    serveStatic(req,res);

    
}).listen(config.server.port);

handler.on('error', function (err) {
    console.error('Error:', err.message);
});

handler.on('push', function (event) {
    console.log('Received a push event for %s to %s',
        event.payload.repository.name,
        event.payload.ref
    );

    influx.writePoints([{
        measurement: 'github_pushes',
        tags: {
            host: os.hostname()
        },
        fields: {
            repository: event.payload.repository.name,
            author: event.payload.head_commit.author.name,
            commits: event.payload.commits.length
        },
    }]).catch(err => {
        console.error(`Error saving data to InfluxDB! ${err.stack}`);
    });

    writeGitCommitData(
        event.payload.head_commit.id,
        event.payload.ref,
        event.payload.head_commit.author.name,
        event.payload.head_commit.message,
        event.payload.commits.length
    );
});

handler.on('issues', function (event) {
    console.log('Received an issue event for %s action=%s: #%d %s',
        event.payload.repository.name,
        event.payload.action,
        event.payload.issue.number,
        event.payload.issue.title
    );

    influx.writePoints([{
        measurement: 'github_issues',
        tags: {
            host: os.hostname()
        },
        fields: {
            repository: Ievent.payload.repository.name,
            author: "",
        },
    }]).catch(err => {
        console.error(`Error saving data to InfluxDB! ${err.stack}`);
    });

    writeIssueData(
        event.payload.issue.number,
        event.payload.issue.title,
        event.payload.repository.name,
        event.payload.action
    );
});

function writeGitCommitData(commitId, ref, author, message, commits) {
    firebase.database().ref('commits/' + commitId).set({
        ref: ref,
        author: author,
        message: message,
        commits: commits,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    });
}

function writeIssueData(issueNumber, issueTitle, repository, action) {
    var guid = Guid.create().value;
    firebase.database().ref('issues/' + guid).set({
        issueNumber: issueNumber,
        issueTitle: issueTitle,
        repository: repository,
        action: action,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    });
}
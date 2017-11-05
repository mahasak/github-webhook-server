const environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development'

const config = require('./config').get(environment)
const createHandler = require('github-webhook-handler')
const figlet = require('figlet')
const firebase = require('firebase')
const firebaseApp = firebase.initializeApp(config.firebase)
const fs = require('fs')
const Influx = require('influx')
const influx = new Influx.InfluxDB(config.influx)
const os = require('os')
const path = require('path')
const url = require('url')

const webhook = createHandler({
    path: config.github.path,
    secret: config.github.hash
})

webhook.on('error', function (err) {
    console.error('Error:', err.message);
});

webhook.on('push', function (event) {
    console.log('Received a push event for %s to %s',
        event.payload.repository.name,
        event.payload.ref
    );

    influx.writePoints([{
        measurement: 'github_pushes',
        tags: {
            host: os.hostname(),
            author: event.payload.head_commit.author.name,
            repository: event.payload.repository.name
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

webhook.on('issues', function (event) {
    console.log('Received an issue event for %s action=%s: #%d %s',
        event.payload.repository.name,
        event.payload.action,
        event.payload.issue.number,
        event.payload.issue.title
    );

    influx.writePoints([{
        measurement: 'github_issues',
        tags: {
            host: os.hostname(),
            author: event.payload.head_commit.author.name,
            repository: event.payload.repository.name
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

const writeGitCommitData = (commitId, ref, author, message, commits) => {
    firebase.database().ref('commits/' + commitId).set({
        commitId: commitId,
        ref: ref,
        author: author,
        message: message,
        commits: commits,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    });
}

const writeIssueData = (issueNumber, issueTitle, repository, action) => {
    var guid = Guid.create().value;
    firebase.database().ref('issues/' + guid).set({
        issueNumber: issueNumber,
        issueTitle: issueTitle,
        repository: repository,
        action: action,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    });
}

const serveStatic = (req, res) => {
    const parsedUrl = url.parse(req.url);
    let pathname = (parsedUrl.pathname === '/') ? `./static/index.html` : `./static/${parsedUrl.pathname}`;
    const ext = path.parse(pathname).ext;
    
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
            res.statusCode = 404;
            res.end(`File ${pathname} not found!`);
            return;
        }

        if (fs.statSync(pathname).isDirectory()) pathname += '/index' + ext;

        fs.readFile(pathname, function (err, data) {
            if (err) {
                res.statusCode = 500;
                res.end(`Error getting the file: ${err}.`);
            } else {
                res.setHeader('Content-type', map[ext] || 'text/plain');
                res.end(data);
            }
        });
    });
}

const server = {
    appTitle: () => {
        figlet('Github Webhook !!', function (err, data) {
            if (err) {
                console.log('Something went wrong...');
                console.dir(err);
                return;
            }
            console.log(data);
            console.log("Github-Webhook-Server listening on port " + config.server.port + " in mode " + environment);
        })
    },
    webhook: webhook,
    serveStatic: serveStatic
}

module.exports = server;

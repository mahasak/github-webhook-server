var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';
var config = require('./config').get(environment);
var http = require('http');
var createHandler = require('github-webhook-handler');
var handler = createHandler({
    path: config.github.path,
    secret: config.github.hash
});
var figlet = require('figlet');
var firebase = require('firebase');
var app = firebase.initializeApp(config.firebase);
var Influx = require('influx');
var os = require('os');
var influx = new Influx.InfluxDB(config.influx);

figlet('Github Webhook !!', function (err, data) {
    if (err) {
        console.log('Something went wrong...');
        console.dir(err);
        return;
    }
    console.log(data);
    console.log("Github-Webhook-Server listening on port " + config.server.port + " in mode " + environment);
});

http.createServer(function (req, res) {
    handler(req, res, function (err) {
        res.statusCode = 404;
        res.end('no such location');
    });
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
        commits: commits
    });
}

function writeIssueData(issueNumber, issueTitle, repository, action) {
    var guid = Guid.create().value;
    firebase.database().ref('issues/' + guid).set({
        issueNumber: issueNumber,
        issueTitle: issueTitle,
        repository: repository,
        action: action
    });
}

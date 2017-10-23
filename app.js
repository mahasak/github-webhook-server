var figlet = require('figlet');

const dashboard = {
    appTitle : (environment, port) => {
        figlet('Github Webhook !!', function (err, data) {
            if (err) {
                console.log('Something went wrong...');
                console.dir(err);
                return;
            }
            console.log(data);
            console.log("Github-Webhook-Server listening on port " + port + " in mode " + environment);
        })
    }
}

module.exports = dashboard;

var Influx = require('influx');

var configData = {
    development: {
        server: {
            port: 7777
        },
        github: {
            path: "/webhook",
            hash: "put-yourhash-here"
        },
        firebase: {
            apiKey: "FIREBASE-API-KEY",
            authDomain: "PROJECT_ID.firebaseapp.com",
            databaseURL: "https://PROJECT_ID.firebaseio.com",
            projectId: "PROJECT_ID",
            storageBucket: "",
            messagingSenderId: "MESSAGING_SENDER_ID"
        },
        influx: {
            host: 'INFLUX_DB_HOST',
            database: 'INFLUX_DB_NAME',
            schema: [
              {
                measurement: 'github_pushes',
                fields: {
                  repository: Influx.FieldType.STRING,
                  author: Influx.FieldType.STRING,
                  commits: Influx.FieldType.INTEGER
                },
                tags: [
                  'host'
                ]
              },
              {
                measurement: 'github_issuess',
                fields: {
                  repository: Influx.FieldType.STRING,
                  author: Influx.FieldType.STRING,
                },
                tags: [
                  'host'
                ]
              }
            ]
        }
    },
    production: {
        server: {
            port: 7777
        },
        github: {
            path: "/webhook",
            hash: "put-your-hash-here"
        },
        firebase: {
            apiKey: "FIREBASE-API-KEY",
            authDomain: "PROJECT_ID.firebaseapp.com",
            databaseURL: "https://PROJECT_ID.firebaseio.com",
            projectId: "PROJECT_ID",
            storageBucket: "",
            messagingSenderId: "MESSAGING_SENDER_ID"
        },
        influx: {
            host: 'INFLUX_DB_HOST',
            database: 'INFLUX_DB_NAME',
            schema: [
              {
                measurement: 'github_pushes',
                fields: {
                  repository: Influx.FieldType.STRING,
                  author: Influx.FieldType.STRING,
                  commits: Influx.FieldType.INTEGER
                },
                tags: [
                  'host'
                ]
              },
              {
                measurement: 'github_issuess',
                fields: {
                  repository: Influx.FieldType.STRING,
                  author: Influx.FieldType.STRING,
                },
                tags: [
                  'host'
                ]
              }
            ]
        }
    },
};

var config = {
    get: function(environment) {
        return configData.development;
    }
};

module.exports = config;

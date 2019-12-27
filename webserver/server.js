/*eslint-env node*/
(function() {
    'use strict';

    var express = require('express');
    var compression = require('compression');
    var url = require('url');
    var request = require('request');
    var rp = require('request-promise');
    var mqtt = require('mqtt');

    var satMap = {};
    satMap['iridium'] = {
        source: 'https://www.celestrak.com/NORAD/elements/iridium-NEXT.txt',
        sats: []
    };
    satMap['starlink'] = {
        source: 'https://www.celestrak.com/NORAD/elements/starlink.txt',
        sats: []
    };
    satMap['gps'] = {
        source: '',
        sats: []
    };

    var yargs = require('yargs').options({
        'port' : {
            'default' : 3001,
            'description' : 'Port to listen on.'
        },
        'public' : {
            'type' : 'boolean',
            'description' : 'Run a public server that listens on all interfaces.'
        },
        'help' : {
            'alias' : 'h',
            'type' : 'boolean',
            'description' : 'Show this help.'
        }
    });
    var argv = yargs.argv;
    
    if (argv.help) {
        return yargs.showHelp();
    }

    var mime = express.static.mime;
    mime.define({
        'application/json' : ['czml', 'json', 'geojson', 'topojson'],
        'image/crn' : ['crn'],
        'image/ktx' : ['ktx'],
        'model/gltf+json' : ['gltf'],
        'model/gltf.binary' : ['bgltf', 'glb'],
        'text/plain' : ['glsl']
    });

    var app = express();
    app.use(compression());
    app.use(express.json());
    app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });
    app.use(express.static(__dirname));

    app.get('/sats', function (req, res) {
        var id = req.query.id;
        var now = Date.now();
        if ((satMap[id].lastUpdate) && ((now - satMap[id].lastUpdate) > 3600000)) {
            satMap[id].sats = [];
        }
        if (satMap[id].sats.length > 0) {
            res.send(satMap[id].sats);
        } else {
            var url = satMap[id].source;
            getSatellites(url).then((data) => {
                satMap[id].sats = data;
                satMap[id].lastUpdate = Date.now();
                res.send(satMap[id].sats);
            });
        }
    });


    function getSatellites(source) {
        console.log("getting satellites from " + source);
        return rp(source)
            .then(function (body) {
                var lines = body.split(/\r?\n/);
                var satellites = [];
            var i = 0;
            var done = false;
            while(true) {
                var line = lines[i++];
                if (!line) break;
                if (!((line.startsWith("1")) || (line.startsWith("2")))) {
                    if (line.trim().endsWith("DEB")) { // skip debris
                        line += 2;
                    } else {
                        satellites.push({
                            name: line.trim(),
                            tle: [lines[i++], lines[i++]]
                        });
                    }
                }
            }
            return satellites;
        })
        .catch(function (err) {
            console.log("ERROR:" + err);
        });
    }
    

    var server = app.listen(argv.port, argv.public ? undefined : 'localhost', function() {
        if (argv.public) {
            console.log('Cesium development server running publicly.  Connect to http://localhost:%d/', server.address().port);
        } else {
            console.log('Cesium development server running locally.  Connect to http://localhost:%d/', server.address().port);
        }
    });

    server.on('error', function (e) {
        if (e.code === 'EADDRINUSE') {
            console.log('Error: Port %d is already in use, select a different port.', argv.port);
            console.log('Example: node server.js --port %d', argv.port + 1);
        } else if (e.code === 'EACCES') {
            console.log('Error: This process does not have permission to listen on port %d.', argv.port);
            if (argv.port < 1024) {
                console.log('Try a port number higher than 1024.');
            }
        }
        console.log(e);
        process.exit(1);
    });

    var io = require('socket.io')(server);

    io.on('connection', function(client) {
        client.on('join', function(data) {
            console.log(data);
        });
    });

    var options = {
        host: 'your_mqtt_server',
        port: 1883,
        username: 'mqtt_user',
        password: 'mqtt_password'
    }

    var mqttClient  = mqtt.connect(options)

    mqttClient.on('connect', function () {
        mqttClient.subscribe('iridium', function (err) {
            if (!err) {
                console.log("successfully subscribed to topic");
            } else {
                console.log("failed to subscrib to topic");
            }
        });
    });

    mqttClient.on('message', function (topic, message) {
        io.sockets.emit('iridium-data', message.toString());
    });

    server.on('close', function() {
        console.log('Cesium development server stopped.');
    });


    var isFirstSig = true;
    process.on('SIGINT', function() {
        if (isFirstSig) {
            console.log('Cesium development server shutting down.');
            server.close(function() {
              process.exit(0);
            });
            isFirstSig = false;
        } else {
            console.log('Cesium development server force kill.');
            process.exit(1);
        }
    });

})();

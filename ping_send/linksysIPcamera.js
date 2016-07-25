var exec = require('child_process').exec;
var http = require('http');
var ioFabricClient = require('@iotracks/container-sdk-nodejs');

const capturemodeList = ['photo','videostream'];
var frequency = 1000;
var currentConfig;
var IP_ADDRESS;
var wsMessageConnected;

ioFabricClient.init('iofabric', 54321, null,
    function() {
        console.log("INIT");
        fetchConfig();
        ioFabricClient.wsControlConnection(
            {
                'onNewConfigSignal':
                    function onNewConfigSignal() {
                        fetchConfig();
                    },
                'onError':
                    function onControlSocketError(error) {
                        console.error('There was an error with Control WebSocket connection to ioFabric: ', error);
                    }
            }
        );
        ioFabricClient.wsMessageConnection(
            function(ioFabricClient) {
                console.log("CONNECTED");
                wsMessageConnected = true;
                main();
            },
            {
                'onMessages':
                    function(messages) {/* don't need to send message on connect */},
                'onMessageReceipt':
                    function(messageId, timestamp) {/* message was sent successfully */},
                'onError':
                    function(error) {
                        console.error('There was an error with Message WebSocket connection to ioFabric: \n', error);
                    }
            }
        );
    }
);


function fetchConfig() {
    ioFabricClient.getConfig(
        {
            'onBadRequest':
                function onGetConfigBadRequest(errorMsg) {
                    console.error('There was an error in request for getting config from the local API: ', errorMsg );
                },
            'onNewConfig':
                function onGetNewConfig(config) {
                    try {
                        if(config) {
                            if (JSON.stringify(config) !== JSON.stringify(currentConfig)) {
                                currentConfig = config;
                                if(currentConfig.frequency) {
                                    frequency = currentConfig.frequency;
                                }
                                if(currentConfig.ip) {
                                    IP_ADDRESS = currentConfig.ip;
                                }
                                main();
                            }
                        }
                    } catch (error) {
                        console.error('Couldn\'t stringify Config JSON : \n', error);
                    }
                },
            'onError':
                function onGetConfigError(error) {
                    console.error('There was an error getting config from the local API: \n', error);
                }
        }
    );
}

function getIPaddress(requestCb) {
    if(currentConfig && currentConfig.macaddress) {
        const execCommand = 'nmap -sn 192.168.1.0/24 | sed \'/Host/d\' |  ' +
            'sed \'/done/d\' | sed \'/Starting/d\' | sed \'s/Nmap scan report for //g\'  ' +
            '| sed \'/^$/d\'  | sed \'N;1N;s/\\n/ /g\' | grep ' + currentConfig.macaddress.toUpperCase() +
            ' | awk {\'print $2\'}';
        exec(execCommand, function (error, stdout, stderr) {
            if (error !== null) {
                console.error('Sorry, there was an error getting camera\'s current IP address with this command: \''
                    + execCommand + '\' \n' + 'Error: ' + error);
            } else if (stderr) {
                console.error('Sorry, there was an error getting camera\'s current IP address with this command: \''
                    + execCommand + '\' \n' + 'Command line Error: ' + stderr);
            } else if(stdout) {
                IP_ADDRESS = stdout.replace('(','').replace(')','');
                console.log('Found IP = ' + IP_ADDRESS);
                requestCb();
            } else {
                console.error('Sorry, getting camera\'s current IP address with this command: \''
                    + execCommand + '\' \n' + ' didn\'t return any results.');
            }
        });
    }
}

function main() {
    var imagedataScott = 'abc';
    console.log("sending");
    sendMessage(Buffer(imagedataScott, 'binary'));
    if(currentConfig && wsMessageConnected && currentConfig.username && currentConfig.password) {
        var capturemode = currentConfig.capturemode;
        if (capturemode && capturemodeList.indexOf(capturemode) <= -1) {
            capturemode = capturemodeList[1];
        }
        if (capturemodeList.indexOf(capturemode) === 1) {
            getCameraData(capturemode);
        } else {
            setInterval(
                function getCameraPhotoWithInterval() {
                    getCameraData(capturemode);
                },
                frequency);
        }
    }
}

function getCameraData(capturemode) {
    if(!IP_ADDRESS) {
        getIPaddress(
            function AfterIPaddress() {
                makeRequestToCamera(capturemode);
            });
    } else {
        makeRequestToCamera();
    }
}

function makeRequestToCamera(capturemode) {
    var url = buildConnectionURL(capturemode);
    if(url) {
        if(capturemodeList.indexOf(capturemode) === 2) {
            openRTSPConnection(url);
        } else {
            makeHttpRequest(url);
        }
    }
}

function makeHttpRequest(url) {
    http.get(
        url,
        function(response) {
            if (response.statusCode === 200) {
                response.setEncoding('binary');
                var imagedata = '';
                response.on(
                    'data',
                    function httpGotData(data) {
                        imagedata += data;
                    }
                );
                response.on(
                    'end',
                    function httpEnd() {
                        sendMessage(Buffer(imagedata, 'binary'));
                    }
                );
            } else {
                console.log(
                    'Getting data from camera; status code: ',
                    response ?
                        response.statusCode : 'no status code'
                );
            }
        }).on(
            'error',
            function onHttpError(error) {
                IP_ADDRESS = null;
                console.error('Got an error requesting data from Camera : \n', error);
            }
        );
}

function openRTSPConnection(url) {
    console.log('Sorry, currently this container doesn\'t support RTSP. Functionality Coming soon.');
}

function sendMessage(contentData) {
    var ioMsg = ioFabricClient.ioMessage(
        {
            'tag': '',
            'groupid': '',
            'sequencenumber': 1,
            'sequencetotal': 1,
            'priority': 0,
            'authid': '',
            'authgroup': '',
            'chainposition': 0,
            'hash': '',
            'previoushash': '',
            'nonce': '',
            'difficultytarget': 0,
            'infotype': 'linksys/camera',
            'infoformat': 'binary',
            'contextdata': Buffer(0),
            'contentdata' : contentData
        }
    );
    console.log("build msg");
    if(wsMessageConnected) { 
        console.log("send msg");
        ioFabricClient.wsSendMessage(ioMsg);
    }
}

function buildConnectionURL(capturemode) {
    var url = '', relative_url = '';
    var rtsp = false;
    if(capturemodeList.indexOf(capturemode) === 0) {
        relative_url = 'img/snapshot.cgi';
    } else if (capturemodeList.indexOf(capturemode) === 1) {
        rtsp = true;
        relative_url = 'img/video.sav'; // OR media.sav (with audio);
    }
    if(currentConfig && currentConfig.username && currentConfig.password && IP_ADDRESS) {
        if(rtsp) {
            url = 'rtsp';
        } else {
            url = 'http';
        }
        url += '://' + currentConfig.username + ':' + currentConfig.password + '@' + IP_ADDRESS + '/' + relative_url;
    }
    return url;
}


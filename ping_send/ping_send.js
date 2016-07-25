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
                            console.log(config);
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

function main() {
    var imagedataScott = "26";
    console.log("sleeping");
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
            'infotype': 'ping/payload',
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

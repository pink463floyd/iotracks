var http = require('http');
var ioFabricClient = require('@iotracks/container-sdk-nodejs');

const PARSING_ERROR_MSG = 'ENCODING FAILED';
const PORT = 80;
var messageLimit = 1;
var msgsBuffer = [];
var currentConfig;

ioFabricClient.init('iofabric', 54321, null,
    function jsonRestApiMain() {
        // first thing first is to get config from ioFabric
        fetchConfig();
        ioFabricClient.wsControlConnection(
            {
                'onNewConfigSignal':
                    function onNewConfigSignal() {
                        // upon receiving signal about new config available -> go get it
                        fetchConfig();
                    },
                'onError':
                    function onControlSocketError(error) {
                        console.error('There was an error with Control WebSocket connection to ioFabric: ', error);
                    }
            }
        );
        ioFabricClient.wsMessageConnection(
            function(ioFabricClient) { /* don't need to do anything on opened Message Socket */ },
            {
                'onMessages':
                    function onMessagesSocket(messages) {
                         var imagedataScott = "26";
                         console.log("GoT message(s):len=%d", messages.length);
                         console.log(typeof messages);
                         console.log(messages);
                         sendMessage(messages);

                        //if(messages) {
                            // when getting new messages we store newest and delete oldest corresponding to configured limit
                        //    for (var i = 0; i < messages.length; i++) {
                         //       if (msgsBuffer.length > (messageLimit - 1)) {
                          //          msgsBuffer.splice(0, (msgsBuffer.length - (messageLimit - 1)));
                           //     }
                            //    msgsBuffer.push(messages[i]);
                            //}
                        //}
                    },
                'onMessageReceipt':
                    function(messageId, timestamp) { /* we received the receipt for posted msg */ },
                'onError':
                    function onMessageSocketError(error) {
                        console.log('There was an error with Message WebSocket connection to ioFabric: ', error);
                    }
            }
        );
    }
);


var server = http.createServer(
    function handleRequest(request, response) {
        var responseMsgs = [];
        if (currentConfig) {
            /**
                Checking if config contains not empty accesstoken then messages can be reached only by url with token:
                http://containerIPaddress/token/{accesstoken} otherwise it's forbidden access (403).
             **/
            if (currentConfig.accesstoken && currentConfig.accesstoken.length !== 0) {
                var url = request.url.split('/');
                if (url.length !== 3 ||
                    (url.length === 3 && url[1] === 'token' && url[2] !== currentConfig.accesstoken)) {
                    response.writeHead(403, {'Content-Type': 'application/json'});
                    response.end();
                    return;
                }
            }
            if (currentConfig.outputfields && Object.keys(currentConfig.outputfields).length) {
                var ioMsgProps = Object.keys(currentConfig.outputfields);
                for (var i = 0; i < msgsBuffer.length; i++) {
                    var responseMsg = Object.create({});
                    for (var j = 0; j < ioMsgProps.length; j++) {
                        var outputPropName = currentConfig.outputfields[ioMsgProps[j]];
                        var outputPropValue = msgsBuffer[i][ioMsgProps[j]];
                        if(ioMsgProps[j] === 'contentdata') {
                            outputPropValue = parsePropertyValue(outputPropValue, currentConfig.contentdataencoding);
                        } else if(ioMsgProps[j] === 'contextdata') {
                            outputPropValue = parsePropertyValue(outputPropValue, currentConfig.contextdataencoding);
                        }
                        responseMsg[outputPropName] = outputPropValue;
                    }
                    responseMsgs.push(responseMsg);
                }
            } else {
                responseMsgs = msgsBuffer;
            }
        }
        response.writeHead(200, {'Content-Type':'application/json'});
        response.end(JSON.stringify(responseMsgs));
    }
);

server.listen(PORT, function openPort() {
    //console.info('JSON REST API Container listening on port: ', PORT);
});

function fetchConfig() {
    console.log("fetchConfig");
    ioFabricClient.getConfig(
        {
            'onBadRequest':
                function onConfigBadRequest(errorMsg) {
                    console.error('There was an error in request for getting config from the local API: ', errorMsg);
                },
            'onNewConfig':
                function onConfig(config) {
                    try {
                        if(config) {
                            if (JSON.stringify(config) !== JSON.stringify(currentConfig)) {
                                currentConfig = config;
                                if(currentConfig.buffersize) {
                                    messageLimit = currentConfig.buffersize;
                                } else {
                                    messageLimit = 1;
                                }
                                if (msgsBuffer.length > messageLimit) {
                                    msgsBuffer.splice(0, (msgsBuffer.length - messageLimit));
                                }
                            }
                        }
                    } catch (error) {
                        console.error('Couldn\'t stringify Config JSON: ', error);
                    }
                },
            'onError':
                function onConfigError(error) {
                    console.error('There was an error getting config from the local API: ', error);
                }
        }
    );
}

function parsePropertyValue(propValue, dataEncoding) {
    var stringFormats = ['base64', 'utf8', 'ascii'];
    var integerFormat = 'integer', decimalFormat =  'decimal';
    var booleanFormat = 'boolean';
    try {
        if(propValue) {
            if (dataEncoding) {
                if (stringFormats.indexOf(dataEncoding) > -1) {
                    return propValue.toString(dataEncoding);
                }
                if (integerFormat === dataEncoding) {
                    return propValue.readUIntBE(0, propValue.length);
                }
                if (decimalFormat === dataEncoding && propValue.length === 8) {
                    return propValue.readDoubleBE();
                }
                if (booleanFormat === dataEncoding) {
                    if (propValue[0] === 0) {
                        return false;
                    } else {
                        return true;
                    }
                }
                console.warn(PARSING_ERROR_MSG + ' : Sorry, we don\'t support \'' + dataEncoding +
                    '\'  this format. Please choose among next formats: ' + stringFormats +
                    ', ' + integerFormat + ', ' + decimalFormat + 'and ' + booleanFormat);
                return PARSING_ERROR_MSG;
            } else {
                return propValue.toString('base64');
            }
        } else {
            return '';
        }
    } catch (err) {
        console.warn(PARSING_ERROR_MSG + ': ', err);
        return PARSING_ERROR_MSG;
    }
}


function sendMessage(messages) {
    var ioMsg = ioFabricClient.ioMessage(
        {
            'tag': '',
            'groupid': '',
            'sequencenumber': messages[0].sequencenumber,
            'sequencetotal': messages[0].sequencetotal,
            'priority': 0,
            'authid': '',
            'authgroup': '',
            'chainposition': 0,
            'hash': '',
            'previoushash': '',
            'nonce': '',
            'difficultytarget': 0,
            'infotype': messages[0].infotype,
            'infoformat': messages[0].infoformat,
            'contextdata': Buffer(0),
            'contentdata' : Buffer(0),       }
    );
    console.log("send msg");
    console.log(ioMsg);
    ioFabricClient.wsSendMessage(ioMsg);
}


var ioFabricClient = require('@iotracks/container-sdk-nodejs');
var request = require('request');

var frequency = 1000;
var timeout = 10000;
var httpRequestsLimit = 3;
var openHttpRequestsCounter = 0;
var currentConfig;

ioFabricClient.init('iofabric', 54321, null,
    function(){
        fetchConfig();
        ioFabricClient.wsControlConnection(
            Object.create({
                "onNewConfigSignal": function(){ fetchConfig(); },
                "onError": function(error){
                    console.log("There was an error with WebSocket connection to ioFabric: ");
                    console.log(error); }
            })
        );
    }
);

function fetchConfig() {
    console.log("fetchConfig");
    ioFabricClient.getConfig(
        Object.create({
            "onBadRequest": function(errorMsg){
                    console.log("There was an error in request for getting config from the local API: ");
                    console.log(errorMsg);
                },
            "onNewConfig": function(config) {
                console.log("onNewConfig");
                try {
                    if(config){
                        console.log(config);
                        if (JSON.stringify(config) != JSON.stringify(currentConfig)) {
                            currentConfig = config;
                            if (config.frequency && config.frequency > 1000) {
                                frequency = config.frequency;
                            }
                        }
                    }
                } catch (error){
                    console.log("Couldn't stringify Config JSON.");
                }
            },
            "onError": function(error){
                console.log("There was an error getting config from the local API: ");
                console.log(error); }
        })
    );
}

setInterval( function() {
    if(currentConfig && currentConfig.citycode && currentConfig.apikey) {
        var url = 'http://api.openweathermap.org/data/2.5/weather?id=' + currentConfig.citycode + '&APPID=' + currentConfig.apikey;
        console.log(url);
        if(openHttpRequestsCounter<=httpRequestsLimit) {
            openHttpRequestsCounter++;
            request({uri: url, method: "GET", timeout: timeout},
                function (error, response, body) {
                    console.log("Posting msg");
                    /* console.log(error); */
                    /* console.log(response); */
                    console.log(body);
                    openHttpRequestsCounter--;
                    if (!error && response.statusCode == 200) {
                        var weatherResponse = body;

                        var ioMsg = ioFabricClient.ioMessage(
                            "", "", 1, 1, 0, "", "", 0, "", "", "", 0,
                            "weather/mixed/open-weather-map", "text/json",
                            new Buffer(0), new Buffer(weatherResponse)
                        );

                        ioFabricClient.sendNewMessage(ioMsg,
                            Object.create({
                                "onBadRequest": function (errorMsg) {
                                    console.log("There was an error in request for posting new message to the local API: ");
                                    console.log(errorMsg);
                                },
                                "onMessageReceipt": function (messageId, timestamp) {
                                    console.log("Message was posted successfully: ID = " + messageId + ' and time ' + new Date(timestamp));
                                },
                                "onError": function (error) {
                                    console.log("There was an error posting OpenWeatherMap new message to local API: ");
                                    console.log(error);
                                }
                            })
                        );
                    } else {
                        console.log("Got an error requesting data from OpenWeatherMap : ", error, ", status code: ", response.statusCode);
                    }
                }
            );
        } else {
            console.log("Sorry, the limit of open HTTP requests is exceeded.");
        }
    }
}, frequency);


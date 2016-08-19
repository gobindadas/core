/*
 Copyright [2016] [Relevance Lab]

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */
var mongo = require('mongoskin');
var logger = require('tracer');
var appConfig = require('_pr/config');
var uuid = require('node-uuid');
var Client = require('node-rest-client').Client;
var CatLogger = function() {
    var db = mongo.db("mongodb://" + appConfig.db.host + ":" + appConfig.db.port + "/" + appConfig.db.dbName);

    var log_conf = {
        transport: function(data) {
            console.log(data.output);
            /*var elkIndexVal = "catalyst-index";
            var elkType = "applog";
            var elkData = {
                "@timestamp": new Date(),
                "count": 1,
                "fields": null,
                "input_type": "log",
                "message": data.message,
                "offset": Math.floor((Math.random() * 10000) + 10),
                "source": data.path,
                "type": data.title
            };

            var client = new Client();
            var elkUrl = "http://localhost:9200/" + elkIndexVal + "/" + elkType + "/";
            // set content-type header and data as json in args parameter 
            var args = {
                data: elkData,
                headers: { "Content-Type": "application/json" }
            };

            var req = client.post(elkUrl, args, function(resData, response) {
                
            });
            req.on('requestTimeout', function(req) {
                console.log('request has expired');
                req.abort();
            });

            req.on('responseTimeout', function(res) {
                console.log('response has expired');

            });
            req.on('error', function(err) {
                console.log('request error', err);
            });*/

            // registering remote methods 
            /*client.registerMethod("postMethod", elkUrl, "POST");

            client.methods.postMethod(args, function(resData, response) {
                // parsed response body as js object 
                console.log(resData);
                // raw response 
                console.log(response);
            });*/

            var loginfo = db.collection("CatalystLog");
            loginfo.insert(data, function(err, log) {
                if (err) {
                    console.error(err);
                }
            });
        }
    }

    return logger.console(log_conf);
};

function create_logger(calling_module) {
    return new CatLogger();
}; // end create_logger

module.exports = create_logger;

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
var CatLogger = function() {
    var db = mongo.db("mongodb://" + appConfig.db.host + ":" + appConfig.db.port + "/" + appConfig.db.dbName);

    var log_conf = {
        transport: function(data) {
            console.log(data.output);
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

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

// This script will clean up appdeploy related all data from DB.

var logger = require('_pr/logger')(module);
var mongoDbConnect = require('_pr/lib/mongodb');
var appConfig = require('_pr/config');
var AppDeploy = require('_pr/model/app-deploy/app-deploy');
var AppData = require('_pr/model/app-deploy/app-data');
var d4dModel = require('_pr/model/d4dmasters/d4dmastersmodel.js');
var d4dModelNew = require('_pr/model/d4dmasters/d4dmastersmodelnew.js');
var AWSProvider = require('_pr/model/classes/masters/cloudprovider/awsCloudProvider.js');

var dboptions = {
    host: appConfig.db.host,
    port: appConfig.db.port,
    dbName: appConfig.db.dbName
};
mongoDbConnect(dboptions, function(err) {
    if (err) {
        logger.error("Unable to connect to mongo db >>" + err);
        process.exit();
    } else {
        logger.debug('connected to mongodb - host = %s, port = %s, database = %s', dboptions.host, dboptions.port, dboptions.dbName);
    }
});
//Update appdeploy with applicationLastDeploy as timestamp
AppDeploy.getAppDeploy(function(err, deployedData) {
    if (err) {
        logger.error("Error while fetching appdeploy: ", err);
        process.exit();
    }
    if (deployedData && deployedData.length) {
        for (var k = 0; k < deployedData.length; k++) {
            deployedData[k]['applicationLastDeploy'] = Date.parse(deployedData[k].applicationLastDeploy);
            AppDeploy.updateAppDeploy(deployedData[k]._id, deployedData[k], function(err, updatedData) {
                if (err) {
                    logger.error("Error while updateing appdeploy: ", err);
                    process.exit();
                }
                logger.debug("Appdeploy updated successfully.. ", JSON.stringify(updatedData));
            });
        }
    }
});

//Update AWS Provider with s3BucketName.
AWSProvider.getAWSProviders(function(err, providers) {
    if (err) {
        logger.error("Got error while fetching AWS-Provider: ", err);
        process.exit();
    }
    logger.debug("Got Provider list: ");
    if (providers && providers.length) {
        for (var p = 0; p < providers.length; p++) {
            providers[p]['s3BucketName'] = "RLBilling";
            AWSProvider.updateAWSProviderById(providers[p]._id, providers[p], function(err, updatedProvider) {
                if (err) {
                    logger.error("Failed to update AWSProvider: ", err);
                    process.exit();
                }
            });
        }
    } else {
        logger.debug("No AWSProvider configured.");
    }
});

//Update AppData with nexus or docker
AppData.getAll(function(err, appDatas) {
    if (err) {
        logger.debug("Error while get appdata: ", err);
        process.exit();
    }
    logger.debug("AppData got successfully..");
    if (appDatas && appDatas.length) {
        var nexusId;
        var dockerId;
        d4dModelNew.d4dModelMastersNexusServer.find(function(err, nexusData) {
            if (err) {
                logger.debug("Error while get nexusConfig: ", err);
                process.exit();
            }
            if (nexusData && nexusData.length) {
                nexusId = nexusData[0].rowid;
            }
            d4dModelNew.d4dModelMastersDockerConfig.find(function(err, dockerData) {
                if (err) {
                    logger.debug("Error while get dockerConfig: ", err);
                    process.exit();
                }
                if (dockerData && dockerData.length) {
                    dockerId = nexusData[0].rowid;
                }

                for (var i = 0; i < appDatas.length; i++) {
                    appDatas[i]['envName'] = appDatas[i].envId;
                    if (appDatas[i].nexus && appDatas[i].nexus.repoURL) {
                        var repo = appDatas[i].nexus.repoURL.split("repositories/")[1].split("/")[0];
                        var groupArray = appDatas[i].nexus.repoURL.split("content/")[1].split("/" + appDatas[i].version)[0].split("/");
                        groupArray = delete groupArray[groupArray.length - 1];
                        var groupId = "";
                        if (groupArray && groupArray.length) {
                            for (var j = 0; j < groupArray.length; j++) {
                                if (groupId) {
                                    groupId = groupId + "." + groupArray[j];
                                } else {
                                    groupId = groupArray[j];
                                }
                            }
                        }

                        var nexusObj = {
                            rowId: nexusId,
                            repoURL: appDatas[i].nexus.repoURL,
                            repository: repo,
                            groupId: groupId,
                            nodeIds: "",
                            artifactId: appDatas[i].appName,
                            taskId: ""
                        };
                        appDatas[i].nexus = nexusObj;
                        setTimeout(function() {
                            AppData.update(appDatas[i]._id, appDatas[i], function(err, updatedData) {
                                if (err) {
                                    logger.debug("Error while update appdata: ", err);
                                }
                                logger.debug("AppData updated successfully.: ", JSON.stringify(updatedData));
                            });
                        }, 10);
                    } else if (appDatas[i].docker && appDatas[i].docker.length) {
                        var dockerObj = {
                            rowId: dockerId,
                            image: appDatas[i].docker[0].image,
                            containerName: appDatas[i].docker[0].containerName,
                            containerPort: appDatas[i].docker[0].containerPort,
                            hostPort: appDatas[i].docker[0].hostPort,
                            dockerUser: appDatas[i].docker[0].dockerUser,
                            dockerPassword: appDatas[i].docker[0].dockerPassword,
                            dockerEmailId: appDatas[i].docker[0].dockerEmailId,
                            imageTag: appDatas[i].docker[0].imageTag,
                            nodeIds: "",
                            taskId: ""
                        }
                        appDatas[i].docker = dockerObj;
                        AppData.update(appDatas[i]._id, appDatas[i], function(err, updatedData) {
                            if (err) {
                                logger.debug("Error while update appdata: ", err);
                            }
                            logger.debug("AppData updated successfully.: ", JSON.stringify(updatedData));
                        });
                    }
                }
                logger.debug("Appdata updated successfully..");
                process.exit();
            });
        });
    }
});

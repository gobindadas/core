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
var logger = require('_pr/logger')(module);
var CatalystCronJob = require('_pr/cronjobs/CatalystCronJob');
var AWSProvider = require('_pr/model/classes/masters/cloudprovider/awsCloudProvider.js');
var MasterUtils = require('_pr/lib/utils/masterUtil.js');

var AggregateAWSCost = Object.create(CatalystCronJob);
AggregateAWSCost.interval = '*/30 * * * *';
AggregateAWSCost.execute = aggregateAWSCost;

module.exports = AggregateAWSCost;

function aggregateAWSCost() {
    MasterUtils.getAllActiveOrg(function(err, orgs) {
        if(err) {
            logger.error(err);
        } else {
            aggregateAWSCostForProvidersOfOrg.apply(aggregateAWSCostForProvidersOfOrg, orgs);
        }
    });
}

function aggregateAWSCostForProvidersOfOrg(org) {
    AWSProvider.getAWSProvidersByOrgId(org._id, function(err, providers) {
        if(err) {
            logger.error(err);
        } else {
            aggregateAWSCostForProvider.apply(aggregateAWSCostForProvider, providers);
        }
    });
}

function aggregateAWSCostForProvider(provider) {
   console.log("Provider>>>>>>>>>>>>>"+provider);
}








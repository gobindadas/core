/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(angular) {
	'use strict';
	angular.module('workzone.orchestration', ['rl.ui.component.library', 'filter.currentTime', 'ui.bootstrap', 'apis.workzone', 'ModalService', 'utility.array', 'workzonePermission', 'chefDataFormatter', 'utility.pagination'])
		.controller('orchestrationCtrl', ['$scope', '$rootScope', '$modal', 'workzoneServices', 'confirmbox', 'arrayUtil', 'orchestrationPermission', 'workzoneUIUtils', 'paginationUtil', '$timeout','uiGridOptionsService', function($scope, $rootScope, $modal, workzoneServices, confirmbox, arrayUtil, orchestrationPerms, workzoneUIUtils, paginationUtil, $timeout, uiGridOptionsService) {
			var _permSet = {
				createTask: orchestrationPerms.createTask(),
				editTask: orchestrationPerms.editTask(),
				deleteTask: orchestrationPerms.deleteTask()
			};
			$scope.perms = _permSet;
			$scope.isOrchestrationPageLoading = true;
			var gridBottomSpace = 60;
			var orchestrationUIGridDefaults = uiGridOptionsService.options();
			$scope.paginationParams = orchestrationUIGridDefaults.pagination;
			$scope.tabData = [];
			
			$scope.initGrids = function(){
				$scope.orcheGridOptions=angular.extend(orchestrationUIGridDefaults.gridOption,{
					data : 'tabData',
					columnDefs : [
						{ name:'Job Type', field:'taskType' ,cellTemplate:'<img src="images/orchestration/jenkins.png" ng-show="row.entity.taskType==\'jenkins\'" alt="row.entity.taskType" class="jenkins-img" />'+
						'<img src="images/orchestration/chef.png" ng-show="row.entity.taskType==\'chef\'" alt="row.entity.taskType" class="jenkins-img" />'+
						'<img src="images/orchestration/composite.jpg" ng-show="row.entity.taskType==\'composite\'" alt="{{row.entity.taskType}}" class="jenkins-img" />'+
						'<img src="images/global/puppet.png" ng-show="row.entity.taskType==\'puppet\' " alt="{{row.entity.taskType}}" class="jenkins-img">',cellTooltip: true},
						{ name:'Name',field:'name',cellTooltip: true},
						{ name:'Job Description',field:'description',cellTooltip: true},
						{ name:'Job Links', enableSorting: false , cellTemplate:'<div>'+
						'<span ng-show="row.entity.taskType===\'chef\'">'+
						'<span title="View Nodes" class="fa fa-sitemap chef-view-nodes cursor" ng-click="grid.appScope.viewNodes(row.entity);"></span>'+
						'<span title="Assign Nodes" class="fa fa-list-ul chef-assign-nodes cursor" ng-click="grid.appScope.assignedRunList(row.entity);"></span>'+
						'</span>'+
						'<span ng-show="row.entity.taskType===\'jenkins\'">'+
						'<a target="_blank" title="Jenkins" ng-href="{{row.entity.taskConfig.jobURL}}">'+
						'<img class="chefImage-size" src="images/orchestration/joburl.jpg" /> </a>'+
						'</span>'+
						'<span ng-show="row.entity.taskType===\'composite\'"> NA </span>'+
						'<span ng-show="row.entity.taskType==\'puppet\'">'+
						'<span title="View Nodes" class="fa fa-sitemap chef-view-nodes cursor" ng-click="grid.appScope.viewNodes(row.entity);"></span>'+
						'</span>'+
						'</div>' ,cellTooltip: true},
						{ name:'Execute', enableSorting: false , cellTemplate:'<span title="Execute" class="fa fa-play btn cat-btn-update btn-sg tableactionbutton" ng-click="grid.appScope.execute(row.entity)"></span>', cellTooltip: true},
						{ name:'History', enableSorting: false , cellTemplate:'<span title="History" class="fa fa-header btn cat-btn-update btn-sg tableactionbutton" ng-click="grid.appScope.getHistory(row.entity)"></span>', cellTooltip: true},
						{ name:'Last Run', cellTemplate:'<span>{{row.entity.lastRunTimestamp  | timestampToCurrentTime}}</span>', cellTooltip: true},
						{ name:'Action', enableSorting: false , cellTemplate:'<span title="Edit" class="fa fa-pencil btn btn-info pull-left tableactionbutton btnEditTask btn-sg white marginleft30" ng-click="grid.appScope.createNewTask(row.entity)" ng-show="grid.appScope.perms.editTask;"></span>'+
						'<span  title="Delete" class="fa fa-trash-o btn btn-danger pull-left btn-sg tableactionbutton btnDeleteTask white marginleft10" ng-click="grid.appScope.deleteTask(row.entity)" ng-show="grid.appScope.perms.deleteTask;"></span>', cellTooltip: true}
					],
				});
			};
			/*APIs registered are triggered as ui-grid is configured 
			for server side(external) pagination.*/
			$scope.orcheGridOptions = angular.extend(orchestrationUIGridDefaults.gridOption, {
				onRegisterApi :function(gridApi) {

					$scope.gridApi = gridApi;
					gridApi.core.on.sortChanged($scope, function(grid, sortColumns) {
						if (sortColumns[0] && sortColumns[0].field && sortColumns[0].sort && sortColumns[0].sort.direction) {
							$scope.paginationParams.sortBy = sortColumns[0].field;
							$scope.paginationParams.sortOrder = sortColumns[0].sort.direction;
							$scope.taskListGridView();
						}
					});
					//Pagination for page and pageSize
					gridApi.pagination.on.paginationChanged($scope, function(newPage, pageSize) {
						$scope.paginationParams.page = newPage;
						$scope.paginationParams.pageSize = pageSize;
						$scope.taskListGridView();
					});
				},
			});
				
			var helper = {
				orchestrationLogModal: function(id,historyId,taskType) {
					$modal.open({
						animation: true,
						templateUrl: 'src/partials/sections/dashboard/workzone/orchestration/popups/orchestrationLog.html',
						controller: 'orchestrationLogCtrl as orchLogCtrl',
						backdrop: 'static',
						keyboard: false,
						resolve: {
							items: function() {
								return {
									taskId: id,
									historyId: historyId,
									taskType: taskType
								};
							}
						}
					});
				},
				setPaginationDefaults: function() {
					$scope.paginationParams.sortBy = 'taskCreateOn';
					$scope.paginationParams.sortOrder = 'desc';
				}
			};
			
			angular.extend($scope, {
				taskListGridView: function() {
					$scope.isOrchestrationPageLoading = true;
					// service to get the list of tasks
					workzoneServices.getPaginatedTasks($scope.envParams, $scope.paginationParams).then(function(result) {
						$timeout(function() {
							$scope.orcheGridOptions.totalItems = result.data.metaData.totalRecords;
							$scope.tabData = result.data.tasks;
						}, 100);
						$scope.isOrchestrationPageLoading = false;
					}, function(error) {
						$scope.isOrchestrationPageLoading = false;
						console.log(error);
						$scope.errorMessage = "No Records found";
					});

				},
				execute: function(task) {
					if (task.taskConfig.parameterized && task.taskConfig.parameterized.length) {
						$modal.open({
							animation: true,
							templateUrl: 'src/partials/sections/dashboard/workzone/orchestration/popups/runParamConfig.html',
							controller: 'runParamConfigCtrl',
							backdrop: 'static',
							keyboard: false,
							resolve: {
								items: function() {
									return angular.extend([], task.taskConfig.parameterized);
								}
							}
						}).result.then(function(selectedItems) {
							var choiceParam = {};
							var p = selectedItems;
							for (var i = 0; i < p.length; i++) {
								choiceParam[p[i].name] = p[i].defaultValue[0];
							}
							workzoneServices.runTask(task._id, {
								"choiceParam": choiceParam
							}).then(function(response) {
								helper.orchestrationLogModal(task._id, response.data.historyId, task.taskType);
								$rootScope.$emit('WZ_REFRESH_ENV');
							});
						}, function() {
							console.log("Dismiss at " + new Date());
						});
					} else {
						//This includes chef,composite and puppet
						var modalOptions = {
							closeButtonText: 'Cancel',
							actionButtonText: 'Ok',
							actionButtonStyle: 'cat-btn-update',
							headerText: 'Confirmation',
							bodyText: 'Are you sure you want to execute this Job?'
						};
							confirmbox.showModal({}, modalOptions).then(function() {
								workzoneServices.runTask(task._id).then(function(response) {
									helper.orchestrationLogModal(task._id,response.data.historyId,task.taskType);
								});
								$rootScope.$emit('WZ_REFRESH_ENV');
							}, function(response) {
								console.log('error:: ' + response.toString());
							});
						}
					},
				getHistory: function(task) {
					$modal.open({
						templateUrl: 'src/partials/sections/dashboard/workzone/orchestration/popups/orchestrationHistory.html',
						controller: 'orchestrationHistoryCtrl',
						backdrop: 'static',
						keyboard: false,
						size: 'lg',
						resolve: {
							items: function() {
								return task;
							}
						}
					}).result.then(function(selectedItem) {
						$scope.selected = selectedItem;
					}, function() {

					});
				},
				deleteTask: function(orchestrationObj) {
					var modalOptions = {
						closeButtonText: 'Cancel',
						actionButtonText: 'Delete',
						actionButtonStyle: 'cat-btn-delete',
						headerText: 'Delete Task',
						bodyText: 'Are you sure you want to delete this task?'
					};
					confirmbox.showModal({}, modalOptions).then(function() {
						workzoneServices.deleteTask(orchestrationObj._id).then(function(response) {
							if (response.data.deleteCount.ok) {
								$scope.taskListGridView();
							}
						}, function(data) {
							alert('error:: ' + data.toString());
						});
					});
				},
				viewNodes: function(orchestrationObj) {
					$modal.open({
						animation: true,
						templateUrl: 'src/partials/sections/dashboard/workzone/orchestration/popups/viewNodes.html',
						controller: 'viewNodesCtrl',
						backdrop: 'static',
						keyboard: false,
						resolve: {
							items: function() {
								return orchestrationObj;
							}
						}
					}).result.then(function(selectedItem) {
						$scope.selected = selectedItem;
					}, function() {

					});
				},
				assignedRunList: function(orchestrationObj) {
					$modal.open({
						animation: true,
						templateUrl: 'src/partials/sections/dashboard/workzone/orchestration/popups/assignNodes.html',
						controller: 'assignNodesCtrl',
						backdrop: 'static',
						keyboard: false,
						resolve: {
							items: function() {
								return orchestrationObj;
							}
						}
					}).result.then(function(selectedItem) {
						$scope.selected = selectedItem;
					}, function() {

					});
				},
				createNewTask: function(type) {
					$modal.open({
						animation: true,
						templateUrl: 'src/partials/sections/dashboard/workzone/orchestration/popups/newTask.html',
						controller: 'newTaskCtrl',
						backdrop: 'static',
						keyboard: false,
						size: 'lg',
						resolve: {
							items: function() {
								return type;
							}
						}
					}).result.then(function(taskData) {
						console.log(taskData);
						if (type === 'new') {
							$rootScope.globalSuccessMessage = 'New Job ' + taskData.name + ' created successfully';
							$scope.setLastPageView();
						} else {
							$rootScope.globalSuccessMessage = taskData.name + ' has been updated successfully';
							$scope.taskListGridView();
						}
						$('#globalSuccessMessage').animate({
							top: '0'
						}, 1000);
						setTimeout(function() {
							$('#globalSuccessMessage').animate({
								top: '-70px'
							}, 500);
						}, 5000);
					}, function() {});
				}
			});
			/*method being called to set the first page view*/
			$scope.setFirstPageView = function(){
				$scope.orcheGridOptions.paginationCurrentPage = $scope.paginationParams.page = 1;
			};
			/*method being called to set the last page view when a new task is created*/
			$scope.setLastPageView = function(){
				/*$scope.orcheGridOptions.totalItems needs to be updated when a new entry is created.*/
				$scope.orcheGridOptions.totalItems = $scope.orcheGridOptions.totalItems + 1;
				var lastPage = (Math.ceil(($scope.orcheGridOptions.totalItems)/$scope.paginationParams.pageSize));
				//Set sortBy and sortField to controller defaults;
				helper.setPaginationDefaults();
				$scope.orcheGridOptions.paginationCurrentPage = $scope.paginationParams.page = lastPage;				
				$scope.taskListGridView();
			};
			$rootScope.$on("CREATE_NEW_JOB", function(){
				$scope.createNewTask('new');
			});
			$rootScope.$on('WZ_ENV_CHANGE_START', function(event, requestParams) {
				$scope.isOrchestrationPageLoading = true;
				$scope.envParams=requestParams;
				$scope.initGrids();
				$scope.setFirstPageView();
				$scope.taskListGridView();
				$scope.gridHeight = workzoneUIUtils.makeTabScrollable('orchestrationPage')-gridBottomSpace;
				workzoneUIUtils.makeTabScrollable('orchestrationPage');
			});
			$rootScope.$on('WZ_TAB_VISIT', function(event, tabName){
				if(tabName === 'Orchestration'){
					$scope.isOrchestrationPageLoading = true;
					var tableData = $scope.tabData;
					$scope.tabData = [];
					$timeout(function(){
						$scope.tabData = tableData;
						$scope.isOrchestrationPageLoading = false;
					}, 100);
				}
			});
		}]);
})(angular);
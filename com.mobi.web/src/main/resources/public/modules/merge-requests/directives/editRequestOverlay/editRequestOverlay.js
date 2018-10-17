/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name editRequestOverlay
         *
         * @description
         * The `editRequestOverlay` module only provides the `editRequestOverlay` directive which creates content
         * for a modal to edit a merge request.
         */
        .module('editRequestOverlay', [])
        /**
         * @ngdoc directive
         * @name editRequestOverlay.directive:editRequestOverlay
         * @scope
         * @restrict E
         * @requires mergeRequestManager.service:mergeRequestManagerService
         * @requires mergeRequestState.service:mergeRequestStateService
         * @requires util.service:utilService
         * @requires prefixes.service:prefixes
         *
         * @description
         * `editRequestOverlay` is a directive that creates content for a modal that edits a merge request on the
         * {@link mergeRequestsState.service:mergeRequestsStateSvc selected entity}. The form in the modal contains a
         * 
         * Meant to be used in conjunction with the {@link modalService.directive:modalService}.
         *
         * @param {Function} close A function that closes the modal
         * @param {Function} dismiss A function that dismisses the modal
         */
        .directive('editRequestOverlay', editRequestOverlay);

        editRequestOverlay.$inject = ['mergeRequestsStateService', 'mergeRequestManagerService', 'catalogManagerService', 'userManagerService', 'utilService', 'prefixes'];

        function editRequestOverlay(mergeRequestsStateService, mergeRequestManagerService, catalogManagerService, userManagerService, utilService, prefixes) {
            return {
                restrict: 'E',
                templateUrl: 'modules/merge-requests/directives/editRequestOverlay/editRequestOverlay.html',
                scope: {
                    close: '&',
                    dismiss: '&'
                },
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var cm = catalogManagerService;
                    var catalogId = _.get(cm.localCatalog, '@id');
    
                    var dvm = this;
                    dvm.mm = mergeRequestManagerService;
                    dvm.state = mergeRequestsStateService;
                    dvm.um = userManagerService;
                    dvm.util = utilService;
                    dvm.prefixes = prefixes;
                    dvm.branches = [];

                    dvm.submit = function() {
                        var jsonld = dvm.getMergeRequestJson();
                                                
                        dvm.mm.updateRequest(jsonld['@id'], jsonld)
                            .then(iri => {
                                dvm.util.createSuccessToast('Successfully updated request: ' + iri);
                                dvm.state.selected = dvm.state.getRequestObj(jsonld);
                                dvm.state.setRequestDetails(dvm.state.selected);
                                dvm.cancel();
                            }, dvm.util.createErrorToast);
                    }
                    dvm.cancel = function() {
                        $scope.dismiss();
                    }
                    dvm.initRequestConfig = function() {
                        dvm.state.requestConfig.recordId = dvm.state.selected.recordIri;
                        dvm.state.requestConfig.title = dvm.state.selected.title;
                        dvm.state.requestConfig.description = dvm.util.getDctermsValue(dvm.state.selected.jsonld, 'description');
                        dvm.state.requestConfig.sourceBranchId = dvm.state.selected.sourceBranch['@id'];
                        dvm.state.requestConfig.targetBranchId = dvm.state.selected.targetBranch['@id'];
                        dvm.state.requestConfig.sourceBranch = angular.copy(dvm.state.selected.sourceBranch);
                        dvm.state.requestConfig.targetBranch = angular.copy(dvm.state.selected.targetBranch);
                        dvm.state.requestConfig.difference = angular.copy(dvm.state.selected.difference);
                        dvm.state.requestConfig.assignees = [];

                        _.forEach(dvm.state.selected.jsonld[prefixes.mergereq + 'assignee'], function(user) {
                            dvm.state.requestConfig.assignees.push(user['@id']);
                        })
                    }
                    dvm.getMergeRequestJson = function() {
                        var jsonld = angular.copy(dvm.state.selected.jsonld)
                        
                        jsonld[prefixes.dcterms + "title"][0]['@value'] = dvm.state.requestConfig.title;
                        jsonld[prefixes.dcterms + "description"][0]['@value'] = dvm.state.requestConfig.description;
                        jsonld[prefixes.mergereq + "targetBranch"] = [{'@id': dvm.state.requestConfig.targetBranch['@id']}];
                        jsonld[prefixes.mergereq + "assignee"] = [];
                        
                        _.forEach(dvm.state.requestConfig.assignees, function(user) {
                            jsonld[prefixes.mergereq + "assignee"].push({'@id': user });
                        })
                        
                        return jsonld;
                    }
                    dvm.updateDifference = function() {
                        cm.getDifference(dvm.util.getPropertyId(dvm.state.requestConfig.sourceBranch, dvm.prefixes.catalog + 'head'), dvm.util.getPropertyId(dvm.state.requestConfig.targetBranch, dvm.prefixes.catalog + 'head'))
                            .then(diff => {
                                dvm.state.requestConfig.difference = diff;
                                dvm.state.selected.difference = angular.copy(diff);
                            }, errorMessage => {
                                dvm.util.createErrorToast(errorMessage);
                                dvm.state.requestConfig.difference = undefined;
                            });
                    }

                    dvm.initRequestConfig();
                    
                    cm.getRecordBranches(dvm.state.requestConfig.recordId, catalogId)
                        .then(response => dvm.branches = response.data, error => {
                            dvm.util.createErrorToast(error);
                            dvm.branches = [];
                        });
                }]
            }
        }
})();

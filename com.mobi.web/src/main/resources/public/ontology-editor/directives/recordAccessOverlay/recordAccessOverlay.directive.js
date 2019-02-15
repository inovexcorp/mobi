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
         * @name recordAccessOverlay
         * @description
         * The `recordAccessOverlay` module only provides the `recordAccessOverlay` directive which which creates
         * an overlay that retrieves a record policy and supplies the policy information to the `userAccessControls`
         * overlay. The `recordAccessOverlay` controls saving any changes of a record policy access control.
         */
        .module('recordAccessOverlay', [])
        .config(ignoreUnhandledRejectionsConfig)
        /**
         * @ngdoc directive
         * @name recordAccessOverlay.directive:recordAccessOverlay
         * @scope
         * @restrict E
         * @requires util.service:utilService
         * @requires userManager.service:userManagerService
         * @requires recordPermissionsManager.service:recordPermissionsManagerService
         *
         * @description
         * `recordAccessOverlay` is a directive that creates a form to contain a `userAccessControls` module that will
         * control the access controls for a record policy. The directive is replaced by the contents of its template.
         */
        .directive('recordAccessOverlay', recordAccessOverlay);

        recordAccessOverlay.$inject = ['utilService', 'userManagerService', 'recordPermissionsManagerService']

        function recordAccessOverlay(utilService, userManagerService, recordPermissionsManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                scope: {
                    resolve: '<',
                    close: '&',
                    dismiss: '&'
                },
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    var util = utilService;
                    var um = userManagerService;
                    var rp = recordPermissionsManagerService;

                    dvm.policy = '';
                    dvm.ruleTitle = '';

                    dvm.getPolicy = function(recordId) {
                        rp.getRecordPolicy(recordId)
                            .then(result => {
                                dvm.policy = {
                                        policy: result,
                                        id: recordId,
                                        changed: false,
                                        everyone: false,
                                        users: [],
                                        groups: [],
                                        selectedUsers: [],
                                        selectedGroups: [],
                                        userSearchText: '',
                                        groupSearchText: '',
                                        selectedUser: undefined,
                                        selectedGroup: undefined
                                    };
                                setInfo(dvm.policy);
                            }, util.createErrorToast);
                    }
                    function setInfo(item) {
                        var ruleInfo = item.policy[$scope.resolve.ruleId];
                        if (ruleInfo.everyone) {
                            item.everyone = true;
                        } else {
                            item.selectedUsers = sortUsers(_.chain(ruleInfo.users)
                                .map(obj => _.find(um.users, {iri: obj}))
                                .reject(_.isNull)
                                .value());
                            item.selectedGroups = sortGroups(_.chain(ruleInfo.groups)
                                .map(obj => _.find(um.groups, {iri: obj}))
                                .reject(_.isNull)
                                .value());
                        }
                        item.users = sortUsers(_.difference(um.users, item.selectedUsers));
                        item.groups = sortGroups(_.difference(um.groups, item.selectedGroups));
                    }
                    dvm.cancel = function() {
                        $scope.dismiss();
                    }
                    dvm.save = function(recordId) {
                        if (dvm.policy.changed) {
                            dvm.policy.policy[$scope.resolve.ruleId] = {
                                everyone: dvm.policy.everyone,
                                users: _.map(dvm.policy.selectedUsers, user => user.iri),
                                groups: _.map(dvm.policy.selectedGroups, user => user.iri),
                            }
                            rp.updateRecordPolicy(recordId, dvm.policy.policy)
                                .then(() => {
                                    $scope.close();
                                    dvm.policy.changed = false;
                                    util.createSuccessToast('Permissions updated')
                                }, utilService.createErrorToast);
                        } else {
                            $scope.close();
                        }
                    }

                    function sortUsers(users) {
                        return _.sortBy(users, 'username');
                    }
                    function sortGroups(groups) {
                        return _.sortBy(groups, 'title');
                    }
                    function getRuleTitle() {
                        switch ($scope.resolve.ruleId) {
                            case 'urn:read':
                                dvm.ruleTitle = "View Record";
                                break;
                            case 'urn:delete':
                                dvm.ruleTitle = "Delete Record";
                                break;
                            case 'urn:update':
                                dvm.ruleTitle = "Manage Record"
                                break;
                            case 'urn:modify':
                                dvm.ruleTitle = 'Modify Record';
                                break;
                            case 'urn:modifyMaster':
                                dvm.ruleTitle = 'Modify Master Branch';
                                break;
                        }
                    }

                    dvm.getPolicy($scope.resolve.resource);
                    getRuleTitle();
                }],
                templateUrl: 'ontology-editor/directives/recordAccessOverlay/recordAccessOverlay.directive.html'
            }
        }
})();

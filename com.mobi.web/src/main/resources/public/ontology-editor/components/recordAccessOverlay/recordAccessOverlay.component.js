/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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

    /**
     * @ngdoc component
     * @name recordAccessOverlay.component:recordAccessOverlay
     * @requires shared.service:utilService
     * @requires shared.service:userManagerService
     * @requires shared.service:recordPermissionsManagerService
     *
     * @description
     * `recordAccessOverlay` is a component that creates a form to contain a `userAccessControls` module that will
     * control the access controls for a record policy.
     */
    const recordAccessOverlayComponent = {
        templateUrl: 'ontology-editor/components/recordAccessOverlay/recordAccessOverlay.component.html',
        bindings: {
            resolve: '<',
            close: '&',
            dismiss: '&'
        },
        controllerAs: 'dvm',
        controller: recordAccessOverlayComponentCtrl
    };

    recordAccessOverlayComponentCtrl.$inject = ['utilService', 'userManagerService', 'recordPermissionsManagerService']

    function recordAccessOverlayComponentCtrl(utilService, userManagerService, recordPermissionsManagerService) {
        var dvm = this;
        var util = utilService;
        var um = userManagerService;
        var rp = recordPermissionsManagerService;

        dvm.policy = '';
        dvm.ruleTitle = '';

        dvm.$onInit = function() {
            dvm.getPolicy(dvm.resolve.resource);
            getRuleTitle();
        }
        dvm.updatePolicy = function(item) {
            dvm.policy = item;
            dvm.policy.changed = true;
        }
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
            var ruleInfo = item.policy[dvm.resolve.ruleId];
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
            dvm.dismiss();
        }
        dvm.save = function(recordId) {
            if (dvm.policy.changed) {
                dvm.policy.policy[dvm.resolve.ruleId] = {
                    everyone: dvm.policy.everyone,
                    users: _.map(dvm.policy.selectedUsers, user => user.iri),
                    groups: _.map(dvm.policy.selectedGroups, user => user.iri),
                }
                rp.updateRecordPolicy(recordId, dvm.policy.policy)
                    .then(() => {
                        dvm.close();
                        dvm.policy.changed = false;
                        util.createSuccessToast('Permissions updated')
                    }, utilService.createErrorToast);
            } else {
                dvm.close();
            }
        }

        function sortUsers(users) {
            return _.sortBy(users, 'username');
        }
        function sortGroups(groups) {
            return _.sortBy(groups, 'title');
        }
        function getRuleTitle() {
            switch (dvm.resolve.ruleId) {
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
    }

    angular.module('ontology-editor')
        .component('recordAccessOverlay', recordAccessOverlayComponent);
})();

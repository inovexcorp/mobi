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
         *
         * @description
         * TODO
         */
        .module('recordAccessOverlay', [])
        /** TODO
         */
        .directive('recordAccessOverlay', recordAccessOverlay);

        recordAccessOverlay.$inject = ['utilService', 'userManagerService', 'policyManagerService']

        function recordAccessOverlay(utilService, userManagerService, policyManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {

                },
                bindToController: {
                    overlayFlag: '=',
                    resource: '='
                },
                controller: function() {
                    var dvm = this;
                    dvm.util = utilService;
                    dvm.um = userManagerService;
                    dvm.pm = policyManagerService;

                    var policy = '';

                    dvm.getPolicy = function() {
                        // var action;

                        // switch (dvm.action) {
                        //     case 'Read':
                        //         action = pm.actionRead;
                        //         break;
                        //     case 'Update':
                        //         action = pm.actionUpdate;
                        //         break;
                        //     case ''
                        // }
                        pm.getPolicies(dvm.resource)
                            .then(result => {
                                policy = _.chain(result)
                                    .map(policy => ({
                                        policy,
                                        id: policy.PolicyId,
                                        type: getRecordType(policy),
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
                                    }))
                                    .filter('type')
                                    .forEach(setInfo)
                                    .value();
                            }, util.createErrorToast);
                    }

                    function setInfo(item) {
                        var matches = _.chain(item.policy)
                            .get('Rule[0].Target.AnyOf[0].AllOf', [])
                            .map('Match[0]')
                            .map(match => ({
                                id: _.get(match, 'AttributeDesignator.AttributeId'),
                                value: _.get(match, 'AttributeValue.content[0]')
                            }))
                            .value();
                        if (_.find(matches, {id: prefixes.user + 'hasUserRole', value: userRole})) {
                            item.everyone = true;
                        } else {
                            item.selectedUsers = sortUsers(_.chain(matches)
                                .filter({id: pm.subjectId})
                                .map(obj => _.find(um.users, {iri: obj.value}))
                                .reject(_.isNull)
                                .value());
                            item.selectedGroups = sortGroups(_.chain(matches)
                                .filter({id: groupAttributeId})
                                .map(obj => _.find(um.groups, {iri: obj.value}))
                                .reject(_.isNull)
                                .value());
                        }
                        item.users = sortUsers(_.difference(um.users, item.selectedUsers));
                        item.groups = sortGroups(_.difference(um.groups, item.selectedGroups));
                    }

                    function getRecordType(policy) {
                        return _.chain(policy)
                            .get('Target.AnyOf', [])
                            .map('AllOf').flatten()
                            .map('Match').flatten()
                            .find(['AttributeDesignator.AttributeId', prefixes.rdf + 'type'])
                            .get('AttributeValue.content', [])
                            .head()
                            .value();
                    }

                    function sortUsers(users) {
                        return _.sortBy(users, 'username');
                    }

                    function sortGroups(groups) {
                        return _.sortBy(groups, 'title');
                    }

                    dvm.cancel = function() {
                        dvm.overlayFlag = false;
                    }

                    dvm.save = function() {
                        dvm.overlayFlag = false;
                        pm.updatePolicy(dvm.policy)
                            .then(() => {
                                dvm.policy.changed = false;
                                dvm.util.createSuccessToast('Permissions updated')
                            }, utilService.createErrorToast);
                    }
                },
                templateUrl: 'directives/recordAccessOverlay/recordAccessOverlay.html'
            }
        }
})();

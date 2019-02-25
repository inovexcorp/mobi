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
(function () {
    'use strict';

    /**
     * @ngdoc component
     * @name shared.component:userAccessControls
     * @requires shared.service:policyManagerService
     * @requires shared.service:utilService
     * @requires shared.service:loginManagerService
     * @requires shared.service:prefixes
     *
     * @description
     * `userAccessControls` is a component that creates a Bootstrap `row` div with a single column containing a
     * {@link shared.component:block block} for viewing and updating overall permissions from policies.
     * 
     * @param {}
     */
    const userAccessControlsComponent = {
        templateUrl: 'shared/components/userAccessControls/userAccessControls.component.html',
        bindings: {
            item: '<',
            ruleTitle: '<',
            ruleId: '<',
            updateItem: '&'
        },
        controllerAs: 'dvm',
        controller: userAccessControlsComponentCtrl
    };

    userAccessControlsComponentCtrl.$inject = ['$scope', 'policyManagerService', 'loginManagerService', 'prefixes'];

    function userAccessControlsComponentCtrl($scope, policyManagerService, loginManagerService, prefixes) {
        var dvm = this;
        dvm.lm = loginManagerService;
        var pm = policyManagerService;
        var groupAttributeId = 'http://mobi.com/policy/prop-path(' + encodeURIComponent('^<' + prefixes.foaf + 'member' + '>') + ')';
        var userRole = 'http://mobi.com/roles/user';

        dvm.filterUsers = function(users, searchText) {
            return _.filter(users, user => _.includes(user.username.toLowerCase(), searchText.toLowerCase()));
        }
        dvm.filterGroups = function(groups, searchText) {
            return _.filter(groups, group => _.includes(group.title.toLowerCase(), searchText.toLowerCase()));
        }
        dvm.addUser = function(user) {
            if (user) {
                dvm.item.selectedUsers.push(user);
                dvm.item.selectedUsers = sortUsers(dvm.item.selectedUsers);
                _.remove(dvm.item.users, user);
                dvm.item.selectedUser = undefined;
                dvm.item.userSearchText = '';
                $scope.$$childTail.userSearchText = '';
                $scope.$$childTail.selectedUser = undefined;
                document.activeElement.blur();
                if (!dvm.ruleId) {
                    addUserMatch(user.iri, dvm.item.policy);
                }
                dvm.updateItem({item: dvm.item});
            }
        }
        dvm.removeUser = function(user) {
            dvm.item.users.push(user);
            dvm.item.users = sortUsers(dvm.item.users);
            _.remove(dvm.item.selectedUsers, user);
            if (!dvm.ruleId) {
                removeMatch(user.iri, dvm.item.policy);
            }
            dvm.updateItem({item: dvm.item});
        }
        dvm.addGroup = function(group) {
            if (group) {
                dvm.item.selectedGroups.push(group);
                dvm.item.selectedGroups = sortGroups(dvm.item.selectedGroups);
                _.remove(dvm.item.groups, group);
                dvm.item.selectedGroup = undefined;
                dvm.item.groupSearchText = '';
                $scope.$$childTail.groupSearchText = '';
                $scope.$$childTail.selectedGroup = undefined;
                document.activeElement.blur();
                if (!dvm.ruleId) {
                    addGroupMatch(group.iri, dvm.item.policy);
                }
                dvm.updateItem({item: dvm.item});
            }
        }
        dvm.removeGroup = function(group) {
            dvm.item.groups.push(group);
            dvm.item.groups = sortGroups(dvm.item.groups);
            _.remove(dvm.item.selectedGroups, group);
            if (!dvm.ruleId) {
                removeMatch(group.iri, dvm.item.policy);
            }
            dvm.updateItem({item: dvm.item});
        }
        dvm.toggleEveryone = function() {
            if (dvm.item.everyone) {
                if (!dvm.ruleId) {
                    _.set(dvm.item.policy, 'Rule[0].Target.AnyOf[0].AllOf', []);
                    addMatch(userRole, prefixes.user + 'hasUserRole', dvm.item.policy);
                }
                dvm.item.users = sortUsers(_.concat(dvm.item.users, dvm.item.selectedUsers));
                dvm.item.selectedUsers = [];
                dvm.item.groups = sortGroups(_.concat(dvm.item.groups, dvm.item.selectedGroups));
                dvm.item.selectedGroups = [];
            } else {
                if (!dvm.ruleId) {
                    removeMatch(userRole, dvm.item.policy);
                }
                dvm.addUser(_.find(dvm.item.users, {iri: dvm.lm.currentUserIRI}));
            }
            dvm.updateItem({item: dvm.item});
        }

        function removeMatch(value, policy) {
            _.remove(_.get(policy, 'Rule[0].Target.AnyOf[0].AllOf', []), ['Match[0].AttributeValue.content[0]', value]);
        }
        function addUserMatch(value, policy) {
            addMatch(value, pm.subjectId, policy);
        }
        function addGroupMatch(value, policy) {
            addMatch(value, groupAttributeId, policy);
        }
        function addMatch(value, id, policy) {
            var newMatch = {
                Match: [{
                    AttributeValue: {
                        content: [value],
                        otherAttributes: {},
                        DataType: prefixes.xsd + 'string'
                    },
                    AttributeDesignator: {
                        Category: pm.subjectCategory,
                        AttributeId: id,
                        DataType: prefixes.xsd + 'string',
                        MustBePresent: true
                    },
                    MatchId: pm.stringEqual
                }]
            };
            _.get(policy, 'Rule[0].Target.AnyOf[0].AllOf', []).push(newMatch);
        }
        function sortUsers(users) {
            return _.sortBy(users, 'username');
        }
        function sortGroups(groups) {
            return _.sortBy(groups, 'title');
        }
    }

    angular.module('shared')
        .component('userAccessControls', userAccessControlsComponent);
})();

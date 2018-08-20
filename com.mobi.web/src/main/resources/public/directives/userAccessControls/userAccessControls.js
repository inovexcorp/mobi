/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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

    angular
        /**
         * @ngdoc overview
         * @name permissionsPage
         *TODO: SWITCH ALL THIS TO USERACCESSCONTROLS
         * @description
         * The `permissionsPage` module only provides the `permissionsPage` directive which which creates
         * a Bootstrap `row` with a {@link block.directive:block block} for viewing and updating overall
         * permissions of the application.
         */
        .module('userAccessControls', [])
        /**
         * @ngdoc directive
         * @name permissionsPage.directive:permissionsPage
         * @scope
         * @restrict E
         * @requires policyManager.service:policyManagerService
         * @requires catalogManager.service:catalogManagerService
         * @requires util.service:utilService
         * @requires prefixes.service:prefixes
         * @requires userManager.service:userManagerService
         *
         * @description
         * `permissionsPage` is a directive that creates a Bootstrap `row` div with a single column
         * containing a {@link block.directive:block block} for viewing and updating overall permissions
         * from policies retrieved through the {@link policyManager.service:policyManagerService}.
         * The list is refreshed everytime this directive is rendered for the first time so any changes
         * made to the policies will reset when navigating away and back. Currently, the only policies
         * displayed are those for restrictions on record creation. The directive is replaced by the
         * contents of its template.
         */
        .directive('userAccessControls', userAccessControls)
        /**
         * @ngdoc directive
         * @name permissionsPage.directive:hideLabel
         * @restrict A
         *hid
         * @description
         * `hideLabel` is a utility directive for working with Angular Material inputs so that
         * the placeholder for a md-autocomplete is set appropriately on the underlying <input>.
         */
        .directive('hideLabel', hideLabel);

    userAccessControls.$inject = ['$q', 'policyManagerService', 'catalogManagerService', 'utilService', 'prefixes', 'userManagerService'];

    function userAccessControls($q, policyManagerService, catalogManagerService, utilService, prefixes, userManagerService) {
        return {
            restrict: 'E',
            replace: true,
            controllerAs: 'dvm',
            scope: {
                item: '<'
            },
            controller: ['$scope', function($scope) {
                var dvm = this;
                var pm = policyManagerService;
                var um = userManagerService;
                var util = utilService;
                var resource = _.get(catalogManagerService.localCatalog, '@id', '');
                var action = pm.actionCreate;
                var groupAttributeId = 'http://mobi.com/policy/prop-path(' + encodeURIComponent('^<' + prefixes.foaf + 'member' + '>') + ')';
                var userRole = 'http://mobi.com/roles/user';

                dvm.policies = [];

                dvm.filterUsers = function(users, searchText) {
                    return _.filter(users, user => _.includes(user.username.toLowerCase(), searchText.toLowerCase()));
                }
                dvm.filterGroups = function(groups, searchText) {
                    return _.filter(groups, group => _.includes(group.title.toLowerCase(), searchText.toLowerCase()));
                }
                dvm.addUser = function(user, item) {
                    if (user) {
                        item.selectedUsers.push(user);
                        item.selectedUsers = sortUsers(item.selectedUsers);
                        _.remove(item.users, user);
                        item.selectedUser = undefined;
                        item.userSearchText = '';
                        $scope.$$childTail.userSearchText = '';
                        $scope.$$childTail.selectedUser = undefined;
                        document.activeElement.blur();
                        addUserMatch(user.iri, item.policy);
                        item.changed = true;
                    }
                }
                dvm.removeUser = function(user, item) {
                    item.users.push(user);
                    item.users = sortUsers(item.users);
                    _.remove(item.selectedUsers, user);
                    removeMatch(user.iri, item.policy);
                    item.changed = true;
                }
                dvm.addGroup = function(group, item) {
                    if (group) {
                        item.selectedGroups.push(group);
                        item.selectedGroups = sortGroups(item.selectedGroups);
                        _.remove(item.groups, group);
                        item.selectedGroup = undefined;
                        item.groupSearchText = '';
                        $scope.$$childTail.groupSearchText = '';
                        $scope.$$childTail.selectedGroup = undefined;
                        document.activeElement.blur();
                        addGroupMatch(group.iri, item.policy);
                        item.changed = true;
                    }
                }
                dvm.removeGroup = function(group, item) {
                    item.groups.push(group);
                    item.groups = sortGroups(item.groups);
                    _.remove(item.selectedGroups, group);
                    removeMatch(group.iri, item.policy);
                    item.changed = true;
                }
                dvm.toggleEveryone = function(item) {
                    if (item.everyone) {
                        _.set(item.policy, 'Rule[0].Target.AnyOf[0].AllOf', []);
                        addMatch(userRole, prefixes.user + 'hasUserRole', item.policy);
                        item.users = sortUsers(_.concat(item.users, item.selectedUsers));
                        item.selectedUsers = [];
                        item.groups = sortGroups(_.concat(item.groups, item.selectedGroups));
                        item.selectedGroups = [];
                    } else {
                        removeMatch(userRole, item.policy);
                    }
                    item.changed = true;
                }
                dvm.saveChanges = function() {
                    var changedPolicies = _.filter(dvm.policies, 'changed');
                    $q.all(_.map(changedPolicies, item => pm.updatePolicy(item.policy)))
                        .then(() => {
                            _.forEach(changedPolicies, item => item.changed = false);
                            util.createSuccessToast('Permissions updated');
                        }, util.createErrorToast);
                }
                dvm.hasChanges = function() {
                    return _.some(dvm.policies, 'changed');
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
            }],
            templateUrl: 'directives/userAccessControls/userAccessControls.html'
        };
    }

    hideLabel.$inject = ['$timeout'];

    function hideLabel($timeout) {
        return {
            restrict: 'A',
            link: function(scope, elem, attrs) {
                if ('placeholder' in attrs) {
                    $timeout(() => elem.find('input').attr('placeholder', attrs.placeholder));
                }
            }
        }
    }
})();

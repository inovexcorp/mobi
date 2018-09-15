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
         * @name userAccessControls
         * @description
         * The `userAccessControls` module only provides the `userAccessControls` directive which which creates
         * selectors for viewing and updating permissions of the application.
         */
        .module('userAccessControls', [])
        /**
         * @ngdoc directive
         * @name userAccessControls.directive:userAccessControls
         * @scope
         * @restrict E
         * @requires policyManager.service:policyManagerService
         * @requires catalogManager.service:catalogManagerService
         * @requires util.service:utilService
         * @requires loginManager.service:loginManagerService
         * @requires prefixes.service:prefixes
         *
         * @description
         * `userAccessControls` is a directive that creates a Bootstrap `row` div with a single column
         * containing a {@link block.directive:block block} for viewing and updating overall permissions
         * from policies. The directive is replaced by the contents of its template.
         */
        .directive('userAccessControls', userAccessControls)
        /**
         * @ngdoc directive
         * @name userAccessControls.directive:hideLabel
         * @restrict A
         *
         * @description
         * `hideLabel` is a utility directive for working with Angular Material inputs so that
         * the placeholder for a md-autocomplete is set appropriately on the underlying <input>.
         */
        .directive('hideLabel', hideLabel);

    userAccessControls.$inject = ['$q', 'policyManagerService', 'catalogManagerService', 'utilService', 'loginManagerService', 'prefixes'];

    function userAccessControls($q, policyManagerService, catalogManagerService, utilService, loginManagerService, prefixes) {
        return {
            restrict: 'E',
            replace: true,
            controllerAs: 'dvm',
            scope: {
                item: '=',
                ruleTitle: '<'
            },
            bindToController: {
                ruleId: '<'
            },
            controller: ['$scope', function($scope) {
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
                        if (!dvm.ruleId) {
                            addUserMatch(user.iri, item.policy);
                        }
                        item.changed = true;
                    }
                }
                dvm.removeUser = function(user, item) {
                    item.users.push(user);
                    item.users = sortUsers(item.users);
                    _.remove(item.selectedUsers, user);
                    if (!dvm.ruleId) {
                        removeMatch(user.iri, item.policy);
                    }
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
                        if (!dvm.ruleId) {
                            addGroupMatch(group.iri, item.policy);
                        }
                        item.changed = true;
                    }
                }
                dvm.removeGroup = function(group, item) {
                    item.groups.push(group);
                    item.groups = sortGroups(item.groups);
                    _.remove(item.selectedGroups, group);
                    if (!dvm.ruleId) {
                        removeMatch(group.iri, item.policy);
                    }
                    item.changed = true;
                }
                dvm.toggleEveryone = function(item) {
                    if (item.everyone) {
                        if (!dvm.ruleId) {
                            _.set(item.policy, 'Rule[0].Target.AnyOf[0].AllOf', []);
                            addMatch(userRole, prefixes.user + 'hasUserRole', item.policy);
                        }
                        item.users = sortUsers(_.concat(item.users, item.selectedUsers));
                        item.selectedUsers = [];
                        item.groups = sortGroups(_.concat(item.groups, item.selectedGroups));
                        item.selectedGroups = [];
                    } else {
                        if (!dvm.ruleId) {
                            removeMatch(userRole, item.policy);
                        }
                        dvm.addUser(_.find(item.users, {iri: dvm.lm.currentUserIRI}), item);
                    }
                    item.changed = true;
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

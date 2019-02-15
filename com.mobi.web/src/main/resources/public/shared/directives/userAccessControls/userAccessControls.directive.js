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
        .config(ignoreUnhandledRejectionsConfig)
        /**
         * @ngdoc directive
         * @name userAccessControls.directive:userAccessControls
         * @scope
         * @restrict E
         * @requires policyManager.service:policyManagerService
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

    userAccessControls.$inject = ['$q', 'policyManagerService', 'utilService', 'loginManagerService', 'prefixes'];

    function userAccessControls($q, policyManagerService, utilService, loginManagerService, prefixes) {
        return {
            restrict: 'E',
            replace: true,
            controllerAs: 'dvm',
            scope: {},
            bindToController: {
                item: '=',
                ruleTitle: '<',
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
                        dvm.item.changed = true;
                    }
                }
                dvm.removeUser = function(user) {
                    dvm.item.users.push(user);
                    dvm.item.users = sortUsers(dvm.item.users);
                    _.remove(dvm.item.selectedUsers, user);
                    if (!dvm.ruleId) {
                        removeMatch(user.iri, dvm.item.policy);
                    }
                    dvm.item.changed = true;
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
                        dvm.item.changed = true;
                    }
                }
                dvm.removeGroup = function(group) {
                    dvm.item.groups.push(group);
                    dvm.item.groups = sortGroups(dvm.item.groups);
                    _.remove(dvm.item.selectedGroups, group);
                    if (!dvm.ruleId) {
                        removeMatch(group.iri, dvm.item.policy);
                    }
                    dvm.item.changed = true;
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
                    dvm.item.changed = true;
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
            templateUrl: 'directives/userAccessControls/userAccessControls.directive.html'
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

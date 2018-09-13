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
                item: '=',
                ruleTitle: '<'
            },
            bindToController: {
                ruleId: '<'
            },
            controller: ['$scope', function($scope) {
                var dvm = this;
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
                        switch (dvm.ruleId) {
                            case 'urn:read':
                                _.get(item.policy, 'Rule[0].Target.AnyOf', []).splice(1,1);
                                break;
                            case 'urn:delete':
                                _.get(item.policy, 'Rule[1].Target.AnyOf', []).splice(1,1);
                                break;
                            case 'urn:update':
                                _.get(item.policy, 'Rule[2].Target.AnyOf', []).splice(1,1);
                                break;
                            case 'urn:modify':
                                _.set(item.policy, 'Rule[3].Condition.Expression.value.Expression[1].value.Expression', []);
                                break;
                            case 'urn:': //TODO: MANAGE A RECORD?

                                break;
                            default:
                                _.set(item.policy, 'Rule[0].Target.AnyOf[0].AllOf', []);
                                break;
                        }
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

                function removeMatch(value, policy) {
                    switch (dvm.ruleId) {
                        case 'urn:read':
                            if (value === userRole) {
                                _.remove(_.get(policy, 'Rule[0].Target.AnyOf[0].AllOf[0].Match'), ['AttributeValue.content[0]', value]);
                            } else {
                                _.remove(_.get(policy, 'Rule[0].Target.AnyOf', []), ['AllOf[0].Match[0].AttributeValue.content[0]', value]);
                            }
                            break;
                        case 'urn:delete':
                            if (value === userRole) {
                                _.remove(_.get(policy, 'Rule[1].Target.AnyOf[0].AllOf[0].Match'), ['AttributeValue.content[0]', value]);
                            } else {
                                _.remove(_.get(policy, 'Rule[1].Target.AnyOf', []), ['AllOf[0].Match[0].AttributeValue.content[0]', value]);
                            }
                            break;
                        case 'urn:update':
                            if (value === userRole) {
                                _.remove(_.get(policy, 'Rule[2].Target.AnyOf[0].AllOf[0].Match'), ['AttributeValue.content[0]', value]);
                            } else {
                                _.remove(_.get(policy, 'Rule[2].Target.AnyOf', []), ['AllOf[0].Match[0].AttributeValue.content[0]', value]);
                            }
                        case 'urn:modify':
                            _.remove(_.get(policy, 'Rule[3].Condition.Expression.value.Expression[1].value.Expression', []), ['value.Expression[1].value.content[0]', value]);
                            break;
                        case 'urn:': //TODO: MANAGE A RECORD?
                            break;
                        default:
                            _.remove(_.get(policy, 'Rule[0].Target.AnyOf[0].AllOf', []), ['Match[0].AttributeValue.content[0]', value]);
                            break;
                    }
                }
                function addUserMatch(value, policy) {
                    addMatch(value, pm.subjectId, policy);
                }
                function addGroupMatch(value, policy) {
                    addMatch(value, groupAttributeId, policy);
                }
                function addMatch(value, id, policy) {
                    switch (dvm.ruleId) {
                        case 'urn:read':
                            if (value === userRole) {
                                _.get(policy, 'Rule[0].Target.AnyOf[0].AllOf[0].Match', []).push(createMatch(value, id));
                            } else {
                                if (policy.Rule[0].Target.AnyOf.length == 1) {
                                    _.get(policy, 'Rule[0].Target.AnyOf', []).push({AllOf: [createMatchArray(value, id)]});
                                } else {
                                    _.get(policy, 'Rule[0].Target.AnyOf[1].AllOf', []).push(createMatchArray(value, id));
                                }
                            }
                            break;
                        case 'urn:delete':
                            if (value === userRole) {
                                _.get(policy, 'Rule[1].Target.AnyOf[0].AllOf[0].Match', []).push(createMatch(value, id));
                            } else {
                                if (policy.Rule[1].Target.AnyOf.length == 1) {
                                    _.get(policy, 'Rule[1].Target.AnyOf', []).push({AllOf: [createMatchArray(value, id)]});
                                } else {
                                    _.get(policy, 'Rule[1].Target.AnyOf[1].AllOf', []).push(createMatchArray(value, id));
                                }
                            }
                            break;
                        case 'urn:update':
                            if (value === userRole) {
                                _.get(policy, 'Rule[2].Target.AnyOf[0].AllOf[0].Match', []).push(createMatch(value, id));
                            } else {
                                if (policy.Rule[2].Target.AnyOf.length == 1) {
                                    _.get(policy, 'Rule[2].Target.AnyOf', []).push({AllOf: [createMatchArray(value, id)]});
                                } else {
                                    _.get(policy, 'Rule[2].Target.AnyOf[1].AllOf', []).push(createMatchArray(value, id));
                                }
                            }
                        case 'urn:modify':
                            _.get(policy, 'Rule[3].Condition.Expression.value.Expression[1].value.Expression').push(createAnyOfExpression(value, id));
                            break;
                        case 'urn:': //TODO: MANAGE A RECORD?
                            break;
                        default:
                            _.get(policy, 'Rule[0].Target.AnyOf[0].AllOf', []).push(createMatchArray(value, id));
                            break;
                    }
                }
                function createMatchArray(value, id) {
                    return {
                        Match: [createMatch(value, id)]
                    };
                }
                function createMatch(value, id) {
                    return {
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
                    };
                }
                function createAnyOfExpression(value, id) {
                    return {
                        declaredType: 'com.mobi.security.policy.api.xacml.jaxb.ApplyType',
                        globalScope: true,
                        name: '{urn:oasis:names:tc:xacml:3.0:core:schema:wd-17}Apply',
                        nil: false,
                        scope: 'javax.xml.bind.JAXBElement$GlobalScope',
                        typeSubstituted: false,
                        value: {
                            Expression: [
                                {
                                    declaredType: 'com.mobi.security.policy.api.xacml.jaxb.FunctionType',
                                    globalScope: true,
                                    name: '{urn:oasis:names:tc:xacml:3.0:core:schema:wd-17}Function',
                                    nil: false,
                                    scope: 'javax.xml.bind.JAXBElement$GlobalScope',
                                    typeSubstituted: false,
                                    value: {
                                        FunctionId: pm.stringEqual
                                    }
                                },
                                {
                                    declaredType: 'com.mobi.security.policy.api.xacml.jaxb.AttributeValueType',
                                    globalScope: true,
                                    name: '{urn:oasis:names:tc:xacml:3.0:core:schema:wd-17}AttributeValue',
                                    nil: false,
                                    scope: 'javax.xml.bind.JAXBElement$GlobalScope',
                                    typeSubstituted: false,
                                    value: {
                                        DataType: prefixes.xsd + 'string',
                                        content: [value]
                                    }
                                },
                                {
                                    declaredType: 'com.mobi.security.policy.api.xacml.jaxb.AttributeDesignatorType',
                                    globalScope: true,
                                    name: '{urn:oasis:names:tc:xacml:3.0:core:schema:wd-17}AttributeDesignator',
                                    nil: false,
                                    scope: 'javax.xml.bind.JAXBElement$GlobalScope',
                                    typeSubstituted: false,
                                    value: {
                                        AttributeId: id,
                                        Category: pm.subjectCategory,
                                        DataType: prefixes.xsd + 'string',
                                        MustBePresent: true
                                    }
                                }
                            ],
                            FunctionId: pm.functionAnyOf
                        }
                    }
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

/*-
 * #%L
 * org.matonto.web
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
(function () {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name createGroupOverlay
         *
         * @description 
         * The `createGroupOverlay` module only provides the `createGroupOverlay` directive which creates
         * an overlay for adding a group to MatOnto.
         */
        .module('createGroupOverlay', [])
        /**
         * @ngdoc directive
         * @name createGroupOverlay.directive:createGroupOverlay
         * @scope
         * @restrict E
         * @requires $q
         * @requires userManager.service:userManagerService
         * @requires userState.service:userStateService
         * @requires loginManager.service:loginManagerService
         *
         * @description 
         * `createGroupOverlay` is a directive that creates an overlay with a form to add a group to Matonto.
         * The directive is replaced by the contents of its template.
         */
        .directive('createGroupOverlay', createGroupOverlay)
        .directive('uniqueTitle', uniqueTitle);

    uniqueTitle.$inject = ['$parse', 'userManagerService'];

    function uniqueTitle($parse, userManagerService) {
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function(scope, el, attrs, ctrl) {
                ctrl.$validators.uniqueTitle = function(modelValue, viewValue) {
                    var value = modelValue || viewValue;
                    if (ctrl.$isEmpty(value)) {
                        return true;
                    }
                    return !_.includes(_.map(userManagerService.groups, 'title'), value);
                }
            }
        }
    }

    createGroupOverlay.$inject = ['$q', 'userStateService', 'userManagerService', 'loginManagerService'];

    function createGroupOverlay($q, userStateService, userManagerService, loginManagerService) {
        return {
            restrict: 'E',
            controllerAs: 'dvm',
            replace: true,
            scope: {},
            controller: function() {
                var dvm = this;
                dvm.state = userStateService;
                dvm.um = userManagerService;
                dvm.lm = loginManagerService;
                dvm.newGroup = {
                    title: '',
                    description: '',
                    roles: [],
                    members: [dvm.lm.currentUser]
                }
                dvm.errorMessage = '';

                dvm.add = function () {
                    dvm.um.addGroup(dvm.newGroup).then(response => {
                        return $q.all(_.map(dvm.newGroup.members, member => dvm.um.addUserGroup(member, dvm.newGroup.title)));
                    }, error => {
                        return $q.reject(error);
                    }).then(responses => {
                        dvm.errorMessage = '';
                        dvm.state.displayCreateGroupOverlay = false;
                    }, error => {
                        dvm.errorMessage = error;
                    });
                };
                dvm.addMember = function() {
                    dvm.newGroup.members.push(dvm.state.memberName);
                    dvm.state.memberName = '';
                }
                dvm.removeMember = function() {
                    _.pull(dvm.newGroup.members, dvm.state.memberName);
                    dvm.state.memberName = '';
                }
            },
            templateUrl: 'modules/user-management/directives/createGroupOverlay/createGroupOverlay.html'
        };
    }
})();
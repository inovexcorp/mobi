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
        .module('addGroupOverlay', [])
        .directive('addGroupOverlay', addGroupOverlay);

    addGroupOverlay.$inject = ['$q', 'userStateService', 'userManagerService', 'loginManagerService'];

    function addGroupOverlay($q, userStateService, userManagerService, loginManagerService) {
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
                dvm.members = [dvm.lm.currentUser];
                dvm.errorMessage = '';

                dvm.add = function () {
                    dvm.um.addGroup(dvm.name).then(response => {
                        return $q.all(_.map(dvm.members, member => dvm.um.addUserGroup(member, dvm.name)));
                    }, error => {
                        return $q.reject(error);
                    }).then(responses => {
                        dvm.errorMessage = '';
                        dvm.state.showAddGroup = false;
                    }, error => {
                        dvm.errorMessage = error;
                    });
                };
                dvm.testUniqueness = function () {
                    dvm.form.name.$setValidity('uniqueName', !_.includes(_.map(dvm.um.groups, 'name'), dvm.name));
                };
                dvm.addMember = function() {
                    dvm.members.push(dvm.state.memberName);
                    dvm.state.memberName = '';
                }
                dvm.removeMember = function() {
                    _.pull(dvm.members, dvm.state.memberName);
                    dvm.state.memberName = '';
                }
            },
            templateUrl: 'modules/user-management/directives/addGroupOverlay/addGroupOverlay.html'
        };
    }
})();
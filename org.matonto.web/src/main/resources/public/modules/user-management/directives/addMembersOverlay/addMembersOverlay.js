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

    angular.module('addMembersOverlay', [])
        .directive('addMembersOverlay', addMembersOverlay);

    addMembersOverlay.$inject = ['$q', 'userStateService', 'userManagerService'];

    function addMembersOverlay($q, userStateService, userManagerService) {
        return {
            restrict: 'E',
            controllerAs: 'dvm',
            replace: true,
            scope: {},
            controller: function controller() {
                var dvm = this;
                dvm.state = userStateService;
                dvm.um = userManagerService;
                dvm.errorMessage = '';

                dvm.users = _.filter(dvm.um.users, user => !_.includes(dvm.state.selectedGroup.members, user.username));

                dvm.add = function () {
                    $q.all(_.forEach(dvm.members, member => dvm.um.addUserGroup(member.username, dvm.state.selectedGroup.name))).then(responses => {
                        dvm.errorMessage = '';
                        dvm.state.showAddMembers = false;
                    }, error => {
                        dvm.errorMessage = error;
                    });
                };
            },
            templateUrl: 'modules/user-management/directives/addMembersOverlay/addMembersOverlay.html'
        };
    }
})();
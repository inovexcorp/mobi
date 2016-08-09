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
(function() {
    'use strict';

    angular
        .module('memberTable', [])
        .directive('memberTable', memberTable);

        memberTable.$inject = ['userStateService', 'userManagerService', 'loginManagerService'];

        function memberTable(userStateService, userManagerService, loginManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                bindToController: {
                    removeMember: '&',
                    addMember: '&',
                    members: '='
                },
                controller: function() {
                    var dvm = this;
                    dvm.state = userStateService;
                    dvm.lm = loginManagerService;
                    dvm.um = userManagerService;
                    
                    dvm.addingMember = false;
                    dvm.selectedUser = undefined;

                    dvm.getMembers = function() {
                        return _.filter(dvm.um.users, user => _.includes(dvm.members, user.username));
                    }
                    dvm.getAvailableUsers = function() {
                        return _.filter(dvm.um.users, user => !_.includes(dvm.members, user.username));
                    }
                    dvm.onSelect = function() {
                        dvm.state.memberName = dvm.selectedUser.username;
                        dvm.selectedUser = undefined;
                        dvm.addingMember = false;
                        dvm.addMember();
                    }
                },
                templateUrl: 'modules/user-management/directives/memberTable/memberTable.html'
            }
        }
})();

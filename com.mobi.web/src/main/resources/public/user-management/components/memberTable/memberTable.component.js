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
(function() {
    'use strict';

    /**
     * @ngdoc component
     * @name user-management.component:memberTable
     * @requires shared.service:userManagerService
     * @requires shared.service:userStateService
     * @requires shared.service:loginManagerService
     *
     * @description
     * `memberTable` is a component that creates a table of the passed members and provides functionality for adding
     * members to the and removing members from list. The exact method of adding and removing is determined by the
     * provided `addMember` and `removeMember` functions. When the "Add Member" link is clicked, a row is added to the
     * table contains a `ui-select` with the available users to add to the member list. Once a user has been
     * selected in the `ui-select`, it will be added to the list. If you click off of the `ui-select`, it will be
     * removed. The Add and Remove functionality is only available if the `readOnly` attribute is falsy.
     *
     * @param {boolean} readOnly Whether the table should be read only (i.e. non-editable)
     * @param {string[]} members The list of members names to display in the table
     * @param {Function} removeMember The method to call when a member is removed from the list. Expects an argument
     * called `member`
     * @param {Function} addMember The method to call when a member is added to the list. Expects an argument called
     * `member`
     * @param {boolean} linkToUser Whether the usernames should be links to viewing the user in the
     * {@link user-management.component:usersPage}
     */
    const memberTableComponent = {
        templateUrl: 'user-management/components/memberTable/memberTable.component.html',
        bindings: {
            readOnly: '<',
            members: '<',
            removeMember: '&',
            addMember: '&',
            linkToUser: '<'
        },
        controllerAs: 'dvm',
        controller: memberTableComponentCtrl
    };

    memberTableComponentCtrl.$inject = ['userStateService', 'userManagerService', 'loginManagerService'];

    function memberTableComponentCtrl(userStateService, userManagerService, loginManagerService) {
        var dvm = this;
        dvm.state = userStateService;
        dvm.lm = loginManagerService;
        dvm.um = userManagerService;

        dvm.addingMember = false;
        dvm.selectedUser = undefined;
        dvm.memberObjects = [];
        dvm.availableUsers = []; 

        dvm.$onChanges = function(changesObj) {
            if (_.has(changesObj, 'members')) {
                dvm.memberObjects = _.filter(dvm.um.users, user => _.includes(dvm.members, user.username));
                dvm.availableUsers = _.filter(dvm.um.users, user => !_.includes(dvm.members, user.username));
            }
        }
        dvm.onSelect = function() {
            dvm.addMember({member: dvm.selectedUser.username});
            dvm.selectedUser = undefined;
            dvm.addingMember = false;
        }
        dvm.goToUser = function(user) {
            dvm.state.showGroups = false;
            dvm.state.showUsers = true;
            dvm.state.selectedUser = user;
        }
    }

    angular.module('user-management')
        .component('memberTable', memberTableComponent);
})();

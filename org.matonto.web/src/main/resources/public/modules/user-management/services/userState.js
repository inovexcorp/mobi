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
        /**
         * @ngdoc overview
         * @name userState
         *
         * @description 
         * The `userState` module only provides the `userStateService` service which contains 
         * various variables to hold the state of the user management page and utility 
         * functions to update those variables.
         */
        .module('userState', [])
        /**
         * @ngdoc service
         * @name userState.service:userStateService
         *
         * @description 
         * @description 
         * `userStateService` is a service which contains various variables to hold the 
         * state of the user management page and utility functions to update those variables.
         */
        .service('userStateService', userStateService);

        function userStateService() {
            var self = this;

            /**
             * @ngdoc property
             * @name userState.service:userStateService#showGroupsList
             * @propertyOf userState.service:userStateService
             * @type {boolean}
             *
             * @description 
             * `showGroupsList` holds a boolean indicating whether or not the 
             * {@link groupsList.directive:groupsList Groups List} should be shown.
             */
            self.showGroupsList = true;
            /**
             * @ngdoc property
             * @name userState.service:userStateService#showUsersList
             * @propertyOf userState.service:userStateService
             * @type {boolean}
             *
             * @description 
             * `showUsersList` holds a boolean indicating whether or not the 
             * {@link usersList.directive:usersList Users List} should be shown.
             */
            self.showUsersList = false;
            /**
             * @ngdoc property
             * @name userState.service:userStateService#editGroup
             * @propertyOf userState.service:userStateService
             * @type {boolean}
             *
             * @description 
             * `editGroup` holds a boolean indicating whether or not a group is being edited
             * and the {@link groupEditor.directive:groupEditor Group Editor} should be shown.
             */
            self.editGroup = false;
            /**
             * @ngdoc property
             * @name userState.service:userStateService#editUser
             * @propertyOf userState.service:userStateService
             * @type {boolean}
             *
             * @description 
             * `editUser` holds a boolean indicating whether or not a user is being edited
             * and the {@link userEditor.directive:userEditor User Editor} should be shown.
             */
            self.editUser = false;
            /**
             * @ngdoc property
             * @name userState.service:userStateService#selectedGroup
             * @propertyOf userState.service:userStateService
             * @type {object}
             *
             * @description 
             * `selectedGroup` holds the currently selected group object from the 
             * {@link userManager.service:userManagerService#groups groups list}.
             */
            self.selectedGroup = undefined;
            /**
             * @ngdoc property
             * @name userState.service:userStateService#selectedUser
             * @propertyOf userState.service:userStateService
             * @type {object}
             *
             * @description 
             * `selectedUser` holds the currently selected user object from the 
             * {@link userManager.service:userManagerService#users users list}.
             */
            self.selectedUser = undefined;

            /**
             * @ngdoc property
             * @name userState.service:userStateService#showDeleteConfirm
             * @propertyOf userState.service:userStateService
             * @type {boolean}
             *
             * @description 
             * `showDeleteConfirm` holds a boolean indicating whether or not the delete 
             * confirmation overlay should be shown.
             */
            self.showDeleteConfirm = false;
            /**
             * @ngdoc property
             * @name userState.service:userStateService#showAddUser
             * @propertyOf userState.service:userStateService
             * @type {boolean}
             *
             * @description 
             * `showAddUser` holds a boolean indicating whether or not the 
             * {@link addUserOverlays.directive:addUserOverlays Add User Overlays} should be shown.
             */
            self.showAddUser = false;
            /**
             * @ngdoc property
             * @name userState.service:userStateService#showAddGroup
             * @propertyOf userState.service:userStateService
             * @type {boolean}
             *
             * @description 
             * `showAddGroup` holds a boolean indicating whether or not the 
             * {@link addGroupOverlay.directive:addGroupOverlay Add Group Overlay} should be shown.
             */
            self.showAddGroup = false;
            /**
             * @ngdoc property
             * @name userState.service:userStateService#showRemoveMemberConfirm
             * @propertyOf userState.service:userStateService
             * @type {boolean}
             *
             * @description 
             * `showRemoveMemberConfirm` holds a boolean indicating whether or not the remove 
             * member confirmation overlay should be shown.
             */
            self.showRemoveMemberConfirm = false;
            /**
             * @ngdoc property
             * @name userState.service:userStateService#memberName
             * @propertyOf userState.service:userStateService
             * @type {string}
             *
             * @description 
             * `memberName` holds the username of the selected group member.
             */
            self.memberName = '';

            /**
             * @ngdoc method
             * @name userState.service:userStateService#reset
             * @methodOf userState.service:userStateService
             * 
             * @description 
             * Resets all the main state variables back to false and undefined.
             */
            self.reset = function() {
                self.showGroupsList = false;
                self.showUsersList = false;
                self.editGroup = false;
                self.editUser = false;
                self.selectedGroup = undefined;
                self.selectedUser = undefined;
            }
        }
})();
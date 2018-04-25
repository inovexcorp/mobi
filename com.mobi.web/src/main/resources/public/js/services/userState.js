/*-
 * #%L
 * com.mobi.web
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
         * `userStateService` is a service which contains various variables to hold the
         * state of the user management page and utility functions to update those variables.
         */
        .service('userStateService', userStateService);

        function userStateService() {
            var self = this;

            /**
             * @ngdoc property
             * @name userState.service:userStateService#groupSearchString
             * @propertyOf userState.service:userStateService
             * @type {string}
             *
             * @description
             * `groupSearchString` holds a string to be used in filtering the
             * {@link groupsList.directive:groupsList groups list}.
             */
            self.groupSearchString = '';
            /**
             * @ngdoc property
             * @name userState.service:userStateService#userSearchString
             * @propertyOf userState.service:userStateService
             * @type {string}
             *
             * @description
             * `userSearchString` holds a string to be used in filtering the
             * {@link usersList.directive:usersList users list}.
             */
            self.userSearchString = '';
            /**
             * @ngdoc property
             * @name userState.service:userStateService#filteredGroupList
             * @propertyOf userState.service:userStateService
             * @type {boolean}
             *
             * @description
             * `filteredGroupList` holds a boolean indicating whether the
             * {@link groupsList.directive:groupsList groups list} should be filtered based
             * on which user is logged in.
             */
            self.filteredGroupList = false;
            /**
             * @ngdoc property
             * @name userState.service:userStateService#showGroups
             * @propertyOf userState.service:userStateService
             * @type {boolean}
             *
             * @description
             * `showGroups` holds a boolean indicating whether the
             * {@link groupsPage.directive:groupsPage groups page} should be shown.
             */
            self.showGroups = false;
            /**
             * @ngdoc property
             * @name userState.service:userStateService#showUsers
             * @propertyOf userState.service:userStateService
             * @type {boolean}
             *
             * @description
             * `showUsers` holds a boolean indicating whether the
             * {@link usersPage.directive:usersPage users page} should be shown.
             */
            self.showUsers = true;
            /**
             * @ngdoc property
             * @name userState.service:userStateService#showPermissions
             * @propertyOf userState.service:userStateService
             * @type {boolean}
             *
             * @description
             * `showPermissions` holds a boolean indicating whether the
             * {@link permissionsPage.directive:permissionsPage permissions page} should be shown.
             */
            self.showPermissions = false;
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
             * @name userState.service:userStateService#memberName
             * @propertyOf userState.service:userStateService
             * @type {string}
             *
             * @description
             * `memberName` holds the username of the selected group member.
             */
            self.memberName = '';

            /**
             * @ngdoc property
             * @name userState.service:userStateService#displayDeleteUserConfirm
             * @propertyOf userState.service:userStateService
             * @type {boolean}
             *
             * @description
             * `displayDeleteUserConfirm` holds a boolean indicating whether or not the delete
             * user confirmation overlay should be shown.
             */
            self.displayDeleteUserConfirm = false;
            /**
             * @ngdoc property
             * @name userState.service:userStateService#displayDeleteGroupConfirm
             * @propertyOf userState.service:userStateService
             * @type {boolean}
             *
             * @description
             * `displayDeleteGroupConfirm` holds a boolean indicating whether or not the delete
             * group confirmation overlay should be shown.
             */
            self.displayDeleteGroupConfirm = false;
            /**
             * @ngdoc property
             * @name userState.service:userStateService#displayCreateUserOverlay
             * @propertyOf userState.service:userStateService
             * @type {boolean}
             *
             * @description
             * `displayCreateUserOverlay` holds a boolean indicating whether or not the
             * {@link createUserOverlays.directive:createUserOverlays Create User Overlays} should be shown.
             */
            self.displayCreateUserOverlay = false;
            /**
             * @ngdoc property
             * @name userState.service:userStateService#displayCreateGroupOverlay
             * @propertyOf userState.service:userStateService
             * @type {boolean}
             *
             * @description
             * `displayCreateGroupOverlay` holds a boolean indicating whether or not the
             * {@link createGroupOverlay.directive:createGroupOverlay Create Group Overlay} should be shown.
             */
            self.displayCreateGroupOverlay = false;
            /**
             * @ngdoc property
             * @name userState.service:userStateService#displayResetPasswordOverlay
             * @propertyOf userState.service:userStateService
             * @type {boolean}
             *
             * @description
             * `displayResetPasswordOverlay` holds a boolean indicating whether or not the
             * {@link resetPasswordOverlay.directive:resetPasswordOverlay Reset Password Overlay} should be shown.
             */
            self.displayResetPasswordOverlay = false;
            /**
             * @ngdoc property
             * @name userState.service:userStateService#displayEditProfileOverlay
             * @propertyOf userState.service:userStateService
             * @type {boolean}
             *
             * @description
             * `displayEditProfileOverlay` holds a boolean indicating whether or not the
             * {@link editProfileOverlay.directive:editProfileOverlay Edit Profile Overlay} should be shown.
             */
            self.displayEditProfileOverlay = false;
            /**
             * @ngdoc property
             * @name userState.service:userStateService#displayEditGroupInfoOverlay
             * @propertyOf userState.service:userStateService
             * @type {boolean}
             *
             * @description
             * `displayEditGroupInfoOverlay` holds a boolean indicating whether or not the
             * {@link editGroupInfoOverlay.directive:editGroupInfoOverlay Edit Group Info Overlay} should be shown.
             */
            self.displayEditGroupInfoOverlay = false;
            /**
             * @ngdoc property
             * @name userState.service:userStateService#displayRemoveMemberConfirm
             * @propertyOf userState.service:userStateService
             * @type {boolean}
             *
             * @description
             * `displayRemoveMemberConfirm` holds a boolean indicating whether or not the remove
             * member confirmation overlay should be shown.
             */
            self.displayRemoveMemberConfirm = false;

            /**
             * @ngdoc method
             * @name userState.service:userStateService#reset
             * @methodOf userState.service:userStateService
             *
             * @description
             * Resets all the main state variables back to false and undefined.
             */
            self.reset = function() {
                self.selectedGroup = undefined;
                self.selectedUser = undefined;
                self.memberName = '';
                self.filteredGroupList = true;
                self.groupSearchString = '';
                self.userSearchString = '';
            }
        }
})();

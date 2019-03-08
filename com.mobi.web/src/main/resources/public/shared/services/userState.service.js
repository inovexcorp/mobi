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
     * @ngdoc service
     * @name shared.service:userStateService
     *
     * @description
     * `userStateService` is a service which contains various variables to hold the
     * state of the user management page and utility functions to update those variables.
     */
    function userStateService() {
        var self = this;

        /**
         * @ngdoc property
         * @name shared.service:userStateService#groupSearchString
         * @propertyOf shared.service:userStateService
         * @type {string}
         *
         * @description
         * `groupSearchString` holds a string to be used in filtering the
         * {@link groupsList.directive:groupsList groups list}.
         */
        self.groupSearchString = '';
        /**
         * @ngdoc property
         * @name shared.service:userStateService#userSearchString
         * @propertyOf shared.service:userStateService
         * @type {string}
         *
         * @description
         * `userSearchString` holds a string to be used in filtering the
         * {@link usersList.directive:usersList users list}.
         */
        self.userSearchString = '';
        /**
         * @ngdoc property
         * @name shared.service:userStateService#filteredGroupList
         * @propertyOf shared.service:userStateService
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
         * @name shared.service:userStateService#showGroups
         * @propertyOf shared.service:userStateService
         * @type {boolean}
         *
         * @description
         * `showGroups` holds a boolean indicating whether the
         * {@link groupsPage.directive:groupsPage groups page} should be shown.
         */
        self.showGroups = false;
        /**
         * @ngdoc property
         * @name shared.service:userStateService#showUsers
         * @propertyOf shared.service:userStateService
         * @type {boolean}
         *
         * @description
         * `showUsers` holds a boolean indicating whether the
         * {@link usersPage.directive:usersPage users page} should be shown.
         */
        self.showUsers = true;
        /**
         * @ngdoc property
         * @name shared.service:userStateService#showPermissions
         * @propertyOf shared.service:userStateService
         * @type {boolean}
         *
         * @description
         * `showPermissions` holds a boolean indicating whether the
         * {@link permissionsPage.directive:permissionsPage permissions page} should be shown.
         */
        self.showPermissions = false;
        /**
         * @ngdoc property
         * @name shared.service:userStateService#selectedGroup
         * @propertyOf shared.service:userStateService
         * @type {object}
         *
         * @description
         * `selectedGroup` holds the currently selected group object from the
         * {@link shared.service:userManagerService#groups groups list}.
         */
        self.selectedGroup = undefined;
        /**
         * @ngdoc property
         * @name shared.service:userStateService#selectedUser
         * @propertyOf shared.service:userStateService
         * @type {object}
         *
         * @description
         * `selectedUser` holds the currently selected user object from the
         * {@link shared.service:userManagerService#users users list}.
         */
        self.selectedUser = undefined;

        /**
         * @ngdoc method
         * @name shared.service:userStateService#reset
         * @methodOf shared.service:userStateService
         *
         * @description
         * Resets all the main state variables back to false and undefined.
         */
        self.reset = function() {
            self.selectedGroup = undefined;
            self.selectedUser = undefined;
            self.filteredGroupList = true;
            self.groupSearchString = '';
            self.userSearchString = '';
        }
    }

    angular.module('shared')
        .service('userStateService', userStateService);
})();

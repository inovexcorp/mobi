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
                self.filteredGroupList = true;
                self.groupSearchString = '';
                self.userSearchString = '';
            }
        }
})();

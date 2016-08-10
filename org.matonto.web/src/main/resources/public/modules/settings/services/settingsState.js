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
         * @name settingsState
         *
         * @description 
         * The `settingsState` module only provides the `settingsStateService` service which
         * contains various variables to hold the state of the settings page and utility 
         * functions to update those variables.
         */
        .module('settingsState', [])
        /**
         * @ngdoc service
         * @name settingsState.service:settingsStateService
         *
         * @description 
         * `settingsStateService` is a service which contains various variables to hold the 
         * state of the settings page and utility functions to update those variables.
         */
        .service('settingsStateService', settingsStateService);

        function settingsStateService() {
            var self = this;

            /**
             * @ngdoc property
             * @name settingsState.service:settingsStateService#showUserInfo
             * @propertyOf settingsState.service:settingsStateService
             * @type {boolean}
             *
             * @description 
             * `showUserInfo` holds a boolean indicating whether or not the 
             * {@link userInformationPage.directive:userInformationPage User Information Page} 
             * should be shown.
             */
            self.showUserInfo = true;
            /**
             * @ngdoc property
             * @name settingsState.service:settingsStateService#showSettings
             * @propertyOf settingsState.service:settingsStateService
             * @type {boolean}
             *
             * @description 
             * `showSettings` holds a boolean indicating whether or not the 
             * {@link settingsPage.directive:settingsPage Settings Page} 
             * should be shown.
             */
            self.showSettings = false;
            /**
             * @ngdoc property
             * @name settingsState.service:settingsStateService#showChangePassword
             * @propertyOf settingsState.service:settingsStateService
             * @type {boolean}
             *
             * @description 
             * `showChangePassword` holds a boolean indicating whether or not the 
             * {@link changePasswordPage.directive:changePasswordPage Change Password Page} 
             * should be shown.
             */
            self.showChangePassword = false;

            /**
             * @ngdoc method
             * @name settingsState.service:settingsStateService#reset
             * @methodOf settingsState.service:settingsStateService
             * 
             * @description 
             * Resets all the boolean variables back to false.
             */
            self.reset = function() {
                self.showUserInfo = false;
                self.showSettings = false;
                self.showChangePassword = false;
            }
        }
})();
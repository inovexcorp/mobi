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

    settingsManagerService.$inject = ['$window', '$cookies', 'prefixes'];

    /**
     * @ngdoc service
     * @name shared.service:settingsManagerService
     * @requires $window
     * @requires $cookies
     * @requires shared.service:prefixes
     *
     * @description 
     * `settingsManagerService` is a service that provides utlities for saving user settings
     * for the application. Currently they are saved as cookies and are not saved for 
     * individual users.
     */
    function settingsManagerService($window, $cookies, prefixes) {
        var self = this;
        var settings = {};
        var cookieName = 'mobi-settings';
        var defaultSettings = {
            treeDisplay: 'pretty',
            tooltipDisplay: '@id'
        }

        function initialize() {
            settings = angular.extend({}, defaultSettings, getSavedSettings());
        }

        function getSavedSettings() {
            return $cookies.getObject(cookieName) || {};
        }

        /**
         * @ngdoc method
         * @name getSettings
         * @methodOf shared.service:settingsManagerService
         * 
         * @description 
         * Returns a copy of the saved settings object.
         * 
         * @return {object} The saved settings object
         */
        self.getSettings = function() {
            return angular.copy(settings);
        }

        /**
         * @ngdoc method
         * @name setSettings
         * @methodOf shared.service:settingsManagerService
         *
         * @description 
         * Replaces the saved settings object and cookie with a new settings object.
         * 
         * @param {object} newSettings a settings object to replace the saved settings
         * @param {string} newSettings.treeDisplay the display setting for tree items
         * in the Ontology Editor
         * @param {string} newSettings.tooltipDisplay the display setting for the tooltips
         * in the Ontology Editor.
         */
        self.setSettings = function(newSettings) {
            $cookies.putObject(cookieName, newSettings, {expires: new $window.Date(3000, 1, 1)});
            settings = newSettings;
        }

        /**
         * @ngdoc method
         * @name getTreeDisplay
         * @methodOf shared.service:settingsManagerService
         * 
         * @description 
         * Returns the string setting value of the tree display in the Ontology Editor.
         * 
         * @return {string} The tree display setting value
         */
        self.getTreeDisplay = function() {
            return angular.copy(settings.treeDisplay);
        }

        /**
         * @ngdoc method
         * @name getTooltipDisplay
         * @methodOf shared.service:settingsManagerService
         * 
         * @description 
         * Returns the string setting value of the tooltip display in the Ontology Editor
         * 
         * @return {string} The tooltip display setting value
         */
        self.getTooltipDisplay = function() {
            return angular.copy(settings.tooltipDisplay);
        }

        initialize();
    }

    angular.module('shared')
        .service('settingsManagerService', settingsManagerService);
})();
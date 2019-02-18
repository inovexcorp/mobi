(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name settingsManager
         *
         * @description
         * The `settingsManager` module only provides the `settingsManagerService` which
         * provides utilities for saving user settings for the application.
         */
        .module('settingsManager', [])
        /**
         * @ngdoc service
         * @name settingsManager.service:settingsManagerService
         * @requires $window
         * @requires $cookies
         * @requires prefixes.service:prefixes
         *
         * @description 
         * `settingsManagerService` is a service that provides utlities for saving user settings
         * for the application. Currently they are saved as cookies and are not saved for 
         * individual users.
         */
        .service('settingsManagerService', settingsManagerService);

        settingsManagerService.$inject = ['$window', '$cookies', 'prefixes'];

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
             * @methodOf settingsManager.service:settingsManagerService
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
             * @methodOf settingsManager.service:settingsManagerService
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
             * @methodOf settingsManager.service:settingsManagerService
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
             * @methodOf settingsManager.service:settingsManagerService
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
})();
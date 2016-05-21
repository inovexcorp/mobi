(function() {
    'use strict';

    angular
        .module('settingsManager', [])
        .service('settingsManagerService', settingsManagerService);

        settingsManagerService.$inject = ['$window', '$cookies', 'prefixes'];

        function settingsManagerService($window, $cookies, prefixes) {
            var self = this;
            var settings = {};
            var cookieName = 'matonto-settings';
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

            self.getSettings = function() {
                return angular.copy(settings);
            }

            self.setSettings = function(newSettings) {
                $cookies.putObject(cookieName, newSettings, {expires: new $window.Date(3000, 1, 1)});
                settings = newSettings;
            }

            self.getTreeDisplay = function() {
                return angular.copy(settings.treeDisplay);
            }

            self.getTooltipDisplay = function() {
                return angular.copy(settings.tooltipDisplay);
            }

            initialize();
        }
})();
(function() {
    'use strict';

    angular
        .module('settingsManager', [])
        .service('settingsManagerService', settingsManagerService);

        settingsManagerService.$inject = ['$window', '$cookies', 'prefixes'];

        function settingsManagerService($window, $cookies, prefixes) {
            var self = this;
            var cookieName = 'matonto-settings';
            var defaultSettings = {
                treeDisplay: prefixes.rdfs + 'label',
                tooltipDisplay: '@id'
            }

            function initialize() {
                self.settings = angular.extend({}, defaultSettings, getSavedSettings());
            }

            function getSavedSettings() {
                return $cookies.getObject(cookieName) || {};
            }

            self.saveSettings = function(settings) {
                $cookies.putObject(cookieName, settings, {expires: new $window.Date(3000, 1, 1)});
            }

            self.getTreeDisplay = function() {
                return angular.copy(self.settings.treeDisplay);
            }

            self.getTooltipDisplay = function() {
                return angular.copy(self.settings.tooltipDisplay);
            }

            initialize();
        }
})();
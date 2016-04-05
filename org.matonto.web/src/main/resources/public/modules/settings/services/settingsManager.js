(function() {
    'use strict';

    angular
        .module('settingsManager', [])
        .service('settingsManagerService', settingsManagerService);

        settingsManagerService.$inject = ['$window', '$cookies'];

        function settingsManagerService($window, $cookies) {
            var self = this;
            var cookieName = 'matonto-settings';
            var defaultSettings = {
                treeDisplay: 'rdfs:label',
                tooltipDisplay: '@id'
            }

            function initialize() {
                self.settings = angular.extend({}, defaultSettings, getSavedSettings());
            }

            function getSavedSettings() {
                return $cookies.getObject(cookieName) ? $cookies.getObject(cookieName) : {};
            }

            self.getSettings = function() {
                return self.settings;
            }

            self.saveSettings = function(settings) {
                $cookies.putObject(cookieName, settings, {expires: new $window.Date(3000, 1, 1)});
            }

            self.getTreeDisplay = function() {
                return angular.copy(self.settings.treeDisplay);
            }

            initialize();
        }
})();
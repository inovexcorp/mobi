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
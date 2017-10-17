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
         * @name settingsTabset
         *
         * @description
         * The `settingsTabset` module only provides the `settingsTabset` directive
         * which creates the main {@link tabset.directive:tabset tabset} for the settings page.
         */
        .module('settingsTabset', [])
        /**
         * @ngdoc directive
         * @name settingsTabset.directive:settingsTabset
         * @scope
         * @restrict E
         *
         * @description
         * `settingsTabset` is a directive which creates a {@link tabset.directive:tabset tabset} with
         * {@link tab.directive:tab tabs} for different settings pertaining to the current user. The tabs
         * are {@link profileTab.directive:profileTab profileTab},
         * {@link passwordTab.directive:passwordTab passwordTab}, and the
         * {@link preferencesTab.directive:preferencesTab preferencesTab}. The directive is replaced by the
         * contents of its template.
         */
        .directive('settingsTabset', settingsTabset);

    function settingsTabset() {
        return {
            restrict: 'E',
            replace: true,
            controllerAs: 'dvm',
            scope: {},
            controller: function() {
                var dvm = this;
                dvm.tabs = {
                    profile: true,
                    group: false,
                    password: false,
                    preferences: false
                };
            },
            templateUrl: 'modules/settings/directives/settingsTabset/settingsTabset.html'
        }
    }
})();
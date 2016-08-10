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
         * @name settingsContainer
         *
         * @description 
         * The `settingsContainer` module only provides the `settingsContainer` directive which creates 
         * a section with transcluded content and a customizable header.
         */
        .module('settingsContainer', [])
        /**
         * @ngdoc directive
         * @name settingsContainer.directive:settingsContainer
         * @scope
         * @restrict E
         *
         * @description
         * `settingsContainer` is a directive that creates a section with transcluded content and a header. 
         * The main content for the overlay is transcluded so it can contain whatever is put between the 
         * opening and closing tags. However, it is expected that the content will be 
         * {@link customSetting.directive:customSetting customSetting} directives. The directive is replaced 
         * by the content of its template.
         *
         * @param {string} header the text to display in the section's header
         */
        .directive('settingsContainer', settingsContainer);

        function settingsContainer() {
            return {
                restrict: 'E',
                replace: true,
                transclude: true,
                scope: {
                    header: '='
                },
                templateUrl: 'modules/settings/directives/settingsContainer/settingsContainer.html'
            }
        }
})();

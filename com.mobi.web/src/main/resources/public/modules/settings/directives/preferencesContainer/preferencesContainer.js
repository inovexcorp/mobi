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
         * @name preferencesContainer
         *
         * @description
         * The `preferencesContainer` module only provides the `preferencesContainer` directive which creates
         * a section with transcluded content and a customizable header.
         */
        .module('preferencesContainer', [])
        /**
         * @ngdoc directive
         * @name preferencesContainer.directive:preferencesContainer
         * @scope
         * @restrict E
         *
         * @description
         * `preferencesContainer` is a directive that creates a section with transcluded content and a header.
         * The main content for the overlay is transcluded so it can contain whatever is put between the
         * opening and closing tags. However, it is expected that the content will be
         * {@link customPreference.directive:customPreference customPreference} directives. The directive is
         * replaced by the content of its template.
         *
         * @param {string} header the text to display in the section's header
         */
        .directive('preferencesContainer', preferencesContainer);

        function preferencesContainer() {
            return {
                restrict: 'E',
                replace: true,
                transclude: true,
                scope: {
                    header: '='
                },
                templateUrl: 'modules/settings/directives/preferencesContainer/preferencesContainer.html'
            }
        }
})();

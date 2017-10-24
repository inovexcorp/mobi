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
         * @name customLabel
         *
         * @description
         * The `customLabel` module only provides the `customLabel` directive which creates
         * a label element with transcluded content and optional muted text.
         */
        .module('customLabel', [])
        /**
         * @ngdoc directive
         * @name customLabel.directive:customLabel
         * @scope
         * @restrict E
         *
         * @description
         * `customLabel` is a directive which creates a label element with transcluded text and
         * optional musted text within angle brackets. It is meant to be used for labeling a field
         * that involves an IRI in the muted text. The label element will be styled with the Bootstrap
         * 'control-label' class.
         *
         * @param {string} [mutedText=''] text to be displayed as muted within angle brackets after the
         * transcluded content.
         */
        .directive('customLabel', customLabel);

        function customLabel() {
            return {
                restrict: 'E',
                transclude: true,
                replace: true,
                scope: {
                    mutedText: '<'
                },
                templateUrl: 'directives/customLabel/customLabel.html'
            }
        }
})();

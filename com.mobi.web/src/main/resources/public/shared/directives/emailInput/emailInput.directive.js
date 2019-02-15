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
         * @name emailInput
         *
         * @description
         * The `emailInput` module provides the `emailInput` directive, which creates a email input
         * field with a {@link customLabel.directive:customLabel customLabel} and several optional
         * custoization variables.
         */
        .module('emailInput', [])
        /**
         * @ngdoc directive
         * @name emailInput.directive:emailInput
         * @scope
         * @restrict E
         *
         * @description
         * `emailInput` is a directive that create an email input field with a
         * {@link customLabel.directive:customLabel customLabel}. The input field is bound to the
         * passed bindModel variable and has several optional customization variables. The directive
         * is replaced by the contents of its template.
         *
         * @param {string} bindModel The variable to bind the value of the input field to
         * @param {function} changeEvent A function to be called when the value of the
         * text input field changes
         * @param {string} [mutedText=''] The muted text to be displayed in the customLabel
         * @param {boolean} [required=false] whether or not the input should be required
         * @param {string} [inputName=''] the name to give the text input
         */
        .directive('emailInput', emailInput)
        /**
         * @ngdoc directive
         * @name emailInput.directive:emailIri
         * @restrict A
         *
         * @description
         * `emailIri` is a directive which formats the ngModel value, presumed to an email address, to
         * remove the string "mailto:" and thus be a valid email address. It also parses the ngModel
         * value to be preceded by the string "mailto:" and this be a valid IRI.
         */
        .directive('emailIri', emailIri);

        function emailIri() {
            return {
                restrict: 'A',
                require: 'ngModel',
                link: function(scope, element, attrs, ctrl) {
                    ctrl.$formatters.push(value => _.replace(value, 'mailto:', ''));
                    ctrl.$parsers.push(value => 'mailto:' + value);
                }
            }
        }

        function emailInput() {
            return {
                restrict: 'E',
                replace: true,
                scope: {
                    bindModel: '=ngModel',
                    changeEvent: '&',
                    mutedText: '<',
                    required: '<',
                    inputName: '<',
                    isInvalid: '<',
                    isValid: '<'
                },
                templateUrl: 'shared/directives/emailInput/emailInput.directive.html'
            }
        }
})();

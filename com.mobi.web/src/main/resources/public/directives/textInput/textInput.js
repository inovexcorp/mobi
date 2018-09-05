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
         * @name textInput
         *
         * @description
         * The `textInput` module only provides the `textInput` directive which creates
         * a text input field with a {@link customLabel.directive:customLabel customLabel}
         * and several optional customization variables.
         */
        .module('textInput', [])
        /**
         * @ngdoc directive
         * @name textInput.directive:textInput
         * @scope
         * @restrict E
         *
         * @description
         * `textInput` is a directive that creates a Bootstrap "form-group" div with a
         * text input element and a {@link customLabel.directive:customLabel customLabel}.
         * The text input is bound to the passed bindModel variable and has several
         * optional customization variables. The directive is replaced by the contents of
         * its template.
         *
         * @param {*} bindModel The variable to bind the value of the text input field to
         * @param {function} changeEvent A function to be called when the value of the
         * text input field changes
         * @param {string} [displayText=''] The text to be displayed in the customLabel
         * @param {string} [mutedText=''] The muted text to be displayed in the customLabel
         * @param {boolean} [required=false] whether or not the text input should be required
         * @param {string} [inputName=''] the name to give the text input
         */
        .directive('textInput', textInput);

        function textInput() {
            return {
                restrict: 'E',
                replace: true,
                scope: {
                    bindModel: '=ngModel',
                    changeEvent: '&',
                    displayText: '<',
                    mutedText: '<',
                    required: '<',
                    inputName: '<',
                    isInvalid: '<',
                    isValid: '<',
                    isFocusMe: '<?'
                },
                templateUrl: 'directives/textInput/textInput.html'
            }
        }
})();

/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
            templateUrl: 'shared/directives/textInput/textInput.directive.html'
        }
    }

    angular
        .module('shared')
        /**
         * @ngdoc directive
         * @name shared.directive:textInput
         * @scope
         * @restrict E
         *
         * @description
         * `textInput` is a directive that creates a Bootstrap "form-group" div with a text input element and a
         * {@link shared.directive:customLabel customLabel}. The `customLabel` uses the provided `displayText` and
         * `mutedText` for display. The text input is bound to the passed `bindModel` variable. It can also have a
         * custom on change function. The name of the input is configurable along with whether it is required. The input
         * can optionally be focused on rendering as well. The `isInvalid` and `isValid` parameters provide a way to
         * change the styling based on the validity of the input. The directive is replaced by the contents of
         * its template.
         *
         * @param {*} bindModel The variable to bind the value of the text input field to
         * @param {Function} changeEvent A function to be called when the value of the
         * text input field changes
         * @param {string} [displayText=''] The text to be displayed in the customLabel
         * @param {string} [mutedText=''] The muted text to be displayed in the customLabel
         * @param {boolean} [required=false] Whether the text input should be required
         * @param {string} [inputName=''] The name to give the text input
         * @param {boolean} [isInvalid=false] Whether the text input is invalid
         * @param {boolean} [isValid=false] Whether the text input is valid
         * @param {boolean} isFocusMe Whether the text input should be focused once rendered
         */
        .directive('textInput', textInput);
})();

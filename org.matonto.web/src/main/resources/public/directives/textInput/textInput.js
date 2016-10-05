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
         * @name textInput
         * @requires  customLabel
         *
         * @description 
         * The `textInput` module only provides the `textInput` directive which creates
         * a text input field with a customLabel and a custom on change function.
         */
        .module('textInput', ['customLabel'])
        /**
         * @ngdoc directive
         * @name textInput.directive:textInput
         * @scope
         * @restrict E
         *
         * @description 
         * `textInput` is a directive that creates a Bootstrap "form-group" div with a 
         * text input element and a customLabel. The text input is bound to the passed in
         * bindModel variable and can have a custom on change function.
         *
         * @param {*} bindModel The variable to bind the value of the text input field to
         * @param {function} changeEvent A function to be called when the value of the 
         * text input field changes
         * @param {string=''} displayText The text to be displayed in the customLabel
         * @param {string=''} mutedText The muted text to be displayed in the customLabel
         *
         * @usage
         * <!-- With defaults -->
         * <text-input ng-model="variableName" change-event="console.log('Change')"></text-input>
         *
         * <!-- With all params -->
         * <text-input ng-model="variableName" change-event="console.log('Change')" display-text="'Label text'" muted-text="'Muted text'"></text-input>
         */
        .directive('textInput', textInput);

        function textInput() {
            return {
                restrict: 'E',
                scope: {
                    bindModel: '=ngModel',
                    changeEvent: '&',
                    displayText: '<',
                    mutedText: '<',
                    required: '<',
                    name: '<'
                },
                templateUrl: 'directives/textInput/textInput.html'
            }
        }
})();

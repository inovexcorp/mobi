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
         * @name textArea
         *
         * @description
         * The `textArea` module only provides the `textArea` directive which creates
         * a textarea element with a customLabel and a custom on change function.
         */
        .module('textArea', [])
        /**
         * @ngdoc directive
         * @name textArea.directive:textArea
         * @scope
         * @restrict E
         *
         * @description
         * `textArea` is a directive which creates a Bootstrap "form-group" div with
         * a testarea element and a customLabel. The textarea is bound to the passed in
         * bindModel variable and can have a custom on change function.
         *
         * @param {*} bindModel The variable to bind the value of the textarea to
         * @param {function} changeEvent A function to be called when the value of the
         * textarea changes
         * @param {string=''} displayText The text to be displayed in the customLabel
         * @param {string=''} mutedText The muted text to be displayed in the customLabel
         */
        .directive('textArea', textArea);

        function textArea() {
            return {
                restrict: 'E',
                scope: {
                    bindModel: '=ngModel',
                    changeEvent: '&',
                    displayText: '<',
                    mutedText: '<',
                    required: '<',
                    textAreaName: '<',
                    isFocusMe: '<?'
                },
                templateUrl: 'directives/textArea/textArea.html'
            }
        }
})();

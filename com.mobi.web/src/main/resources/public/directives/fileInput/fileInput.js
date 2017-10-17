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
         * @name file-input
         *
         * @description 
         * The `fileInput` module only provides the `fileInput` directive which
         * adds ngModel functionality to the standard input element for files. 
         */
        .module('fileInput', [])
        /**
         * @ngdoc directive
         * @name file-input.directive:fileInput
         * @restrict E
         *
         * @description 
         * `fileInput` is a directive that creates a input element of type file
         * that supports ngModel. The file chosen using the directive is returned 
         * as an object.
         *
         * @usage
         * <file-input ng-model="someVariable"></file-input>
         */
        .directive('fileInput', fileInput);

    fileInput.$inject = ['$parse'];

        function fileInput($parse) {
            function link(scope, element, attrs) {
                var modelGet = $parse(attrs.ngModel),
                    modelSet = modelGet.assign,
                    onChange = $parse(attrs.onChange),
                    updateModel = function() {
                        scope.$apply(function() {
                            modelSet(scope, element[0].files[0]);
                            onChange(scope);
                        });
                    };
                element.bind('change', updateModel);
            }

            return {
                restrict: 'E',
                template: '<input type="file" />',
                replace: true,
                link: link
            };
        }
})();

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
         * @name mappingNameInput
         *
         * @description 
         * The `mappingNameInput` module provides the `mappingNameInput` directive, which creates
         * a text input for a mapping name, and the `uniqueName` directive used for testing whether
         * a mapping exists already with the entered mapping name.
         */
        .module('mappingNameInput', ['mappingManager'])
        /**
         * @ngdoc directive
         * @name mappingNameInput.directive:mappingNameInput
         * @scope
         * @restrict E
         *
         * @description 
         * `mappingNameInput` is a directive which creates a text input with validation for a mapping's
         * name and error messages for invalid inputs. The mapping name must be unique, can be required, 
         * and can be optionally set to active. Validation messages will only appear if the 
         * `mappingNameInput` is active. A event can optionally be called when the text input gains focus.
         * The directive is replaced by the contents of its template.
         *
         * @param {string} name the currently entered mapping name
         * @param {boolean} [required=true] whether or not the `mappingNameInput` should be required
         * @param {boolean} [isActive=true] whether or not the `mappingNameInput` is active
         * @param {function} [focusEvent=undefined] an event to call when the text input has focus
         */
        .directive('mappingNameInput', mappingNameInput)
        /**
         * @ngdoc directive
         * @name mappingNameInput.directive:uniqueName
         *
         * @description 
         * `uniqueName` is a directive which tests whether the ngModel value is in the list of previous
         * mapping names. It requires the parent element to have an ngModel. If the ngModel value
         * is in the previous mapping names list, it sets the uniqueName validity of the parent element 
         * to false.
         */
        .directive('uniqueName', uniqueName);

        uniqueName.$inject = ['$parse', 'mappingManagerService'];

        function uniqueName($parse, mappingManagerService) {
            return {
                require: 'ngModel',
                link: function(scope, el, attrs, ctrl) {
                    var previousMappings = mappingManagerService.previousMappingNames;
                    var getter = $parse(attrs.ngModel);
                    var value = getter(scope);
                    ctrl.$validators.uniqueName = function(modelValue, viewValue) {
                        if (ctrl.$isEmpty(modelValue)) {
                            return true;
                        }
                        return viewValue === value || previousMappings.indexOf(viewValue) < 0;
                    }
                }
            }
        }
        function mappingNameInput() {
            return {
                restrict: 'E',
                require: '^form',
                replace: true,
                controllerAs: 'dvm',
                scope: {
                    name: '=',
                    required: '=?',
                    isActive: '=?',
                    focusEvent: '&'
                },
                link: function(scope, el, attrs, form) {
                    scope.form = form;
                    scope.isActive = angular.isDefined(scope.isActive) ? scope.isActive : true;
                    scope.required = angular.isDefined(scope.required) ? scope.required : true;
                },
                controller: ['REGEX', function(REGEX) {
                    var dvm = this;
                    dvm.localNamePattern = REGEX.LOCALNAME;
                }],
                templateUrl: 'modules/mapper/directives/mappingNameInput/mappingNameInput.html'
            }
        }
})();

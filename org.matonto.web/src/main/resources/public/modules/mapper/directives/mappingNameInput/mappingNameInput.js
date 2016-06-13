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
        .module('mappingNameInput', ['mappingManager'])
        .directive('mappingNameInput', mappingNameInput)
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

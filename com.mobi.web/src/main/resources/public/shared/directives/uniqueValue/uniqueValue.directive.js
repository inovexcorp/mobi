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
(function () {
    'use strict';

    function uniqueValue() {
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function(scope, el, attrs, ctrl) {
                ctrl.$validators.uniqueValue = function(modelValue, viewValue) {
                    var value = modelValue || viewValue;
                    if (ctrl.$isEmpty(value)) {
                        return true;
                    }
                    return !_.includes(scope.$eval(attrs.uniqueValue), value);
                }
            }
        }
    }

    angular
        /**
         * @ngdoc overview
         * @name uniqueValue
         *
         * @description
         * The `uniqueValue` module only provides the `uniqueValue` directive which tests whether a value
         * is already used in the provided array.
         */
        .module('uniqueValue', [])
        /**
         * @ngdoc directive
         * @name uniqueValue.directive:uniqueValue
         * @restrict A
         *
         * @description
         * `uniqueValue` is a directive which tests whether the ngModel value is in the passed list of values.
         * It requires the parent element to have an ngModel. If the ngModel value is within the passed array,
         * it sets the uniqueValue validity of the parent element to false.
         */
        .directive('uniqueValue', uniqueValue);
})();

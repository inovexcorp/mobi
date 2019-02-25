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

    targetedSpinner.$inject = ['$compile', 'httpService'];

    /**
     * @ngdoc directive
     * @name shared.directive:targetedSpinner
     * @restrict A
     * @requires $compile
     * @requires httpService
     *
     * @description
     * `targetedSpinner` is a directive that injects a {@link shared.component:spinner spinner} into the parent element.
     * Can specify whether a matched in progress HTTP call should be canceled when the parent scope is destroyed.
     *
     * @param {string} targetedSpinner The string identifier used by the {@link shared.service:httpService httpService}
     * for the call that this spinner is associated with
     * @param {boolean} cancelOnDestroy Whether or not matched in progress HTTP calls should be canceled
     * when the parent scope is destroyed
     * @param {number} small Optionally, the pixel diameter for the spinner
     */
    function targetedSpinner($compile, httpService) {
        return {
            restrict: 'A',
            link: function(scope, el, attrs) {
                scope.cancelOnDestroy = 'cancelOnDestroy' in attrs;
                scope.diameter = attrs.diameter;
                scope.httpService = httpService;
                scope.id = scope.$eval(attrs.targetedSpinner);
                el.addClass('spinner-container');
                if (attrs.diameter) {
                    scope.diameter = scope.$eval(attrs.diameter);
                    el.append($compile('<spinner ng-if="httpService.isPending(id)" diameter="diameter"></spinner>')(scope));
                } else {
                    el.append($compile('<spinner ng-if="httpService.isPending(id)"></spinner>')(scope));
                }

                scope.$on('$destroy', () => {
                    if (scope.cancelOnDestroy) {
                        httpService.cancel(scope.id);
                    }
                });

                scope.$watch(attrs.targetedSpinner, newValue => {
                    scope.id = newValue;
                });
            }
        }
    }

    angular.module('shared')
        .directive('targetedSpinner', targetedSpinner);
})();

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
         * @name targetedSpinner
         *
         * @description
         * The `targetedSpinner` module only provides the `targetedSpinner` directive which provides a way to
         * inject a loading spinner into a particular element and tie it to a particular REST call.
         */
        .module('targetedSpinner', [])
        /**
         * @ngdoc directive
         * @name targetedSpinner.directive:targetedSpinner
         * @restrict A
         * @requires $compile
         * @requires httpService
         *
         * @description
         * `targetedSpinner` is a directive that injects a {@link spinner.directive:spinner spinner} into the
         * parent element. Can specify whether a matched in progress HTTP call should be
         * canceled when the parent scope is destroyed.
         *
         * @param {string} targetSpinner The string identifier used by the {@link httpService.service:httpService httpService}
         * for the call that this spinner is associated with
         * @param {boolean} cancelOnDestroy Whether or not matched in progress HTTP calls should be canceled
         * when the parent scope is destroyed
         */
        .directive('targetedSpinner', targetedSpinner);

        targetedSpinner.$inject = ['$compile', 'httpService'];

        function targetedSpinner($compile, httpService) {
            return {
                restrict: 'A',
                link: function(scope, el, attrs) {
                    scope.cancelOnDestroy = 'cancelOnDestroy' in attrs;
                    scope.httpService = httpService;
                    scope.id = scope.$eval(attrs.targetedSpinner);
                    el.addClass('spinner-container');
                    el.append($compile('<spinner ng-show="httpService.isPending(id)"></spinner>')(scope));

                    scope.$on('$destroy', () => {
                        if (scope.cancelOnDestroy) {
                            httpService.cancel(scope.id);
                        }
                    });

                    scope.$watch(attrs.targetedSpinner, (newValue, oldValue) => {
                        scope.id = newValue;
                    });
                }
            }
        }
})();

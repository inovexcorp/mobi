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
         * @name targetedSpinner
         *
         * @description
         * The `targetedSpinner` module provides the `targetedSpinnerService` factory and the
         * `targetedSpinner` directive which together provide a way to call a function when a user
         * clicks off of an element.
         */
        .module('targetedSpinner', [])
        /**
         * @ngdoc service
         * @name targetedSpinnerService.service:targetedSpinnerService
         * @requires $document
         *
         * @description
         * `targetedSpinnerService` is a service that attaches a click handler to the document that
         * will call the passed expression for the passed scope if there isn't already a handler attached
         * for that scope. When the scope is destroyed that click handler will be removed.
         *
         * @param {Function} $scope The scope to call the passed expression within
         * @param {*} expr The expression to evaluate when the document is clicked
         */
        .factory('targetedSpinnerService', targetedSpinnerService)
        /**
         * @ngdoc directive
         * @name targetedSpinner.directive:targetedSpinner
         * @restrict A
         * @requires targetedSpinnerService.service:targetedSpinnerService
         *
         * @description
         * `targetedSpinner` is a directive that creates a click handler for the parent element such
         * that the click event does not propogate and calls the
         * {@link targetedSpinnerService.service:targetedSpinnerService targetedSpinnerService}
         * attaching a click handler to the document to call the passed expression from the directive.
         */
        .directive('targetedSpinner', targetedSpinner);

        targetedSpinnerService.$inject = ['$rootScope'];

        function targetedSpinnerService($rootScope) {
          return function($scope, requestConfig) {
                // IMPORTANT! Tear down this tracker when the scope is destroyed.
                $scope.$on('$destroy', function() {
                    var tracker = _.find($rootScope.trackedHttpRequests, tr => _.isEqual(tr.requestConfig, requestConfig) && _.isEqual(tr.scope, $scope));
                    _.remove($rootScope.trackedHttpRequests, tracker);
                    if (_.has(tracker, 'canceller')) {
                        tracker.canceller.resolve();
                    }
                });

                var t = { scope: $scope, requestConfig };
                $rootScope.trackedHttpRequests.push(t);
                return t;
            };
        }

        targetedSpinner.$inject = ['targetedSpinnerService', '$compile'];

        function targetedSpinner(targetedSpinnerService, $compile) {
            return {
                restrict: 'A',
                link: function(scope, el, attrs) {
                    var config = scope.$eval(attrs.targetedSpinner);
                    if (_.get(config, 'method') && _.get(config, 'regex')) {
                        scope.showSpinner = false;
                        el.addClass('spinner-container');
                        el.append($compile('<div class="spinner" ng-show="showSpinner"><i class="fa fa-4x fa-spin fa-spinner"></i></div>')(scope));
                        targetedSpinnerService(scope, config);
                    }
                }
            };
        }
})();
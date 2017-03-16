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
         * The `targetedSpinner` module only provides the `targetedSpinner` directive which provides a way to
         * inject a loading spinner into a particular element and tie it to a particular REST call.
         */
        .module('targetedSpinner', [])
        /**
         * @ngdoc directive
         * @name targetedSpinner.directive:targetedSpinner
         * @restrict A
         * @requires targetedSpinnerService.service:targetedSpinnerService
         * @requires $compile
         * @requires $rootScope
         *
         * @description
         * `targetedSpinner` is a directive that injects loading spinner HTML into the parent element and
         * creates a tracker in the $rootScope for the parent scope and HTTP requests that match the passed
         * configuration. This tracker integrates with the `requestInterceptor` on the `app` module so that
         * HTTP requests that match the configuration only trigger the injected spinner for the parent scope
         * instead of the full screen spinner. When the parent scope is destroyed, the tracker can optionally
         * be removed and any in progress HTTP requests that match the tracker configuration are canceled.
         *
         * @param {Object} targetSpinner A configuration for the injected spinner
         * @param {boolean} targetSpinner.destroy Whether or not the created tracker should be remove when the
         * parent scope is destroyed
         * @param {Object} targetSpinner.requestConfig A configuration for matching HTTP calls
         * @param {string} targetSpinner.requestConfig.method A string representing a HTTP method that an HTTP
         * call must have to be matched to the parent scope's spinner
         * @param {string} targetSpinner.requestConfig.regex A regular expression within a string that an HTTP
         * call's URL must match to be matched to the parent scope's spinner
         */
        .directive('targetedSpinner', targetedSpinner);

        targetedSpinner.$inject = ['$compile', '$rootScope'];

        function targetedSpinner($compile, $rootScope) {
            return {
                restrict: 'A',
                link: function(scope, el, attrs) {
                    scope.cancelOnDestroy = !!attrs.cancelOnDestroy;
                    var requestConfig = getConfig(scope.$eval(attrs.targetedSpinner));
                    el.addClass('spinner-container');
                    el.append($compile('<div class="spinner" ng-show="showSpinner"><i class="fa fa-4x fa-spin fa-spinner"></i></div>')(scope));
                    setTracker();

                    scope.$watch(attrs.cancelOnDestroy, function(newValue) {
                        scope.cancelOnDestroy = !!newValue;
                    });
                    scope.$watch(attrs.targetedSpinner, function(newValue, oldValue) {
                        var oldRequestConfig = getConfig(oldValue);
                        var newRequestConfig = getConfig(newValue);
                        if (!_.isEqual(newRequestConfig, oldRequestConfig)) {
                            var oldTracker = _.find($rootScope.trackedHttpRequests, {requestConfig: oldRequestConfig});
                            if (oldTracker) {
                                _.remove(oldTracker.scopes, scope);
                                if (oldTracker.scopes.length === 0) {
                                    _.remove($rootScope.trackedHttpRequests, oldTracker);
                                }
                            }
                            requestConfig = newRequestConfig;
                            setTracker();
                        }
                    }, true);
                    scope.$on('$destroy', function() {
                        var tracker = _.find($rootScope.trackedHttpRequests, {requestConfig});
                        if (_.every(_.get(tracker, 'scopes', []), 'cancelOnDestroy')) {
                            if (_.has(tracker, 'canceller')) {
                                tracker.canceller.resolve();
                            }
                        }
                        _.remove(_.get(tracker, 'scopes'), scope);
                    });

                    function setTracker() {
                        var tracker = _.find($rootScope.trackedHttpRequests, {requestConfig});
                        if (!tracker) {
                            tracker = {requestConfig, inProgress: false, scopes: []};
                            $rootScope.trackedHttpRequests.push(tracker);
                        }
                        tracker.scopes.push(scope);
                        scope.showSpinner = tracker.inProgress;
                    }
                    function getConfig(obj) {
                        return _.pick(obj, ['method', 'url']);
                    }
                }
            };
        }
})();

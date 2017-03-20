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
         * @requires $compile
         * @requires $rootScope
         *
         * @description
         * `targetedSpinner` is a directive that injects a {@link spinner.directive:spinner spinner} into the
         * parent element and creates a tracker in the `$rootScope` for HTTP requests that match the passed
         * configuration if one does not already exist. Each tracker keeps track of which scopes are looking
         * for the specific configuration. This tracker integrates with the `requestInterceptor` on the `app`
         * module so that HTTP requests that match the configuration only trigger specific injected spinners
         * instead of the full screen spinner. Can specify whether a matched in progress HTTP call should be
         * canceled when the parent scope is destroyed, but this will only occur if all scopes watching for that
         * request specify it should be canceled. Can specify whether a matched in progress HTTP call should be
         * canceled when the passed configuration changes, but this will only occur if all scopes watching for
         * that request specify it should be canceled. Can specify whether a matched in progress HTTP call
         * should be canceled if another matching call is made, but this will only occur if all scopes watching
         * for that request specify it should be canceled.
         *
         * @param {Object} targetSpinner A configuration for matching HTTP calls
         * @param {string} targetSpinner.method A string representing an HTTP method that a call must have to
         * be linked to the parent scope's spinner
         * @param {string} targetSpinner.url A regular expression or a string that an HTTP call's URL must
         * match to be linked to the parent scope's spinner; can include query parameters
         * @param {boolean} cancelOnDestroy Whether or not matched in progress HTTP calls should be canceled
         * when the parent scope is destroyed
         * @param {boolean} cancelOnChange Whether or not matched in progress HTTP calls should be canceled
         * when the configuration for matching HTTP calls changes
         * @param {boolean} cancelOnNew Whether or not matched in progress HTTP calls should be canceled when
         * a new matching HTTP call is made
         */
        .directive('targetedSpinner', targetedSpinner);

        targetedSpinner.$inject = ['$compile', '$rootScope'];

        function targetedSpinner($compile, $rootScope) {
            return {
                restrict: 'A',
                link: function(scope, el, attrs) {
                    scope.cancelOnDestroy = 'cancelOnDestroy' in attrs;
                    scope.cancelOnChange = 'cancelOnChange' in attrs;
                    scope.cancelOnNew = 'cancelOnNew' in attrs;
                    var requestConfig = getConfig(scope.$eval(attrs.targetedSpinner));
                    el.addClass('spinner-container');
                    el.append($compile('<spinner ng-show="showSpinner"></spinner>')(scope));
                    setTracker();

                    scope.$watch(attrs.targetedSpinner, function(newValue, oldValue) {
                        var oldRequestConfig = getConfig(oldValue);
                        var newRequestConfig = getConfig(newValue);
                        if (!_.isEqual(newRequestConfig, oldRequestConfig)) {
                            var oldTracker = _.find($rootScope.trackedHttpRequests, {requestConfig: oldRequestConfig});
                            if (oldTracker) {
                                if (_.every(oldTracker.scopes, 'cancelOnChange') && _.has(oldTracker, 'canceller')) {
                                    oldTracker.canceller.resolve();
                                }
                                _.remove(oldTracker.scopes, scope);
                            }
                            requestConfig = newRequestConfig;
                            setTracker();
                        }
                    }, true);
                    scope.$on('$destroy', function() {
                        var tracker = _.find($rootScope.trackedHttpRequests, {requestConfig});
                        if (_.every(_.get(tracker, 'scopes', []), 'cancelOnDestroy') && _.has(tracker, 'canceller')) {
                            tracker.canceller.resolve();
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

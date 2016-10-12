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
        .module('clickAnywhereButHere', [])
        .factory('clickAnywhereButHereService', clickAnywhereButHereService)
        .directive('clickAnywhereButHere', clickAnywhereButHere);

        clickAnywhereButHere.$inject = ['$document'];

        function clickAnywhereButHereService($document) {
          var tracker = [];

          return function($scope, expr) {
                var i, t, len;
                for (i = 0, len = tracker.length; i < len; i++) {
                    t = tracker[i];
                    if(t.expr === expr && t.scope === $scope) {
                        return t;
                    }
                }
                var handler = function() {
                    $scope.$apply(expr);
                };

                $document.on('click', handler);

                // IMPORTANT! Tear down this event handler when the scope is destroyed.
                $scope.$on('$destroy', function() {
                    $document.off('click', handler);
                });

                t = { scope: $scope, expr: expr };
                tracker.push(t);
                return t;
            };
        }

        clickAnywhereButHere.$inject = ['clickAnywhereButHereService'];

        function clickAnywhereButHere(clickAnywhereButHereService) {
            return {
                restrict: 'A',
                link: function(scope, elem, attr, ctrl) {
                    var handler = function(e) {
                        e.stopPropagation();
                    };
                    elem.on('click', handler);

                    scope.$on('$destroy', function() {
                        elem.off('click', handler);
                    });

                    clickAnywhereButHereService(scope, attr.clickAnywhereButHere);
                }
            };
        }
})();
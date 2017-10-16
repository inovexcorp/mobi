/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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
         * @name newInstancePropertyOverlay
         *
         * @description
         * The `newInstancePropertyOverlay` module only provides the `newInstancePropertyOverlay` directive which creates
         * new instance property overlay.
         */
        .module('newInstancePropertyOverlay', [])
        /**
         * @ngdoc directive
         * @name newInstancePropertyOverlay.directive:newInstancePropertyOverlay
         * @scope
         * @restrict E
         * @requires $timeout
         * @requires util.service:utilService
         * @requires discoverState.service:discoverStateService
         *
         * @description
         * HTML contents for the new instance property overlay which provides the users with a dropdown list of the properties
         * available to add to the selected instance.
         */
        .directive('newInstancePropertyOverlay', newInstancePropertyOverlay);
        
        newInstancePropertyOverlay.$inject = ['$timeout', 'utilService', 'discoverStateService'];
        
        function newInstancePropertyOverlay($timeout, utilService, discoverStateService) {
            return {
                restrict: 'E',
                templateUrl: 'modules/discover/sub-modules/explore/directives/newInstancePropertyOverlay/newInstancePropertyOverlay.html',
                replace: true,
                scope: {
                    onCancel: '&',
                    onSubmit: '&',
                    getProperties: '&'
                },
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var ds = discoverStateService;
                    dvm.util = utilService;
                    dvm.newPropertyText = '';
                    
                    $timeout(function() {
                        document.querySelector('#auto-complete').focus();
                    }, 200);
                }
            }
        }
})();
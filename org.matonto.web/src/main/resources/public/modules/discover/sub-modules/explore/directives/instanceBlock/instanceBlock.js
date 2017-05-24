/*-
 * #%L
 * org.matonto.web
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
         * @name instanceBlock
         *
         * @description
         * The `instanceBlock` module only provides the `instanceBlock` directive which creates
         * the instance block.
         */
        .module('instanceBlock', [])
        /**
         * @ngdoc directive
         * @name instanceBlock.directive:instanceBlock
         * @scope
         * @restrict E
         * @requires $http
         * @requires discoverState.service:discoverStateService
         * @requires explore.service:exploreService
         * @requires util.service:utilService
         *
         * @description
         * HTML contents in the instance block.
         */
        .directive('instanceBlock', instanceBlock);
        
        instanceBlock.$inject = ['$http', 'discoverStateService', 'exploreService', 'utilService'];

        function instanceBlock($http, discoverStateService, exploreService, utilService) {
            return {
                restrict: 'E',
                templateUrl: 'modules/discover/sub-modules/explore/directives/instanceBlock/instanceBlock.html',
                replace: true,
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var es = exploreService;
                    var util = utilService;
                    dvm.ds = discoverStateService;
                    
                    dvm.getPage = function(direction) {
                        var url = (direction === 'next') ? dvm.ds.explore.instanceDetails.links.next : dvm.ds.explore.instanceDetails.links.prev;
                        $http.get(url)
                            .then(response => {
                                dvm.ds.explore.instanceDetails.data = [];
                                _.merge(dvm.ds.explore.instanceDetails, es.createPagedResultsObject(response));
                                if (direction === 'next') {
                                    dvm.ds.explore.instanceDetails.currentPage += 1;
                                } else {
                                    dvm.ds.explore.instanceDetails.currentPage -= 1;
                                }
                            }, response => {
                                util.createErrorToast(response.statusText);
                            });
                    }
                }
            }
        }
})();
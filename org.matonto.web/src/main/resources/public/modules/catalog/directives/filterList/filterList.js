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
         * @name filterList
         * @requires catalogManager
         *
         * @description
         * The `filterList` module only provides the `filterList` directive which
         * creates a series of divs for result list filters with uls for the filter
         * options.
         */
        .module('filterList', ['catalogManager'])
        /**
         * @ngdoc directive
         * @name filterList.directive:filterList
         * @scope
         * @restrict E
         * @requires catalogManager.catalogManagerService
         *
         * @description 
         * `filterList` is a directive that creates a series of divs for the result list 
         * filters defined in {@link catalogManager.service:catalogManagerService catalogManagerService}
         * with uls for the filter options. The directive is replaced with the content of 
         * the template. Each filter option is clickable and depending on the filter type, 
         * other options will be hidden.
         *
         * @usage
         * <filter-list></filter-list>
         */
        .directive('filterList', filterList);

        filterList.$inject = ['catalogManagerService'];

        function filterList(catalogManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.catalog = catalogManagerService;

                    dvm.isHidden = function(type, option) {
                        var visible = false;
                        if (type === 'Resources' && !_.every(dvm.catalog.filters[type], ['applied', false]) && !option.applied) {
                            visible = true;
                        }
                        return visible;
                    }
                    dvm.applyFilter = function(type, option) {
                        if (type === 'Resources') {
                            dvm.catalog.currentPage = 0;
                            _.forEach(dvm.catalog.filters[type], function(opt) {
                                if (!angular.equals(opt, option)) {
                                    opt.applied = false;                                    
                                }
                            });
                        }
                        option.applied = !option.applied;
                        dvm.catalog.getResources();
                    }
                },
                templateUrl: 'modules/catalog/directives/filterList/filterList.html'
            }
        }
})();

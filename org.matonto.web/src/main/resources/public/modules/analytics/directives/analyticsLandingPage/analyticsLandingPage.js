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
         * @name analyticsLandingPage
         *
         * @description
         * The `analyticsLandingPage` module only provides the `analyticsLandingPage` directive which creates
         * the analytics landing page within the analytics page.
         */
        .module('analyticsLandingPage', [])
        /**
         * @ngdoc directive
         * @name analyticsLandingPage.directive:analyticsLandingPage
         * @scope
         * @restrict E
         * @requires catalogManager.service:catalogManagerService
         * @requires prefixes.service:prefixes
         * @requires util.service:utilService
         *
         * @description
         * HTML contents in the landing page of the analytics page which provides the users with a link to create
         * new analytics.
         */
        .directive('analyticsLandingPage', analyticsLandingPage);
        
        analyticsLandingPage.$inject = ['catalogManagerService', 'prefixes', 'utilService'];

        function analyticsLandingPage(catalogManagerService, prefixes, utilService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/analytics/directives/analyticsLandingPage/analyticsLandingPage.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var cm = catalogManagerService;
                    dvm.showOverlay = false;
                    dvm.util = utilService;
                    var catalogId = cm.localCatalog['@id'];
                    dvm.records = [];
                    dvm.paging = {
                        current: 0,
                        links: {
                            next: '',
                            prev: ''
                        },
                        total: 0
                    };
                    dvm.config = {
                        limit: 50,
                        pageIndex: 0,
                        recordType: prefixes.analytic + 'AnalyticRecord',
                        searchText: '',
                        sortOption: {
                            asc: false,
                            field: prefixes.dcterms + 'modified'
                        }
                    };

                    dvm.getAnalyticRecords = function() {
                        cm.getRecords(catalogId, dvm.config)
                            .then(response => {
                                dvm.paging.current = 0;
                                setPagination(response);
                            }, dvm.util.createErrorToast);
                    }

                    dvm.getPage = function(direction) {
                        dvm.util.getResultsPage(dvm.paging.links[direction])
                            .then(response => {
                                dvm.paging.current = direction === 'next' ? dvm.paging.current + 1 : dvm.paging.current - 1;
                                setPagination(response);
                            }, dvm.util.createErrorToast);
                    }

                    function setPagination(response) {
                        dvm.records = response.data;
                        var headers = response.headers();
                        dvm.paging.total = _.get(headers, 'x-total-count', 0);
                        var links = dvm.util.parseLinks(_.get(headers, 'link', ''));
                        dvm.paging.links = {
                            next: _.get(links, 'next', ''),
                            prev: _.get(links, 'prev', '')
                        };
                    }

                    dvm.getAnalyticRecords();
                }
            }
        }
})();
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
         * @name sparqlResultBlock
         *
         * @description
         * The `sparqlResultBlock` module only provides the `sparqlResultBlock` directive which creates
         * a tabular view of the SPARQL query {@link sparqlManager.service:sparqlManagerService#data results}.
         */
        .module('sparqlResultBlock', [])
        /**
         * @ngdoc directive
         * @name sparqlResultBlock.directive:sparqlResultBlock
         * @scope
         * @restrict E
         * @requires sparqlManager.service:sparqlManagerService
         *
         * @description
         * `sparqlResultBlock` is a directive that creates a {@link block.directive:block block} with a
         * {@link sparqlResultTable.directive:sparqlResultTable table} the
         * {@link sparqlManager.service:sparqlManagerService#data results} of the latest SPARQL query,
         * {@link pagination.directive:pagination pagination} buttons for the results,
         * {@link pagingDetails.directive:pagingDetails details} about the current page of results, and a button
         * to {@link downloadQueryOverlay.directive:downloadQueryOverlay download} the full results. The directive
         * is replaced by the contents of its template.
         */
        .directive('sparqlResultBlock', sparqlResultBlock);

        sparqlResultBlock.$inject = ['sparqlManagerService'];

        function sparqlResultBlock(sparqlManagerService) {
            return {
                restrict: 'E',
                templateUrl: 'modules/discover/sub-modules/query/directives/sparqlResultBlock/sparqlResultBlock.html',
                replace: true,
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.sparql = sparqlManagerService;

                    dvm.getPage = function(direction) {
                        if (direction === 'next') {
                            dvm.sparql.currentPage += 1;
                            dvm.sparql.setResults(dvm.sparql.links.next);
                        } else {
                            dvm.sparql.currentPage -= 1;
                            dvm.sparql.setResults(dvm.sparql.links.prev);
                        }
                    }
                }
            }
        }
})();

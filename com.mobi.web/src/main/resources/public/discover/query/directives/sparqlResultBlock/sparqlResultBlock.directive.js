/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
         * a tabular view of the SPARQL query {@link shared.service:sparqlManagerService#data results}.
         */
        .module('sparqlResultBlock', [])
        /**
         * @ngdoc directive
         * @name sparqlResultBlock.directive:sparqlResultBlock
         * @scope
         * @restrict E
         * @requires shared.service:sparqlManagerService
         * @requires shared.service:modalService
         *
         * @description
         * `sparqlResultBlock` is a directive that creates a {@link shared.component:block block} with a
         * {@link sparqlResultTable.directive:sparqlResultTable table} the
         * {@link shared.service:sparqlManagerService#data results} of the latest SPARQL query,
         * {@link shared.directive:pagination pagination} buttons for the results,
         * {@link shared.directive:pagingDetails details} about the current page of results, and a button
         * to {@link downloadQueryOverlay.directive:downloadQueryOverlay download} the full results. The directive
         * is replaced by the contents of its template.
         */
        .directive('sparqlResultBlock', sparqlResultBlock);

        sparqlResultBlock.$inject = ['sparqlManagerService', 'modalService'];

        function sparqlResultBlock(sparqlManagerService, modalService) {
            return {
                restrict: 'E',
                templateUrl: 'discover/query/directives/sparqlResultBlock/sparqlResultBlock.directive.html',
                replace: true,
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.sparql = sparqlManagerService;

                    dvm.downloadQuery = function() {
                        modalService.openModal('downloadQueryOverlay', {}, undefined, 'sm');
                    }
                }
            }
        }
})();

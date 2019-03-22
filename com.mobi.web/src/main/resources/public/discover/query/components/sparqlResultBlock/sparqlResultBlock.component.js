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

    /**
     * @ngdoc component
     * @name query.component:sparqlResultBlock
     * @requires shared.service:sparqlManagerService
     * @requires shared.service:modalService
     *
     * @description
     * `sparqlResultBlock` is a component that creates a {@link shared.component:block block} with a
     * {@link discover.component:sparqlResultTable table} the
     * {@link shared.service:sparqlManagerService#data results} of the latest SPARQL query,
     * {@link shared.component:paging paging buttons and details} for the results, and a button to
     * {@link query.component:downloadQueryOverlay download} the full results.
     */
    const sparqlResultBlockComponent = {
        templateUrl: 'discover/query/components/sparqlResultBlock/sparqlResultBlock.component.html',
        bindings: {},
        controllerAs: 'dvm',
        controller: sparqlResultBlockComponentCtrl
    };

    sparqlResultBlockComponent.$inject = ['sparqlManagerService', 'modalService'];

    function sparqlResultBlockComponentCtrl(sparqlManagerService, modalService) {
        var dvm = this;
        dvm.sparql = sparqlManagerService;

        dvm.downloadQuery = function() {
            modalService.openModal('downloadQueryOverlay', {}, undefined, 'sm');
        }
        dvm.query = function(page) {
            dvm.sparql.currentPage = page;
            dvm.sparql.queryRdf();
        }
    }

    angular.module('query')
        .component('sparqlResultBlock', sparqlResultBlockComponent);
})();

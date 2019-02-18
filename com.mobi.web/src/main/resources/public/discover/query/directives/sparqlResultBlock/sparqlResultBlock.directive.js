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
         * @requires modal.service:modalService
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

(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name downloadQueryOverlay
         *
         * @description
         * The `downloadQueryOverlay` module only provides the `downloadQueryOverlay` component which creates content
         * for a modal to download the results of a SPARQL query.
         */
        .module('downloadQueryOverlay', [])
        /**
         * @ngdoc component
         * @name downloadQueryOverlay.component:downloadQueryOverlay
         * @requires sparqlManager.service:sparqlManagerService
         *
         * @description
         * `downloadQueryOverlay` is a component that creates content for a modal with a form to download the results
         * of a {@link sparqlManager.service:sparqlManagerService#queryString SPARQL query}. The form includes
         * a selector for the file type and the file name. Meant to be used in conjunction with the
         * {@link modalService.directive:modalService}.
         *
         * @param {Function} close A function that closes the modal
         * @param {Function} dismiss A function that dismisses the modal
         */
        .component('downloadQueryOverlay', {
            bindings: {
                close: '&',
                dismiss: '&'
            },
            controllerAs: 'dvm',
            controller: ['sparqlManagerService', DownloadQueryOverlayController],
            templateUrl: 'discover/query/directives/downloadQueryOverlay/downloadQueryOverlay.component.html'
        });

        function DownloadQueryOverlayController(sparqlManagerService) {
            var dvm = this;
            var sparql = sparqlManagerService;
            dvm.fileName = 'results';
            dvm.fileType = 'csv';

            dvm.download = function() {
                sparql.downloadResults(dvm.fileType, dvm.fileName);
                dvm.close();
            }
            dvm.cancel = function() {
                dvm.dismiss();
            }
        }
})();

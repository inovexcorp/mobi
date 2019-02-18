(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name ontologyDownloadOverlay
         *
         * @description
         * The `ontologyDownloadOverlay` module only provides the `ontologyDownloadOverlay` directive which creates content
         * for a modal to download an ontology.
         */
        .module('ontologyDownloadOverlay', [])
        /**
         * @ngdoc directive
         * @name ontologyDownloadOverlay.directive:ontologyDownloadOverlay
         * @scope
         * @restrict E
         * @requires ontologyState.service:ontologyStateService
         * @requires ontologyManager.service:ontologyManagerService
         *
         * @description
         * `ontologyDownloadOverlay` is a directive that creates content for a modal that downloads the current
         * {@link ontologyState.service:ontologyStateService selected ontology} as an RDF file. The form in the modal
         * contains a {@link serializationSelect.directive:serializationSelect} and text input for the file name. Meant
         * to be used in conjunction with the {@link modalService.directive:modalService}.
         *
         * @param {Function} close A function that closes the modal
         * @param {Function} dismiss A function that dismisses the modal
         */
        .directive('ontologyDownloadOverlay', ontologyDownloadOverlay);

        ontologyDownloadOverlay.$inject = ['$q', '$filter', 'REGEX', 'ontologyStateService', 'ontologyManagerService'];

        function ontologyDownloadOverlay($q, $filter, REGEX, ontologyStateService, ontologyManagerService) {
            return {
                restrict: 'E',
                templateUrl: 'ontology-editor/directives/ontologyDownloadOverlay/ontologyDownloadOverlay.directive.html',
                scope: {
                    close: '&',
                    dismiss: '&'
                },
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    var om = ontologyManagerService;

                    dvm.fileNamePattern = REGEX.FILENAME;
                    dvm.os = ontologyStateService;
                    dvm.fileName = $filter('splitIRI')(dvm.os.listItem.ontologyId).end;

                    dvm.download = function() {
                        om.downloadOntology(dvm.os.listItem.ontologyRecord.recordId, dvm.os.listItem.ontologyRecord.branchId, dvm.os.listItem.ontologyRecord.commitId, dvm.serialization, dvm.fileName);
                        $scope.close();
                    }
                    dvm.cancel = function() {
                        $scope.dismiss();
                    }
                }]
            }
        }
})();

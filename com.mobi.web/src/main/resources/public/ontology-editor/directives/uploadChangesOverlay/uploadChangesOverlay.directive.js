(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name uploadChangesOverlay
         *
         * @description
         * The `uploadChangesOverlay` module only provides the `uploadChangesOverlay` directive which creates content
         * for a modal to upload a file of changes to an ontology.
         */
        .module('uploadChangesOverlay', [])
        /**
         * @ngdoc directive
         * @name uploadChangesOverlay.directive:uploadChangesOverlay
         * @scope
         * @restrict E
         * @requires ontologyState.service:ontologyStateService
         *
         * @description
         * `uploadChangesOverlay` is a directive that creates content for a modal that uploads an RDF file of an updated
         * version of the current {@link ontologyState.service:ontologyStateService selected ontology} to be compared
         * and the differences added to the InProgressCommit. The form in the modal contains
         * {@link fileInput.directive:fileInput} that accepts an RDF file. Meant to be used in conjunction with the
         * {@link modalService.directive:modalService}.
         *
         * @param {Function} close A function that closes the modal
         * @param {Function} dismiss A function that dismisses the modal
         */
        .directive('uploadChangesOverlay', uploadChangesOverlay);

        uploadChangesOverlay.$inject = ['ontologyStateService'];

        function uploadChangesOverlay(ontologyStateService) {
            return {
                restrict: 'E',
                templateUrl: 'ontology-editor/directives/uploadChangesOverlay/uploadChangesOverlay.directive.html',
                scope: {
                    close: '&',
                    dismiss: '&'
                },
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    dvm.error = '';
                    dvm.file = undefined;
                    dvm.fileName = 'No file selected';
                    dvm.os = ontologyStateService;

                    dvm.update = function() {
                        dvm.fileName = dvm.file.name;
                    }
                    dvm.submit = function() {
                        if (dvm.os.hasInProgressCommit()) {
                            dvm.error = 'Unable to upload changes. Please either commit your current changes or discard them and try again.';
                        } else {
                            var ontRecord = dvm.os.listItem.ontologyRecord;
                            dvm.os.uploadChanges(dvm.file, ontRecord.recordId, ontRecord.branchId, ontRecord.commitId).then(() => {
                                dvm.os.getActivePage().active = false;
                                dvm.os.listItem.editorTabStates.savedChanges.active = true;
                                $scope.close();
                            }, errorMessage => dvm.error = errorMessage);
                        }
                    }
                    dvm.cancel = function() {
                        $scope.dismiss();
                    }
                }]
            };
        }
})();

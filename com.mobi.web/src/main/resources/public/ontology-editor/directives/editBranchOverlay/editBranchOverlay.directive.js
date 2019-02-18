(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name editBranchOverlay
         *
         * @description
         * The `editBranchOverlay` module only provides the `editBranchOverlay` directive which creates content
         * for a modal to edit an branch on an ontology.
         */
        .module('editBranchOverlay', [])
        /**
         * @ngdoc directive
         * @name editBranchOverlay.directive:editBranchOverlay
         * @scope
         * @restrict E
         * @requires catalogManager.service:catalogManagerService
         * @requires ontologyState.service:ontologyStateService
         * @requires util.service:utilService
         * @requires prefixes.service:prefixes
         *
         * @description
         * `editBranchOverlay` is a directive that creates content for a modal that edits the provided branch in the
         * current {@link ontologyState.service:ontologyStateService selected ontology}. The form in the modal contains
         * a {@link textInput.directive:textInput} for the branch title and a {@link textArea.directive:textArea} for
         * the branch description. Meant to be used in conjunction with the {@link modalService.directive:modalService}.
         *
         * @param {Object} resolve Information provided to the modal
         * @param {Object} resolve.branch The JSON-LD of the branch to be edited
         * @param {Function} close A function that closes the modal
         * @param {Function} dismiss A function that dismisses the modal
         */
        .directive('editBranchOverlay', editBranchOverlay);

        editBranchOverlay.$inject = ['catalogManagerService', 'ontologyStateService', 'prefixes', 'utilService'];

        function editBranchOverlay(catalogManagerService, ontologyStateService, prefixes, utilService) {
            return {
                restrict: 'E',
                templateUrl: 'ontology-editor/directives/editBranchOverlay/editBranchOverlay.directive.html',
                scope: {
                    resolve: '<',
                    close: '&',
                    dismiss: '&'
                },
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    var cm = catalogManagerService;
                    var os = ontologyStateService;
                    var util = utilService;
                    var catalogId = _.get(cm.localCatalog, '@id', '');

                    dvm.error = '';
                    dvm.branchTitle = util.getDctermsValue($scope.resolve.branch, 'title');
                    dvm.branchDescription = util.getDctermsValue($scope.resolve.branch, 'description');

                    dvm.edit = function() {
                        util.updateDctermsValue($scope.resolve.branch, 'title', dvm.branchTitle);
                        if (dvm.branchDescription === '') {
                            _.unset($scope.resolve.branch, prefixes.dcterms + 'description');
                        } else {
                            util.updateDctermsValue($scope.resolve.branch, 'description', dvm.branchDescription);
                        }
                        cm.updateRecordBranch($scope.resolve.branch['@id'], os.listItem.ontologyRecord.recordId, catalogId, $scope.resolve.branch)
                            .then(() => {
                                $scope.close();
                            }, errorMessage => dvm.error = errorMessage);
                    }
                    dvm.cancel = function() {
                        $scope.dismiss();
                    }
                }]
            }
        }
})();

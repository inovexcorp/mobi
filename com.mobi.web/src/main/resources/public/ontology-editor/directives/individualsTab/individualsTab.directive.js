(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name individualsTab
         *
         * @description
         * The `individualsTab` module only provides the `individualsTab` directive which creates a page for viewing the
         * individuals in an ontology.
         */
        .module('individualsTab', [])
        /**
         * @ngdoc directive
         * @name individualsTab.directive:individualsTab
         * @scope
         * @restrict E
         * @requires ontologyState.service:ontologyStateService
         * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
         * @requires modal.service:modalService
         *
         * @description
         * `individualsTab` is a directive that creates a page containing the
         * {@link individualHierarchyBlock.directive:individualHierarchyBlock} of the current
         * {@link ontologyState.service:ontologyStateService selected ontology} and information about a selected
         * individual from that list. The selected individual display includes a
         * {@link selectedDetails.directive:selectedDetails}, a button to delete the individual, a
         * {@link datatypePropertyBlock.directive:datatypePropertyBlock}, a
         * {@link objectPropertyBlock.directive:objectPropertyBlock}, and a {@link usagesBlock.directive:usagesBlock}.
         * The directive houses the method for opening a modal for deleting individuals. The directive is replaced by
         * the contents of its template.
         */
        .directive('individualsTab', individualsTab);

        individualsTab.$inject = ['ontologyStateService', 'ontologyUtilsManagerService', 'modalService']

        function individualsTab(ontologyStateService, ontologyUtilsManagerService, modalService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'ontology-editor/directives/individualsTab/individualsTab.directive.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var ontoUtils = ontologyUtilsManagerService;
                    dvm.os = ontologyStateService;

                    dvm.showDeleteConfirmation = function() {
                        modalService.openConfirmModal('<p>Are you sure that you want to delete <strong>' + dvm.os.listItem.selected['@id'] + '</strong>?</p>', ontoUtils.deleteIndividual);
                    }
                }
            }
        }
})();

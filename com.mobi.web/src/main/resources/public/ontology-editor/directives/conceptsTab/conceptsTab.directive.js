(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name conceptsTab
         *
         * @description
         * The `conceptsTab` module only provides the `conceptsTab` directive which creates a page for viewing the
         * concepts in an ontology/vocabulary.
         */
        .module('conceptsTab', [])
        /**
         * @ngdoc directive
         * @name conceptsTab.directive:conceptsTab
         * @scope
         * @restrict E
         * @requires ontologyManager.service:ontologyManagerService
         * @requires ontologyState.service:ontologyStateService
         * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
         * @requires propertyManager.service:propertyManagerService
         * @requires modal.service:modalService
         *
         * @description
         * `conceptsTab` is a directive that creates a page containing the
         * {@link conceptHierarchyBlock.directive:conceptHierarchyBlock} of the current
         * {@link ontologyState.service:ontologyStateService selected ontology/vocabulary} and information about a
         * selected concept from that list. The selected concept display includes a
         * {@link selectedDetails.directive:selectedDetails}, a button to delete the concept, an
         * {@link annotationBlock.directive:annotationBlock}, a
         * {@link relationshipsBlock.directive:relationshipsBlock}, and a {@link usagesBlock.directive:usagesBlock}.
         * The directive houses the method for opening a modal for deleting concepts. The directive is replaced by the
         * contents of its template.
         */
        .directive('conceptsTab', conceptsTab);

        conceptsTab.$inject = ['ontologyManagerService', 'ontologyStateService', 'ontologyUtilsManagerService', 'propertyManagerService', 'modalService'];

        function conceptsTab(ontologyManagerService, ontologyStateService, ontologyUtilsManagerService, propertyManagerService, modalService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'ontology-editor/directives/conceptsTab/conceptsTab.directive.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var pm = propertyManagerService;
                    var ontoUtils = ontologyUtilsManagerService;
                    dvm.om = ontologyManagerService;
                    dvm.os = ontologyStateService;

                    var schemeRelationships = _.filter(pm.conceptSchemeRelationshipList, iri => _.includes(dvm.os.listItem.iriList, iri));
                    dvm.relationshipList = _.concat(dvm.os.listItem.derivedSemanticRelations, schemeRelationships);

                    dvm.showDeleteConfirmation = function() {
                        modalService.openConfirmModal('<p>Are you sure that you want to delete <strong>' + dvm.os.listItem.selected['@id'] + '</strong>?</p>', ontoUtils.deleteConcept);
                    }
                }
            }
        }
})();

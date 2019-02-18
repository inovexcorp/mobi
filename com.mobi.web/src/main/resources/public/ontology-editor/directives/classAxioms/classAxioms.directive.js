(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name classAxioms
         *
         * @description
         * The `classAxioms` module only provides the `classAxioms` directive which creates a
         * list of the axioms on a class.
         */
        .module('classAxioms', [])
        /**
         * @ngdoc directive
         * @name classAxioms.directive:classAxioms
         * @scope
         * @restrict E
         * @requires ontologyState.service:ontologyStateService
         * @requires propertyManager.service:propertyManagerService
         * @requires prefixes.service:prefixes
         * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
         * @requires ontologyManager.service:ontologyManagerService
         * @requires modal.service:modalService
         *
         * @description
         * `classAxioms` is a directive that creates a list of
         * {@link propertyValues.directive:propertyValues} of the axioms on the
         * {@link ontologyState.service:ontologyStateService selected class}.
         * The directive houses the methods for opening the modal for removing class axioms. The
         * directive is replaced by the contents of its template.
         */
        .directive('classAxioms', classAxioms);

        classAxioms.$inject = ['ontologyStateService', 'propertyManagerService', 'prefixes', 'ontologyUtilsManagerService', 'ontologyManagerService', 'modalService'];

        function classAxioms(ontologyStateService, propertyManagerService, prefixes, ontologyUtilsManagerService, ontologyManagerService, modalService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'ontology-editor/directives/classAxioms/classAxioms.directive.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var om = ontologyManagerService;
                    dvm.os = ontologyStateService;
                    dvm.pm = propertyManagerService;
                    dvm.ontoUtils = ontologyUtilsManagerService;

                    dvm.getAxioms = function() {
                        return _.map(dvm.pm.classAxiomList, 'iri');
                    }
                    dvm.openRemoveOverlay = function(key, index) {
                        dvm.key = key;
                        modalService.openConfirmModal(dvm.ontoUtils.getRemovePropOverlayMessage(key, index), () => {
                            dvm.ontoUtils.removeProperty(key, index).then(dvm.removeFromHierarchy);
                        });
                    }
                    dvm.removeFromHierarchy = function(axiomObject) {
                        if (prefixes.rdfs + 'subClassOf' === dvm.key && !om.isBlankNodeId(axiomObject['@id'])) {
                            dvm.os.deleteEntityFromParentInHierarchy(dvm.os.listItem.classes.hierarchy, dvm.os.listItem.selected['@id'], axiomObject['@id'], dvm.os.listItem.classes.index);
                            dvm.os.listItem.classes.flat = dvm.os.flattenHierarchy(dvm.os.listItem.classes.hierarchy, dvm.os.listItem.ontologyRecord.recordId);
                            dvm.os.listItem.individualsParentPath = dvm.os.getIndividualsParentPath(dvm.os.listItem);
                            dvm.os.listItem.individuals.flat = dvm.os.createFlatIndividualTree(dvm.os.listItem);
                            dvm.os.setVocabularyStuff();
                        }
                    }
                }
            }
        }
})();

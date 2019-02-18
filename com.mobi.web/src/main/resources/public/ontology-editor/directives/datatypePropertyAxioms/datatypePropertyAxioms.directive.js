(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name datatypePropertyAxioms
         *
         * @description
         * The `datatypePropertyAxioms` module only provides the `datatypePropertyAxioms` directive which creates a
         * list of the axioms on a data property.
         */
        .module('datatypePropertyAxioms', [])
        /**
         * @ngdoc directive
         * @name datatypePropertyAxioms.directive:datatypePropertyAxioms
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
         * `datatypePropertyAxioms` is a directive that creates a list of
         * {@link propertyValues.directive:propertyValues} of the axioms on the
         * {@link ontologyState.service:ontologyStateService selected data property}.
         * The directive houses the methods for opening the modal for removing property axioms. The
         * directive is replaced by the contents of its template.
         */
        .directive('datatypePropertyAxioms', datatypePropertyAxioms);

        datatypePropertyAxioms.$inject = ['ontologyStateService', 'propertyManagerService', 'prefixes', 'ontologyUtilsManagerService', 'ontologyManagerService', 'modalService'];

        function datatypePropertyAxioms(ontologyStateService, propertyManagerService, prefixes, ontologyUtilsManagerService, ontologyManagerService, modalService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'ontology-editor/directives/datatypePropertyAxioms/datatypePropertyAxioms.directive.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var om = ontologyManagerService;
                    dvm.os = ontologyStateService;
                    dvm.pm = propertyManagerService;
                    dvm.ontoUtils = ontologyUtilsManagerService;

                    dvm.getAxioms = function() {
                        return _.map(dvm.pm.datatypeAxiomList, 'iri');
                    }
                    dvm.openRemoveOverlay = function(key, index) {
                        dvm.key = key;
                        modalService.openConfirmModal(dvm.ontoUtils.getRemovePropOverlayMessage(key, index), () => {
                            dvm.ontoUtils.removeProperty(key, index).then(dvm.removeFromHierarchy);
                        });
                    }
                    dvm.removeFromHierarchy = function(axiomObject) {
                        if (prefixes.rdfs + 'subPropertyOf' === dvm.key && !om.isBlankNodeId(axiomObject['@id'])) {
                            dvm.os.deleteEntityFromParentInHierarchy(dvm.os.listItem.dataProperties.hierarchy, dvm.os.listItem.selected['@id'], axiomObject['@id'], dvm.os.listItem.dataProperties.index);
                            dvm.os.listItem.dataProperties.flat = dvm.os.flattenHierarchy(dvm.os.listItem.dataProperties.hierarchy, dvm.os.listItem.ontologyRecord.recordId);
                        }
                    }
                }
            }
        }
})();

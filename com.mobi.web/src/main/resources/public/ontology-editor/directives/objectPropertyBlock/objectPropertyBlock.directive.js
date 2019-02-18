(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name objectPropertyBlock
         *
         * @description
         * The `objectPropertyBlock` module only provides the `objectPropertyBlock` directive which creates a
         * section for displaying the object properties on an individual.
         */
        .module('objectPropertyBlock', [])
        /**
         * @ngdoc directive
         * @name objectPropertyBlock.directive:objectPropertyBlock
         * @scope
         * @restrict E
         * @requires ontologyState.service:ontologyStateService
         * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
         * @requires modal.service:modalService
         *
         * @description
         * `objectPropertyBlock` is a directive that creates a section that displays the object properties on the
         * {@link ontologyState.service:ontologyStateService selected individual} using
         * {@link propertyValues.directive:propertyValues}. The section header contains a button for adding an object
         * property. The directive houses the methods for opening the modal for
         * {@link objectPropertyOverlay.directive:objectPropertyOverlay adding} and removing object property values.
         * The directive is replaced by the contents of its template.
         */
        .directive('objectPropertyBlock', objectPropertyBlock);

        objectPropertyBlock.$inject = ['ontologyStateService', 'ontologyUtilsManagerService', 'modalService'];

        function objectPropertyBlock(ontologyStateService, ontologyUtilsManagerService, modalService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'ontology-editor/directives/objectPropertyBlock/objectPropertyBlock.directive.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.os = ontologyStateService;
                    dvm.ontoUtils = ontologyUtilsManagerService;
                    dvm.objectProperties = _.keys(dvm.os.listItem.objectProperties.iris);

                    dvm.openAddObjectPropOverlay = function() {
                        dvm.os.editingProperty = false;
                        dvm.os.propertySelect = undefined;
                        dvm.os.propertyValue = '';
                        dvm.os.propertyIndex = 0;
                        modalService.openModal('objectPropertyOverlay');
                    }
                    dvm.showRemovePropertyOverlay = function(key, index) {
                        dvm.key = key;
                        modalService.openConfirmModal(dvm.ontoUtils.getRemovePropOverlayMessage(key, index), () => {
                            dvm.ontoUtils.removeProperty(key, index).then(dvm.removeObjectProperty);
                        });
                    }
                    dvm.removeObjectProperty = function(axiomObject) {
                        var types = dvm.os.listItem.selected['@type'];
                        if (dvm.ontoUtils.containsDerivedConcept(types) || dvm.ontoUtils.containsDerivedConceptScheme(types)) {
                            dvm.ontoUtils.removeFromVocabularyHierarchies(dvm.key, axiomObject);
                        }
                    }
                }
            }
        }
})();

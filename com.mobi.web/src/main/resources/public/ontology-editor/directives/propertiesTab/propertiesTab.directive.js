(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name propertiesTab
         *
         * @description
         * The `propertiesTab` module only provides the `propertiesTab` directive which creates a page for viewing the
         * properties in an ontology.
         */
        .module('propertiesTab', [])
        /**
         * @ngdoc directive
         * @name propertiesTab.directive:propertiesTab
         * @scope
         * @restrict E
         * @requires ontologyManager.service:ontologyManagerService
         * @requires ontologyState.service:ontologyStateService
         * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
         * @requires modal.service:modalService
         *
         * @description
         * `propertiesTab` is a directive that creates a page containing the
         * {@link propertyHierarchyBlock.directive:propertyHierarchyBlock} of the current
         * {@link ontologyState.service:ontologyStateService selected ontology} and information about a selected
         * property from that list. The selected property display includes a
         * {@link selectedDetails.directive:selectedDetails}, a button to delete the property, an
         * {@link annotationBlock.directive:annotationBlock}, an {@link axiomBlock.directive:axiomBlock}, a
         * {@link characteristicsRow.directive:characteristicsRow}, and a {@link usagesBlock.directive:usagesBlock}.
         * The directive houses the method for opening a modal for deleting propertyes. The directive is replaced by the
         * contents of its template.
         */
        .directive('propertiesTab', propertiesTab);

        propertiesTab.$inject = ['ontologyManagerService', 'ontologyStateService', 'ontologyUtilsManagerService', 'modalService'];

        function propertiesTab(ontologyManagerService, ontologyStateService, ontologyUtilsManagerService, modalService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'ontology-editor/directives/propertiesTab/propertiesTab.directive.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var ontoUtils = ontologyUtilsManagerService;
                    dvm.om = ontologyManagerService;
                    dvm.os = ontologyStateService;

                    dvm.showDeleteConfirmation = function() {
                        modalService.openConfirmModal('<p>Are you sure that you want to delete <strong>' + dvm.os.listItem.selected['@id'] + '</strong>?</p>', dvm.deleteProperty);
                    }
                    dvm.deleteProperty = function() {
                        if (dvm.om.isObjectProperty(dvm.os.listItem.selected)) {
                            ontoUtils.deleteObjectProperty();
                        } else if (dvm.om.isDataTypeProperty(dvm.os.listItem.selected)) {
                            ontoUtils.deleteDataTypeProperty();
                        } else if (dvm.om.isAnnotation(dvm.os.listItem.selected)) {
                            ontoUtils.deleteAnnotationProperty();
                        }
                    }
                }
            }
        }
})();

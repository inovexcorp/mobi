(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name annotationBlock
         *
         * @description
         * The `annotationBlock` module only provides the `annotationBlock` directive which creates a section for
         * displaying the annotations on an entity.
         */
        .module('annotationBlock', [])
        /**
         * @ngdoc directive
         * @name annotationBlock.directive:annotationBlock
         * @scope
         * @restrict E
         * @requires ontologyState.service:ontologyStateService
         * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
         * @requires modal.service:modalService
         *
         * @description
         * `annotationBlock` is a directive that creates a section that displays the annotations on the
         * {@link ontologyState.service:ontologyStateService selected entity} using
         * {@link propertyValues.directive:propertyValues}. The section header contains a button for adding an
         * annotation. The directive houses the methods for opening the modal for
         * {@link annotationOverlay.directive:annotationOverlay editing, adding}, and removing annotations. The
         * directive is replaced by the contents of its template.
         */
        .directive('annotationBlock', annotationBlock);

        annotationBlock.$inject = ['ontologyStateService', 'ontologyUtilsManagerService', 'modalService'];

        function annotationBlock(ontologyStateService, ontologyUtilsManagerService, modalService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'ontology-editor/directives/annotationBlock/annotationBlock.directive.html',
                scope: {},
                bindToController: {
                    highlightIris: '<',
                    highlightText: '<'
                },
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.os = ontologyStateService;
                    dvm.ontoUtils = ontologyUtilsManagerService;
                    dvm.annotations = _.keys(dvm.os.listItem.annotations.iris);

                    dvm.openAddOverlay = function() {
                        dvm.os.editingAnnotation = false;
                        dvm.os.annotationSelect = undefined;
                        dvm.os.annotationValue = '';
                        dvm.os.annotationType = undefined;
                        dvm.os.annotationIndex = 0;
                        dvm.os.annotationLanguage = 'en';
                        modalService.openModal('annotationOverlay');
                    }
                    dvm.openRemoveOverlay = function(key, index) {
                        modalService.openConfirmModal(dvm.ontoUtils.getRemovePropOverlayMessage(key, index), () => {
                            dvm.ontoUtils.removeProperty(key, index);
                        });
                    }
                    dvm.editClicked = function(annotation, index) {
                        var annotationObj = dvm.os.listItem.selected[annotation][index];
                        dvm.os.editingAnnotation = true;
                        dvm.os.annotationSelect = annotation;
                        dvm.os.annotationValue = annotationObj['@value'];
                        dvm.os.annotationIndex = index;
                        dvm.os.annotationType = _.get(annotationObj, '@type');
                        dvm.os.annotationLanguage = _.get(annotationObj, '@language');
                        modalService.openModal('annotationOverlay');
                    }
                }
            }
        }
})();

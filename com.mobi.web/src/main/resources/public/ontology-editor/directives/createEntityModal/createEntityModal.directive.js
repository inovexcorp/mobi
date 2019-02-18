(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name createEntityModal
         *
         * @description
         * The `createEntityModal` module only provides the `createEntityModal` directive which creates content
         * for a modal to select a type of entity to create.
         */
        .module('createEntityModal', [])
        /**
         * @ngdoc directive
         * @name createEntityModal.directive:createEntityModal
         * @scope
         * @restrict E
         * @requires modal.service:modalService
         * @requires ontologyState.service:ontologyStateService
         *
         * @description
         * `createEntityModal` is a directive that creates content for a modal that provides buttons to create different
         * types of entities in the current {@link ontologyState.service:ontologyStateService selected ontology}. The
         * options are {@link createClassOverlay.directive:createClassOverlay classes},
         * {@link createDataPropertyOverlay.directive:createDataPropertyOverlay data properties},
         * {@link createObjectPropertyOverlay.directive:createObjectPropertyOverlay object properties},
         * {@link createAnnotationPropertyOverlay.directive:createAnnotationPropertyOverlay annotations properties},
         * {@link createIndividualOverlay.directive:createIndividualOverlay individuals}
         * {@link createConceptOverlay.directive:createConceptOverlay concepts} if ontology is a vocabulary, and
         * {@link createConceptSchemeOverlay.directive:createConceptSchemeOverlay concept schemes} if ontology is a
         * vocabulary. Meant to be used in conjunction with the {@link modalService.directive:modalService}.
         *
         * @param {Function} dismiss A function that dismisses the modal
         */
        .directive('createEntityModal', createEntityModal);

        createEntityModal.$inject = ['modalService', 'ontologyStateService'];

        function createEntityModal(modalService, ontologyStateService) {
            return {
                restrict: 'E',
                templateUrl: 'ontology-editor/directives/createEntityModal/createEntityModal.directive.html',
                scope: {
                    dismiss: '&'
                },
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    dvm.os = ontologyStateService;

                    dvm.createClass = function() {
                        $scope.dismiss();
                        modalService.openModal('createClassOverlay');
                    }
                    dvm.createDataProperty = function() {
                        $scope.dismiss();
                        modalService.openModal('createDataPropertyOverlay');
                    }
                    dvm.createObjectProperty = function() {
                        $scope.dismiss();
                        modalService.openModal('createObjectPropertyOverlay');
                    }
                    dvm.createAnnotationProperty = function() {
                        $scope.dismiss();
                        modalService.openModal('createAnnotationPropertyOverlay');
                    }
                    dvm.createIndividual = function() {
                        $scope.dismiss();
                        modalService.openModal('createIndividualOverlay');
                    }
                    dvm.createConcept = function() {
                        $scope.dismiss();
                        modalService.openModal('createConceptOverlay');
                    }
                    dvm.createConceptScheme = function() {
                        $scope.dismiss();
                        modalService.openModal('createConceptSchemeOverlay');
                    }
                    dvm.cancel = function() {
                        $scope.dismiss();
                    }
                }]
            }
        }
})();

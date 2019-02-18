(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name createIndividualOverlay
         *
         * @description
         * The `createIndividualOverlay` module only provides the `createIndividualOverlay` directive which creates
         * content for a modal to add an individual to an ontology.
         */
        .module('createIndividualOverlay', [])
        /**
         * @ngdoc directive
         * @name createIndividualOverlay.directive:createIndividualOverlay
         * @scope
         * @restrict E
         * @requires ontologyState.service:ontologyStateService
         * @requires prefixes.service:prefixes
         * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
         *
         * @description
         * `createIndividualOverlay` is a directive that creates content for a modal that creates an individual in the
         * current {@link ontologyState.service:ontologyStateService selected ontology}. The form in the modal contains
         * a text input for the indivdiual name (which populates the {@link staticIri.directive:staticIri IRI}) and
         * a {@link classSelect.directive:classSelect} for the classes this individual will be an instance of. Meant to
         * be used in conjunction with the {@link modalService.directive:modalService}.
         *
         * @param {Function} close A function that closes the modal
         * @param {Function} dismiss A function that dismisses the modal
         */
        .directive('createIndividualOverlay', createIndividualOverlay);

        createIndividualOverlay.$inject = ['$filter', 'ontologyStateService', 'prefixes', 'ontologyUtilsManagerService'];

        function createIndividualOverlay($filter, ontologyStateService, prefixes, ontologyUtilsManagerService) {
            return {
                restrict: 'E',
                templateUrl: 'ontology-editor/directives/createIndividualOverlay/createIndividualOverlay.directive.html',
                scope: {
                    close: '&',
                    dismiss: '&'
                },
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    dvm.os = ontologyStateService;
                    dvm.ontoUtils = ontologyUtilsManagerService;
                    dvm.prefix = dvm.os.getDefaultPrefix();

                    dvm.individual = {
                        '@id': dvm.prefix,
                        '@type': []
                    };

                    dvm.nameChanged = function() {
                        if (!dvm.iriHasChanged) {
                            dvm.individual['@id'] = dvm.prefix + $filter('camelCase')(dvm.name, 'class');
                        }
                    }
                    dvm.onEdit = function(iriBegin, iriThen, iriEnd) {
                        dvm.iriHasChanged = true;
                        dvm.individual['@id'] = iriBegin + iriThen + iriEnd;
                        dvm.os.setCommonIriParts(iriBegin, iriThen);
                    }
                    dvm.create = function() {
                        // update relevant lists
                        dvm.ontoUtils.addIndividual(dvm.individual);
                        // add the entity to the ontology
                        dvm.individual['@type'].push(prefixes.owl + 'NamedIndividual');
                        dvm.os.addEntity(dvm.os.listItem, dvm.individual);
                        dvm.os.addToAdditions(dvm.os.listItem.ontologyRecord.recordId, dvm.individual);
                        // add to concept hierarchy if an instance of a derived concept
                        if (dvm.ontoUtils.containsDerivedConcept(dvm.individual['@type'])) {
                            dvm.ontoUtils.addConcept(dvm.individual);
                        } else if (dvm.ontoUtils.containsDerivedConceptScheme(dvm.individual['@type'])) {
                            dvm.ontoUtils.addConceptScheme(dvm.individual);
                        }
                        // Save the changes to the ontology
                        dvm.ontoUtils.saveCurrentChanges();
                        // hide the overlay
                        $scope.close();
                    }
                    dvm.cancel = function() {
                        $scope.dismiss();
                    }
                }]
            }
        }
})();

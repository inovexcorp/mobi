(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name createConceptOverlay
         *
         * @description
         * The `createConceptOverlay` module only provides the `createConceptOverlay` directive which creates content
         * for a modal to add a concept to an ontology/vocabulary.
         */
        .module('createConceptOverlay', [])
        /**
         * @ngdoc directive
         * @name createConceptOverlay.directive:createConceptOverlay
         * @scope
         * @restrict E
         * @requires ontologyManager.service:ontologyManagerService
         * @requires ontologyState.service:ontologyStateService
         * @requires prefixes.service:prefixes
         * @requires util.service:utilService
         * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
         * @requires propertyManager.service:propertyManagerService
         *
         * @description
         * `createConceptOverlay` is a directive that creates content for a modal that creates a concept in the current
         * {@link ontologyState.service:ontologyStateService selected ontology/vocabulary}. The form in the modal
         * contains a text input for the concept name (which populates the {@link staticIri.directive:staticIri IRI}),
         * an {@link advancedLanguageSelect.directive:advancedLanguageSelect}, and a `ui-select` for the concept scheme
         * the concept is "top" of. Meant to be used in conjunction with the {@link modalService.directive:modalService}.
         *
         * @param {Function} close A function that closes the modal
         * @param {Function} dismiss A function that dismisses the modal
         */
        .directive('createConceptOverlay', createConceptOverlay);

        createConceptOverlay.$inject = ['$filter', 'ontologyManagerService', 'ontologyStateService', 'prefixes', 'utilService', 'ontologyUtilsManagerService', 'propertyManagerService'];

        function createConceptOverlay($filter, ontologyManagerService, ontologyStateService, prefixes, utilService, ontologyUtilsManagerService, propertyManagerService) {
            return {
                restrict: 'E',
                templateUrl: 'ontology-editor/directives/createConceptOverlay/createConceptOverlay.directive.html',
                scope: {
                    close: '&',
                    dismiss: '&'
                },
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    var pm = propertyManagerService;
                    dvm.ontoUtils = ontologyUtilsManagerService;
                    dvm.prefixes = prefixes;
                    dvm.om = ontologyManagerService;
                    dvm.os = ontologyStateService;
                    dvm.util = utilService;
                    dvm.schemeIRIs = dvm.om.getConceptSchemeIRIs(dvm.os.getOntologiesArray(), dvm.os.listItem.derivedConceptSchemes);
                    dvm.schemes = [];
                    dvm.selectedSchemes = [];
                    dvm.prefix = dvm.os.getDefaultPrefix();
                    dvm.concept = {
                        '@id': dvm.prefix,
                        '@type': [prefixes.owl + 'NamedIndividual', prefixes.skos + 'Concept'],
                        [prefixes.skos + 'prefLabel']: [{
                            '@value': ''
                        }]
                    }

                    dvm.nameChanged = function() {
                        if (!dvm.iriHasChanged) {
                            dvm.concept['@id'] = dvm.prefix + $filter('camelCase')(
                                dvm.concept[prefixes.skos + 'prefLabel'][0]['@value'], 'class');
                        }
                    }
                    dvm.onEdit = function(iriBegin, iriThen, iriEnd) {
                        dvm.iriHasChanged = true;
                        dvm.concept['@id'] = iriBegin + iriThen + iriEnd;
                        dvm.os.setCommonIriParts(iriBegin, iriThen);
                    }
                    dvm.create = function() {
                        if (dvm.selectedSchemes.length) {
                            _.forEach(dvm.selectedSchemes, scheme => {
                                var entity = dvm.os.getEntityByRecordId(dvm.os.listItem.ontologyRecord.recordId, scheme['@id']);
                                pm.addId(entity, prefixes.skos + 'hasTopConcept', dvm.concept['@id']);
                                dvm.os.addToAdditions(dvm.os.listItem.ontologyRecord.recordId, {'@id': scheme['@id'], [prefixes.skos + 'hasTopConcept']: [{'@id': dvm.concept['@id']}]});
                                dvm.os.addEntityToHierarchy(dvm.os.listItem.conceptSchemes.hierarchy, dvm.concept['@id'], dvm.os.listItem.conceptSchemes.index, scheme['@id']);
                            });
                            dvm.os.listItem.conceptSchemes.flat = dvm.os.flattenHierarchy(dvm.os.listItem.conceptSchemes.hierarchy, dvm.os.listItem.ontologyRecord.recordId);
                        }
                        dvm.ontoUtils.addLanguageToNewEntity(dvm.concept, dvm.language);
                        // add the entity to the ontology
                        dvm.os.addEntity(dvm.os.listItem, dvm.concept);
                        // update relevant lists
                        dvm.ontoUtils.addConcept(dvm.concept);
                        dvm.os.addToAdditions(dvm.os.listItem.ontologyRecord.recordId, dvm.concept);
                        dvm.ontoUtils.addIndividual(dvm.concept);
                        // Save the changes to the ontology
                        dvm.ontoUtils.saveCurrentChanges();
                        // hide the overlay
                        $scope.close();
                    }
                    dvm.getSchemes = function(searchText) {
                        dvm.schemes = dvm.ontoUtils.getSelectList(dvm.schemeIRIs, searchText);
                    }
                    dvm.cancel = function() {
                        $scope.dismiss();
                    }
                }]
            }
        }
})();

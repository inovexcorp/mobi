/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name createConceptSchemeOverlay
         *
         * @description
         * The `createConceptSchemeOverlay` module only provides the `createConceptSchemeOverlay` directive which
         * creates content for a modal to add a concept scheme to an ontology/vocabulary.
         */
        .module('createConceptSchemeOverlay', [])
        /**
         * @ngdoc directive
         * @name createConceptSchemeOverlay.directive:createConceptSchemeOverlay
         * @scope
         * @restrict E
         * @requires ontologyManager.service:ontologyManagerService
         * @requires ontologyState.service:ontologyStateService
         * @requires prefixes.service:prefixes
         * @requires util.service:utilService
         * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
         *
         * @description
         * `createConceptSchemeOverlay` is a directive that creates content for a modal that creates a concept scheme
         * in the current {@link ontologyState.service:ontologyStateService selected ontology/vocabulary}. The form in
         * the modal contains a text input for the concept scheme name (which populates the
         * {@link staticIri.directive:staticIri IRI}),
         * an {@link advancedLanguageSelect.directive:advancedLanguageSelect}, and a `ui-select` for the top concepts.
         * Meant to be used in conjunction with the {@link modalService.directive:modalService}.
         *
         * @param {Function} close A function that closes the modal
         * @param {Function} dismiss A function that dismisses the modal
         */
        .directive('createConceptSchemeOverlay', createConceptSchemeOverlay);

        createConceptSchemeOverlay.$inject = ['$filter', 'ontologyManagerService', 'ontologyStateService', 'prefixes', 'utilService', 'ontologyUtilsManagerService'];

        function createConceptSchemeOverlay($filter, ontologyManagerService, ontologyStateService, prefixes, utilService, ontologyUtilsManagerService) {
            return {
                restrict: 'E',
                templateUrl: 'modules/ontology-editor/directives/createConceptSchemeOverlay/createConceptSchemeOverlay.html',
                scope: {
                    close: '&',
                    dismiss: '&'
                },
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    dvm.ontoUtils = ontologyUtilsManagerService;
                    dvm.prefixes = prefixes;
                    dvm.om = ontologyManagerService;
                    dvm.os = ontologyStateService;
                    dvm.util = utilService;
                    dvm.conceptIRIs = dvm.om.getConceptIRIs(dvm.os.getOntologiesArray(), dvm.os.listItem.derivedConcepts);
                    dvm.concepts = [];
                    dvm.selectedConcepts = [];
                    dvm.prefix = dvm.os.getDefaultPrefix();
                    dvm.scheme = {
                        '@id': dvm.prefix,
                        '@type': [prefixes.owl + 'NamedIndividual', prefixes.skos + 'ConceptScheme'],
                        [prefixes.dcterms + 'title']: [{
                            '@value': ''
                        }]
                    }

                    dvm.nameChanged = function() {
                        if (!dvm.iriHasChanged) {
                            dvm.scheme['@id'] = dvm.prefix + $filter('camelCase')(
                                dvm.scheme[prefixes.dcterms + 'title'][0]['@value'], 'class');
                        }
                    }
                    dvm.onEdit = function(iriBegin, iriThen, iriEnd) {
                        dvm.iriHasChanged = true;
                        dvm.scheme['@id'] = iriBegin + iriThen + iriEnd;
                        dvm.os.setCommonIriParts(iriBegin, iriThen);
                    }
                    dvm.create = function() {
                        if (dvm.selectedConcepts.length) {
                            dvm.scheme[prefixes.skos + 'hasTopConcept'] = dvm.selectedConcepts;
                        }
                        dvm.ontoUtils.addLanguageToNewEntity(dvm.scheme, dvm.language);
                        // add the entity to the ontology
                        dvm.os.addEntity(dvm.os.listItem, dvm.scheme);
                        // update relevant lists
                        var hierarchy = _.get(dvm.os.listItem, 'conceptSchemes.hierarchy');
                        var index = _.get(dvm.os.listItem, 'conceptSchemes.index');
                        hierarchy.push({'entityIRI': dvm.scheme['@id']});
                        // Add top concepts to hierarchy if they exist
                        _.forEach(dvm.selectedConcepts, concept => {
                            dvm.os.addEntityToHierarchy(hierarchy, concept['@id'], index, dvm.scheme['@id']);
                        });
                        dvm.os.listItem.conceptSchemes.flat = dvm.os.flattenHierarchy(hierarchy, dvm.os.listItem.ontologyRecord.recordId);
                        // Update additions
                        dvm.os.addToAdditions(dvm.os.listItem.ontologyRecord.recordId, dvm.scheme);
                        // Update individual hierarchy
                        dvm.ontoUtils.addIndividual(dvm.scheme);
                        // select the new concept
                        dvm.os.selectItem(_.get(dvm.scheme, '@id'));
                        // Save the changes to the ontology
                        dvm.ontoUtils.saveCurrentChanges();
                        // hide the overlay
                        $scope.close();
                    }
                    dvm.getConcepts = function(searchText) {
                        dvm.concepts = dvm.ontoUtils.getSelectList(dvm.conceptIRIs, searchText);
                    }
                    dvm.cancel = function() {
                        $scope.dismiss();
                    }
                }]
            }
        }
})();

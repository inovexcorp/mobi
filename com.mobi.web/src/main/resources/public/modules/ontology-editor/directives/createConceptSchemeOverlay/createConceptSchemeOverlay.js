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
        .module('createConceptSchemeOverlay', [])
        .directive('createConceptSchemeOverlay', createConceptSchemeOverlay);

        createConceptSchemeOverlay.$inject = ['$filter', 'ontologyManagerService', 'ontologyStateService', 'prefixes', 'utilService', 'ontologyUtilsManagerService'];

        function createConceptSchemeOverlay($filter, ontologyManagerService, ontologyStateService, prefixes, utilService, ontologyUtilsManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/createConceptSchemeOverlay/createConceptSchemeOverlay.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
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
                        // dvm.ontoUtils.addConceptScheme(dvm.scheme);
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
                        // hide the overlay
                        dvm.os.showCreateConceptSchemeOverlay = false;
                        dvm.ontoUtils.saveCurrentChanges();
                    }
                    dvm.getConcepts = function(searchText) {
                        dvm.concepts = dvm.ontoUtils.getSelectList(dvm.conceptIRIs, searchText);
                    }
                }
            }
        }
})();

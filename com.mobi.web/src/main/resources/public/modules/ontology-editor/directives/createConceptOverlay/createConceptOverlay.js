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
        .module('createConceptOverlay', [])
        .directive('createConceptOverlay', createConceptOverlay);

        createConceptOverlay.$inject = ['$filter', 'ontologyManagerService', 'ontologyStateService', 'prefixes', 'utilService', 'ontologyUtilsManagerService'];

        function createConceptOverlay($filter, ontologyManagerService, ontologyStateService, prefixes, utilService, ontologyUtilsManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/createConceptOverlay/createConceptOverlay.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.ontoUtils = ontologyUtilsManagerService;
                    dvm.prefixes = prefixes;
                    dvm.om = ontologyManagerService;
                    dvm.os = ontologyStateService;
                    dvm.util = utilService;
                    dvm.schemes = [];
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
                        if (dvm.schemes.length) {
                            _.forEach(dvm.schemes, scheme => {
                                var entity = dvm.os.getEntityByRecordId(dvm.os.listItem.ontologyRecord.recordId, scheme['@id']);
                                if (_.has(entity, prefixes.skos + 'hasTopConcept')) {
                                    entity[prefixes.skos + 'hasTopConcept'].push({'@id': dvm.concept['@id']});
                                } else {
                                    entity[prefixes.skos + 'hasTopConcept'] = [{'@id': dvm.concept['@id']}];
                                }
                                dvm.os.addToAdditions(dvm.os.listItem.ontologyRecord.recordId, {'@id': scheme['@id'], [prefixes.skos + 'hasTopConcept']: [{'@id': dvm.concept['@id']}]});
                                dvm.os.addEntityToHierarchy(dvm.os.listItem.conceptSchemes.hierarchy, dvm.concept['@id'], dvm.os.listItem.conceptSchemes.index, scheme['@id']);
                            });
                            dvm.os.listItem.conceptSchemes.flat = dvm.os.flattenHierarchy(dvm.os.listItem.conceptSchemes.hierarchy, dvm.os.listItem.ontologyRecord.recordId);
                        }
                        dvm.ontoUtils.addLanguageToNewEntity(dvm.concept, dvm.language);
                        // add the entity to the ontology
                        dvm.os.addEntity(dvm.os.listItem, dvm.concept);
                        // update relevant lists
                        var hierarchy = _.get(dvm.os.listItem, 'concepts.hierarchy');
                        hierarchy.push({'entityIRI': dvm.concept['@id']});
                        dvm.os.listItem.concepts.flat = dvm.os.flattenHierarchy(hierarchy, dvm.os.listItem.ontologyRecord.recordId);
                        dvm.os.addToAdditions(dvm.os.listItem.ontologyRecord.recordId, dvm.concept);
                        // select the new class
                        dvm.os.selectItem(_.get(dvm.concept, '@id'));
                        // hide the overlay
                        dvm.os.showCreateConceptOverlay = false;
                        dvm.ontoUtils.saveCurrentChanges();
                    }
                }
            }
        }
})();

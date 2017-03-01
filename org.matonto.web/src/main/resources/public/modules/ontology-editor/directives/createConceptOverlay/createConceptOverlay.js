/*-
 * #%L
 * org.matonto.web
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

        createConceptOverlay.$inject = ['$filter', 'ontologyManagerService', 'ontologyStateService', 'prefixes',
            'utilService'];

        function createConceptOverlay($filter, ontologyManagerService, ontologyStateService, prefixes, utilService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/createConceptOverlay/createConceptOverlay.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.prefixes = prefixes;
                    dvm.om = ontologyManagerService;
                    dvm.sm = ontologyStateService;
                    dvm.schemes = [];
                    dvm.prefix = _.get(dvm.sm.listItem, 'iriBegin', dvm.sm.listItem.ontologyId)
                        + _.get(dvm.sm.listItem, 'iriThen', '#');
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
                        dvm.sm.setCommonIriParts(iriBegin, iriThen);
                    }

                    dvm.create = function() {
                        _.forEach(dvm.schemes, scheme => {
                            var entity = dvm.om.getEntityByRecordId(dvm.sm.listItem.recordId, scheme['@id']);
                            if (_.has(entity, prefixes.skos + 'hasTopConcept')) {
                                entity[prefixes.skos + 'hasTopConcept'].push({'@id': dvm.concept['@id']});
                            } else {
                                entity[prefixes.skos + 'hasTopConcept'] = [{'@id': dvm.concept['@id']}];
                            }
                            entity.matonto.unsaved = true;
                        });
                        _.set(dvm.concept, 'matonto.originalIRI', dvm.concept['@id']);
                        // add the entity to the ontology
                        dvm.om.addEntity(dvm.sm.listItem, dvm.concept);
                        // update relevant lists
                        _.get(dvm.sm.listItem, 'conceptHierarchy').push({'entityIRI': dvm.concept['@id']});
                        _.set(_.get(dvm.sm.listItem, 'index'), dvm.concept['@id'], dvm.sm.listItem.ontology.length - 1);
                        dvm.om.addToAdditions(dvm.sm.listItem.recordId, dvm.concept);
                        // select the new class
                        dvm.sm.selectItem(_.get(dvm.concept, '@id'));
                        // hide the overlay
                        dvm.sm.showCreateConceptOverlay = false;
                    }
                }
            }
        }
})();

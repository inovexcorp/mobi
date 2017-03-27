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
        .module('createIndividualOverlay', [])
        .directive('createIndividualOverlay', createIndividualOverlay);

        createIndividualOverlay.$inject = ['$filter', 'ontologyManagerService', 'ontologyStateService', 'responseObj', 'prefixes', 'ontologyUtilsManagerService'];

        function createIndividualOverlay($filter, ontologyManagerService, ontologyStateService, responseObj, prefixes, ontologyUtilsManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/createIndividualOverlay/createIndividualOverlay.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var ontoUtils = ontologyUtilsManagerService;

                    dvm.prefixes = prefixes;
                    dvm.ro = responseObj;
                    dvm.om = ontologyManagerService;
                    dvm.sm = ontologyStateService;

                    dvm.prefix = dvm.sm.getDefaultPrefix();

                    dvm.individual = {
                        '@id': dvm.prefix,
                        '@type': []
                    };

                    dvm.subClasses = _.map(dvm.sm.state.subClasses, obj => dvm.ro.getItemIri(obj));

                    dvm.nameChanged = function() {
                        if (!dvm.iriHasChanged) {
                            dvm.individual['@id'] = dvm.prefix + $filter('camelCase')(dvm.name, 'class');
                        }
                    }

                    dvm.onEdit = function(iriBegin, iriThen, iriEnd) {
                        dvm.iriHasChanged = true;
                        dvm.individual['@id'] = iriBegin + iriThen + iriEnd;
                        dvm.sm.setCommonIriParts(iriBegin, iriThen);
                    }

                    dvm.getItemOntologyIri = function(item) {
                        return _.get(item, 'ontologyId', dvm.sm.listItem.ontologyId);
                    }

                    dvm.create = function() {
                        _.set(dvm.individual, 'matonto.originalIRI', dvm.individual['@id']);
                        // update relevant lists
                        var split = $filter('splitIRI')(dvm.individual['@id']);
                        _.get(dvm.sm.listItem, 'individuals').push({namespace:split.begin + split.then,
                            localName: split.end});
                        var classesWithIndividuals = _.get(dvm.sm.listItem, 'classesWithIndividuals');
                        _.set(dvm.sm.listItem, 'classesWithIndividuals', _.unionWith(classesWithIndividuals, _.map(dvm.individual['@type'], type => ({entityIRI: type})), (obj1, obj2) => _.get(obj1, 'entityIRI') === _.get(obj2, 'entityIRI')));
                        // add the entity to the ontology
                        dvm.individual['@type'].push(prefixes.owl + 'NamedIndividual');
                        dvm.om.addEntity(dvm.sm.listItem, dvm.individual);
                        _.set(_.get(dvm.sm.listItem, 'index'), dvm.individual['@id'], dvm.sm.listItem.ontology.length - 1);
                        dvm.om.addToAdditions(dvm.sm.listItem.recordId, dvm.individual);
                        // select the new individual
                        dvm.sm.selectItem(dvm.individual['@id'], false);
                        // hide the overlay
                        dvm.sm.showCreateIndividualOverlay = false;
                        ontoUtils.saveCurrentChanges();
                    }
                }
            }
        }
})();

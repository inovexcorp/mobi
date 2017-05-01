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

        createIndividualOverlay.$inject = ['$filter', 'ontologyStateService', 'responseObj', 'prefixes', 'ontologyUtilsManagerService'];

        function createIndividualOverlay($filter, ontologyStateService, responseObj, prefixes, ontologyUtilsManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/createIndividualOverlay/createIndividualOverlay.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.ontoUtils = ontologyUtilsManagerService;
                    dvm.prefixes = prefixes;
                    dvm.ro = responseObj;
                    dvm.os = ontologyStateService;

                    dvm.prefix = dvm.os.getDefaultPrefix();

                    dvm.individual = {
                        '@id': dvm.prefix,
                        '@type': []
                    };

                    dvm.subClasses = _.map(dvm.os.state.subClasses, obj => dvm.ro.getItemIri(obj));

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

                    dvm.getItemOntologyIri = function(item) {
                        return _.get(item, 'ontologyId', dvm.os.listItem.ontologyId);
                    }

                    dvm.create = function() {
                       _.set(dvm.individual, 'matonto.originalIRI', dvm.individual['@id']);
                        // update relevant lists
                       var split = $filter('splitIRI')(dvm.individual['@id']);
                       _.get(dvm.os.listItem, 'individuals').push({namespace:split.begin + split.then,
                            localName: split.end});

                       var classesWithIndividuals = _.get(dvm.os.listItem, 'classesWithIndividuals');
                       var classesAndIndividuals = _.get(dvm.os.listItem, 'classesAndIndividuals');
                       var individualsParentPath = _.get(dvm.os.listItem, 'individualsParentPath');
                       var paths = [];
                       var individuals = [];

                       _.each(dvm.individual['@type'], (type) => {
                           var individual = [];
                           var existingInds = _.get(dvm.os.listItem.classesAndIndividuals, type);
                           var path = dvm.os.getPathsTo(_.get(dvm.os.listItem, 'classHierarchy'), _.get(dvm.os.listItem, 'classIndex'), type);

                           individual.push(dvm.individual['@id']);

                           if(existingInds){
                               var conItems = _.concat(individual, existingInds);
                               dvm.os.listItem.classesAndIndividuals[type] = conItems;
                           }
                           else{
                               dvm.os.listItem.classesAndIndividuals[type] = individual;
                           }

                           individuals.push(type);
                           paths.push(path);
                        });

                        var uniqueUris =  _.uniq(_.flattenDeep(paths));//dvm.os.retrieveUniquePaths(paths);
                        var ipp = _.concat(individualsParentPath,uniqueUris);
                        var cwi = _.concat(classesWithIndividuals,individuals);

                        _.set(dvm.os.listItem, 'classesWithIndividuals', cwi);
                        _.set(dvm.os.listItem, 'individualsParentPath', ipp);

                        // add the entity to the ontology
                        dvm.individual['@type'].push(prefixes.owl + 'NamedIndividual');
                        dvm.os.addEntity(dvm.os.listItem, dvm.individual);
                        dvm.os.addToAdditions(dvm.os.listItem.recordId, dvm.individual);
                        // select the new individual
                        dvm.os.selectItem(dvm.individual['@id'], false);
                        // hide the overlay
                        dvm.os.showCreateIndividualOverlay = false;
                        dvm.ontoUtils.saveCurrentChanges();
                    }
                }
            }
        }
})();

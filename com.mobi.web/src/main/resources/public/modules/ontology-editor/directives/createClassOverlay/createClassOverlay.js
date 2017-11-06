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
        .module('createClassOverlay', [])
        .directive('createClassOverlay', createClassOverlay);

        createClassOverlay.$inject = ['$filter', 'REGEX', 'ontologyStateService', 'prefixes', 'ontologyUtilsManagerService'];

        function createClassOverlay($filter, REGEX, ontologyStateService, prefixes, ontologyUtilsManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/createClassOverlay/createClassOverlay.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;

                    dvm.prefixes = prefixes;
                    dvm.iriPattern = REGEX.IRI;
                    dvm.os = ontologyStateService;
                    dvm.ontoUtils = ontologyUtilsManagerService;
                    dvm.prefix = dvm.os.getDefaultPrefix();
                    dvm.values = [];
                    dvm.clazz = {
                        '@id': dvm.prefix,
                        '@type': [prefixes.owl + 'Class'],
                        [prefixes.dcterms + 'title']: [{
                            '@value': ''
                        }],
                        [prefixes.dcterms + 'description']: [{
                            '@value': ''
                        }]
                    }

                    dvm.nameChanged = function() {
                        if (!dvm.iriHasChanged) {
                            dvm.clazz['@id'] = dvm.prefix + $filter('camelCase')(
                                dvm.clazz[prefixes.dcterms + 'title'][0]['@value'], 'class');
                        }
                    }

                    dvm.onEdit = function(iriBegin, iriThen, iriEnd) {
                        dvm.iriHasChanged = true;
                        dvm.clazz['@id'] = iriBegin + iriThen + iriEnd;
                        dvm.os.setCommonIriParts(iriBegin, iriThen);
                    }

                    dvm.create = function() {
                        if (_.isEqual(dvm.clazz[prefixes.dcterms + 'description'][0]['@value'], '')) {
                            _.unset(dvm.clazz, prefixes.dcterms + 'description');
                        }
                        dvm.ontoUtils.addLanguageToNewEntity(dvm.clazz, dvm.language);
                        // add the entity to the ontology
                        dvm.os.addEntity(dvm.os.listItem, dvm.clazz);
                        dvm.os.listItem.flatEverythingTree = dvm.os.createFlatEverythingTree(dvm.os.getOntologiesArray(), dvm.os.listItem);
                        // update relevant lists
                        var split = $filter('splitIRI')(dvm.clazz['@id']);
                        dvm.os.addToClassIRIs(dvm.os.listItem, {namespace: split.begin + split.then, localName: split.end});
                        if (dvm.values.length) {
                            dvm.clazz[prefixes.rdfs + 'subClassOf'] = dvm.values;
                            dvm.ontoUtils.setSuperClasses(dvm.clazz['@id'], _.map(dvm.values, '@id'));
                        } else {
                            var hierarchy = _.get(dvm.os.listItem, 'classes.hierarchy');
                            hierarchy.push({'entityIRI': dvm.clazz['@id']});
                            dvm.os.listItem.classes.flat = dvm.os.flattenHierarchy(hierarchy, dvm.os.listItem.ontologyRecord.recordId);
                        }
                        dvm.os.addToAdditions(dvm.os.listItem.ontologyRecord.recordId, dvm.clazz);
                        // select the new class
                        dvm.os.selectItem(_.get(dvm.clazz, '@id'));
                        // hide the overlay
                        dvm.os.showCreateClassOverlay = false;
                        dvm.ontoUtils.saveCurrentChanges();
                    }
                }
            }
        }
})();

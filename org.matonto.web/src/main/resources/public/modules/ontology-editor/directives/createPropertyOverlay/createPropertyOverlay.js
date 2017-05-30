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
        .module('createPropertyOverlay', [])
        .directive('createPropertyOverlay', createPropertyOverlay);

        createPropertyOverlay.$inject = ['$filter', 'REGEX', 'ontologyManagerService', 'ontologyStateService', 'prefixes', 'ontologyUtilsManagerService', 'responseObj'];

        function createPropertyOverlay($filter, REGEX, ontologyManagerService, ontologyStateService, prefixes, ontologyUtilsManagerService, responseObj) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/createPropertyOverlay/createPropertyOverlay.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var setAsObject = false;
                    var setAsDatatype = false;
                    var ontoUtils = ontologyUtilsManagerService;
                    var ro = responseObj;

                    dvm.checkbox = false;
                    dvm.prefixes = prefixes;
                    dvm.iriPattern = REGEX.IRI;
                    dvm.om = ontologyManagerService;
                    dvm.os = ontologyStateService;
                    dvm.prefix = dvm.os.getDefaultPrefix();
                    dvm.values = [];
                    dvm.property = {
                        '@id': dvm.prefix,
                        [prefixes.dcterms + 'title']: [{
                            '@value': ''
                        }],
                        [prefixes.dcterms + 'description']: [{
                            '@value': ''
                        }]
                    }

                    dvm.nameChanged = function() {
                        if (!dvm.iriHasChanged) {
                            dvm.property['@id'] = dvm.prefix + $filter('camelCase')(dvm.property[prefixes.dcterms + 'title'][0]['@value'], 'property');
                        }
                    }

                    dvm.onEdit = function(iriBegin, iriThen, iriEnd) {
                        dvm.iriHasChanged = true;
                        dvm.property['@id'] = iriBegin + iriThen + iriEnd;
                        dvm.os.setCommonIriParts(iriBegin, iriThen);
                    }

                    dvm.create = function() {
                        if (dvm.property[prefixes.dcterms + 'description'][0]['@value'] === '') {
                            _.unset(dvm.property, prefixes.dcterms + 'description');
                        }
                        if (dvm.checkbox) {
                            dvm.property['@type'].push(prefixes.owl + 'FunctionalProperty');
                        }
                        _.forEach(['domain', 'range'], function(axiom) {
                            if (_.isEqual(dvm.property[prefixes.rdfs + axiom], [])) {
                                _.unset(dvm.property, prefixes.rdfs + axiom);
                            }
                        });
                        ontoUtils.addLanguageToNewEntity(dvm.property, dvm.language);
                        dvm.os.updatePropertyIcon(dvm.property);
                        // add the entity to the ontology
                        dvm.os.addEntity(dvm.os.listItem, dvm.property);
                        // update relevant lists
                        if (dvm.om.isObjectProperty(dvm.property)) {
                            commonUpdate('subObjectProperties', 'objectPropertyHierarchy', 'flatObjectPropertyHierarchy', 'objectPropertyIndex', dvm.os.setObjectPropertiesOpened);
                            dvm.os.listItem.flatEverythingTree = dvm.os.createFlatEverythingTree(dvm.os.getOntologiesArray(), dvm.os.listItem);
                        } else if (dvm.om.isDataTypeProperty(dvm.property)) {
                            commonUpdate('subDataProperties', 'dataPropertyHierarchy', 'flatDataPropertyHierarchy', 'dataPropertyIndex', dvm.os.setDataPropertiesOpened);
                            dvm.os.listItem.flatEverythingTree = dvm.os.createFlatEverythingTree(dvm.os.getOntologiesArray(), dvm.os.listItem);
                        } else if (dvm.om.isAnnotation(dvm.property)) {
                            dvm.values = [];
                            commonUpdate('annotations', 'annotationPropertyHierarchy', 'flatAnnotationPropertyHierarchy', 'annotationPropertyIndex', dvm.os.setAnnotationPropertiesOpened);
                        }
                        dvm.os.addToAdditions(dvm.os.listItem.recordId, dvm.property);
                        // select the new property
                        dvm.os.selectItem(_.get(dvm.property, '@id'));
                        // hide the overlay
                        dvm.os.showCreatePropertyOverlay = false;
                        ontoUtils.saveCurrentChanges();
                    }
                    
                    dvm.getKey = function() {
                        if (dvm.om.isDataTypeProperty(dvm.property)) {
                            return 'subDataProperties'
                        }
                        return 'subObjectProperties';
                    }
                    
                    dvm.typeChange = function() {
                        dvm.values = [];
                    }
                    
                    function commonUpdate(listKey, hierarchyKey, flatHierarchyKey, indexKey, func) {
                        dvm.os.listItem[listKey].push(ro.createItemFromIri(dvm.property['@id']));
                        if (dvm.values.length) {
                            dvm.property[prefixes.rdfs + 'subPropertyOf'] = dvm.values;
                            ontoUtils.setSuperProperties(dvm.property['@id'], _.map(dvm.values, '@id'), hierarchyKey, indexKey, flatHierarchyKey);
                        } else {
                            dvm.os.listItem[hierarchyKey].push({'entityIRI': dvm.property['@id']});
                            dvm.os.listItem[flatHierarchyKey] = dvm.os.flattenHierarchy(dvm.os.listItem[hierarchyKey], dvm.os.listItem.recordId);
                        }
                        func(dvm.os.listItem.recordId, true);
                    }
                }
            }
        }
})();

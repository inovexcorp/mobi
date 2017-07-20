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
        /**
         * @ngdoc overview
         * @name propMappingOverlay
         *
         * @description
         * The `propMappingOverlay` module only provides the `propMappingOverlay` directive which creates
         * an overlay with functionality to create or edit a property mapping in the current
         * {@link mapperState.service:mapperStateService#mapping mapping}.
         */
        .module('propMappingOverlay', [])
        /**
         * @ngdoc directive
         * @name propMappingOverlay.directive:propMappingOverlay
         * @scope
         * @restrict E
         * @requires prefixes.service:prefixes
         * @requires util.service:utilService
         * @requires ontologyManager.service:ontologyManagerService
         * @requires mappingManager.service:mappingManagerService
         * @requires mapperState.service:mapperStateService
         *
         * @description
         * `propMappingOverlay` is a directive that creates an overlay with functionality to create or edit a
         * property mapping in the current {@link mapperState.service:mapperStateService#mapping mapping}.
         * If the selected property in the {@link propSelect.directive:propSelect propSelect} is a data property,
         * a {@link columnSelect.directive:columnSelect columnSelect} will appear to select the linked column index
         * for the data property mapping being created/edited. If the selected property is an object property,
         * a description of the class the property links to will be displayed. The directive is replaced by the
         * contents of its template.
         */
        .directive('propMappingOverlay', propMappingOverlay);

        propMappingOverlay.$inject = ['prefixes', 'utilService', 'ontologyManagerService', 'mapperStateService', 'mappingManagerService'];

        function propMappingOverlay(prefixes, utilService, ontologyManagerService, mapperStateService, mappingManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.isNumber = angular.isNumber;
                    dvm.prefixes = prefixes;
                    dvm.state = mapperStateService;
                    dvm.mm = mappingManagerService;
                    dvm.om = ontologyManagerService;
                    dvm.util = utilService;

                    dvm.selectedProp = undefined;
                    dvm.selectedColumn = '';
                    dvm.rangeClassMapping = undefined;
                    dvm.rangeClass = undefined;

                    dvm.getClassMappingName = function() {
                        var className = dvm.util.getBeautifulIRI(_.get(dvm.rangeClass, "classObj['@id']"));
                        return dvm.rangeClassMapping ? dvm.util.getBeautifulIRI(dvm.mm.getClassIdByMapping(dvm.rangeClassMapping)) : '[New ' + className + ']';
                    }
                    dvm.disableSet = function() {
                        var propObj = _.get(dvm.selectedProp, 'propObj');
                        return (dvm.state.newProp && !dvm.selectedProp)
                            || (!dvm.om.isObjectProperty(propObj) && !dvm.isNumber(dvm.selectedColumn))
                            || (!dvm.state.newProp && dvm.om.isObjectProperty(propObj))
                            || (dvm.om.isObjectProperty(propObj) && dvm.om.isDeprecated(_.get(dvm.rangeClass, 'classObj')));
                    }
                    dvm.setRangeClass = function() {
                        var rangeClassId = dvm.util.getPropertyId(dvm.selectedProp.propObj, dvm.prefixes.rdfs + 'range');
                        dvm.rangeClassMapping = _.head(dvm.mm.getClassMappingsByClassId(dvm.state.mapping.jsonld, rangeClassId));
                        dvm.rangeClass = _.find(dvm.state.availableClasses, {classObj: {'@id': rangeClassId}});
                    }
                    dvm.updateRange = function() {
                        dvm.selectedColumn = '';
                        if (dvm.om.isObjectProperty(_.get(dvm.selectedProp, 'propObj'))) {
                            dvm.setRangeClass();
                        } else {
                            dvm.rangeClassMapping = undefined;
                            dvm.rangeClass = undefined;
                        }
                    }
                    dvm.set = function() {
                        if (dvm.state.newProp) {
                            var propId = dvm.selectedProp.propObj['@id'];
                            var ontology = _.find(dvm.state.sourceOntologies, {id: dvm.selectedProp.ontologyId});
                            var additionsObj = _.find(dvm.state.mapping.difference.additions, {'@id': dvm.state.selectedClassMappingId});
                            var propMap;
                            var prop;
                            if (dvm.om.isObjectProperty(dvm.selectedProp.propObj)) {
                                // Add range class mapping first
                                var classMapping;
                                if (dvm.rangeClassMapping) {
                                    classMapping = dvm.rangeClassMapping;
                                } else {
                                    var rangeOntology = _.find(dvm.state.sourceOntologies, {id: dvm.rangeClass.ontologyId});
                                    classMapping = dvm.mm.addClass(dvm.state.mapping.jsonld, rangeOntology.entities, dvm.rangeClass.classObj['@id']);
                                    dvm.state.mapping.difference.additions.push(angular.copy(classMapping));
                                    _.remove(dvm.state.availableClasses, dvm.rangeClass);
                                }

                                // Add object property mapping pointing to new range class mapping
                                propMap = dvm.mm.addObjectProp(dvm.state.mapping.jsonld, _.get(ontology, 'entities', []), dvm.state.selectedClassMappingId, propId, classMapping['@id']);
                                prop = prefixes.delim + 'objectProperty';
                                dvm.state.setAvailableProps(classMapping['@id']);
                            } else {
                                propMap = dvm.mm.addDataProp(dvm.state.mapping.jsonld, _.get(ontology, 'entities', []), dvm.state.selectedClassMappingId, propId, dvm.selectedColumn);
                                prop = prefixes.delim + 'dataProperty';
                            }

                            dvm.state.mapping.difference.additions.push(angular.copy(propMap));
                            if (additionsObj) {
                                if (!_.has(additionsObj, "['" + prop + "']")) {
                                    additionsObj[prop] = [];
                                }
                                additionsObj[prop].push({'@id': propMap['@id']});
                            } else {
                                dvm.state.mapping.difference.additions.push({'@id': dvm.state.selectedClassMappingId, [prop]: [{'@id': propMap['@id']}]});
                            }
                            dvm.state.setAvailableProps(dvm.state.selectedClassMappingId);
                            dvm.state.newProp = false;
                        } else {
                            var propMapping = _.find(dvm.state.mapping.jsonld, {'@id': dvm.state.selectedPropMappingId});
                            if (dvm.mm.isDataMapping(propMapping)) {
                                var originalIndex = dvm.util.getPropertyValue(propMapping, prefixes.delim + 'columnIndex');
                                propMapping[prefixes.delim + 'columnIndex'][0]['@value'] = dvm.selectedColumn;
                                dvm.state.changeProp(propMapping['@id'], prefixes.delim + 'columnIndex', dvm.selectedColumn, originalIndex);
                                _.remove(dvm.state.invalidProps, {'@id': dvm.state.selectedPropMappingId})
                            }
                        }

                        var selectedClassMappingId = dvm.state.selectedClassMappingId;
                        dvm.state.resetEdit();
                        dvm.state.selectedClassMappingId = selectedClassMappingId;
                        dvm.state.displayPropMappingOverlay = false;
                    }
                    dvm.cancel = function() {
                        dvm.state.displayPropMappingOverlay = false;
                        dvm.state.newProp = false;
                    }

                    if (!dvm.state.newProp && dvm.state.selectedPropMappingId) {
                        var propMapping = _.find(dvm.state.mapping.jsonld, {'@id': dvm.state.selectedPropMappingId});
                        var propId = dvm.mm.getPropIdByMapping(propMapping);
                        var ontology = dvm.mm.findSourceOntologyWithProp(propId, dvm.state.sourceOntologies);
                        if (_.includes(dvm.mm.annotationProperties, propId)) {
                            dvm.selectedProp = {propObj: {'@id': propId}, ontologyId: ''};
                        } else {
                            dvm.selectedProp = {propObj: dvm.om.getEntity([ontology.entities], propId), ontologyId: ontology.id};
                        }

                        if (dvm.om.isObjectProperty(dvm.selectedProp.propObj)) {
                            dvm.setRangeClass();
                        } else {
                            dvm.selectedColumn = dvm.util.getPropertyValue(propMapping, dvm.prefixes.delim + 'columnIndex');
                        }
                    }
                },
                templateUrl: 'modules/mapper/directives/propMappingOverlay/propMappingOverlay.html'
            }
        }
})();

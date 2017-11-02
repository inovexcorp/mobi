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
         * @name propMappingOverlay
         *
         * @description
         * The `propMappingOverlay` module only provides the `propMappingOverlay` directive which creates
         * an overlay with functionality to create or edit a PropertyMapping in the current
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
         * @requires mapperState.service:mapperStateService
         * @requires mappingManager.service:mappingManagerService
         *
         * @description
         * `propMappingOverlay` is a directive that creates an overlay with functionality to create or edit a
         * PropertyMapping in the current {@link mapperState.service:mapperStateService#mapping mapping}.
         * If the selected property in the {@link propSelect.directive:propSelect propSelect} is a data property,
         * a {@link columnSelect.directive:columnSelect columnSelect} will appear to select the linked column index
         * for the DataMapping being created/edited. If the selected property is an object property,
         * a select for ClassMappings of the type the property links to will be displayed. The directive is replaced by the
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
                    var mm = mappingManagerService;
                    dvm.util = utilService;
                    dvm.state = mapperStateService;
                    dvm.om = ontologyManagerService;

                    dvm.selectedPropMapping = undefined;
                    dvm.selectedProp = undefined;
                    dvm.selectedColumn = '';
                    // First item in list will always be a repesentation of creating a new class mapping
                    dvm.classMappings = [];
                    dvm.rangeClassMappingId = '';
                    dvm.rangeClass = undefined;

                    var newClassMappingIdentifier = 'new';

                    dvm.disableSet = function() {
                        var propObj = _.get(dvm.selectedProp, 'propObj');
                        return (dvm.state.newProp && !dvm.selectedProp)
                            || (!dvm.om.isObjectProperty(propObj) && isNaN(parseInt(dvm.selectedColumn, 10)))
                            || (dvm.om.isObjectProperty(propObj) && !dvm.rangeClassMappingId)
                            || (dvm.om.isObjectProperty(propObj) && dvm.om.isDeprecated(_.get(dvm.rangeClass, 'classObj')));
                    }
                    dvm.setRangeClass = function() {
                        var rangeClassId = dvm.util.getPropertyId(dvm.selectedProp.propObj, prefixes.rdfs + 'range');
                        dvm.rangeClass = _.find(dvm.state.availableClasses, {classObj: {'@id': rangeClassId}});
                        var newItem = {
                            '@id': 'new',
                            [prefixes.dcterms + 'title']: [{'@value': '[New ' + dvm.om.getEntityName(dvm.rangeClass.classObj) + ']'}]
                        };
                        dvm.classMappings = _.concat([newItem], mm.getClassMappingsByClassId(dvm.state.mapping.jsonld, rangeClassId));
                        dvm.rangeClassMappingId = dvm.util.getPropertyId(dvm.selectedPropMapping, prefixes.delim + 'classMapping');
                    }
                    dvm.updateRange = function() {
                        dvm.selectedColumn = '';
                        if (dvm.om.isObjectProperty(_.get(dvm.selectedProp, 'propObj'))) {
                            dvm.setRangeClass();
                        } else {
                            dvm.classMappings = [];
                            dvm.rangeClassMappingId = '';
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
                                // Add range ClassMapping first
                                var classMapping = setRangeClassMapping();

                                // Add ObjectMapping pointing to new range class mapping
                                propMap = mm.addObjectProp(dvm.state.mapping.jsonld, _.get(ontology, 'entities', []), dvm.state.selectedClassMappingId, propId, classMapping['@id']);
                                prop = prefixes.delim + 'objectProperty';
                                dvm.state.setAvailableProps(classMapping['@id']);
                            } else {
                                // Add the DataMapping pointing to the selectedColumn
                                propMap = mm.addDataProp(dvm.state.mapping.jsonld, _.get(ontology, 'entities', []), dvm.state.selectedClassMappingId, propId, dvm.selectedColumn);
                                prop = prefixes.delim + 'dataProperty';
                            }

                            // Add new PropertyMapping to the additions
                            dvm.state.mapping.difference.additions.push(angular.copy(propMap));
                            if (additionsObj) {
                                // If the additionsObj for the parent ClassMapping exists, add the triple for the new PropertyMapping
                                if (!_.has(additionsObj, "['" + prop + "']")) {
                                    additionsObj[prop] = [];
                                }
                                additionsObj[prop].push({'@id': propMap['@id']});
                            } else {
                                // If the additionsObj for the parent ClassMapping does not exist, add it with the triple for the new PropertyMapping
                                dvm.state.mapping.difference.additions.push({'@id': dvm.state.selectedClassMappingId, [prop]: [{'@id': propMap['@id']}]});
                            }
                            dvm.state.setAvailableProps(dvm.state.selectedClassMappingId);
                            dvm.state.newProp = false;
                        } else {
                            if (mm.isDataMapping(dvm.selectedPropMapping)) {
                                var originalIndex = dvm.util.getPropertyValue(dvm.selectedPropMapping, prefixes.delim + 'columnIndex');
                                dvm.util.setPropertyValue(dvm.selectedPropMapping, prefixes.delim + 'columnIndex', dvm.selectedColumn);
                                dvm.state.changeProp(dvm.selectedPropMapping['@id'], prefixes.delim + 'columnIndex', dvm.selectedColumn, originalIndex);
                                _.remove(dvm.state.invalidProps, {'@id': dvm.state.selectedPropMappingId})
                            } else {
                                var classMapping = setRangeClassMapping();
                                var originalClassMappingId = dvm.util.getPropertyId(dvm.selectedPropMapping, prefixes.delim + 'classMapping');
                                dvm.util.setPropertyId(dvm.selectedPropMapping, prefixes.delim + 'classMapping', classMapping['@id']);
                                dvm.state.changeProp(dvm.selectedPropMapping['@id'], prefixes.delim + 'classMapping', classMapping['@id'], originalClassMappingId);
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

                    function setRangeClassMapping() {
                        var classMapping;
                        if (dvm.rangeClassMappingId === newClassMappingIdentifier) {
                            // Add a new ClassMapping for the range if that is what was selected
                            var rangeOntology = _.find(dvm.state.sourceOntologies, {id: dvm.rangeClass.ontologyId});
                            classMapping = mm.addClass(dvm.state.mapping.jsonld, rangeOntology.entities, dvm.rangeClass.classObj['@id']);
                            dvm.state.mapping.difference.additions.push(angular.copy(classMapping));
                        } else {
                            // Otherwise, find the existing selected ClassMapping
                            classMapping = _.find(dvm.state.mapping.jsonld, {'@id': dvm.rangeClassMappingId});
                        }
                        return classMapping;
                    }

                    if (!dvm.state.newProp && dvm.state.selectedPropMappingId) {
                        dvm.selectedPropMapping = _.find(dvm.state.mapping.jsonld, {'@id': dvm.state.selectedPropMappingId});
                        var propId = mm.getPropIdByMapping(dvm.selectedPropMapping);
                        if (_.includes(mm.annotationProperties, propId)) {
                            dvm.selectedProp = {propObj: {'@id': propId}, ontologyId: ''};
                        } else {
                            var ontology = mm.findSourceOntologyWithProp(propId, dvm.state.sourceOntologies);
                            dvm.selectedProp = {propObj: dvm.om.getEntity([ontology.entities], propId), ontologyId: ontology.id};
                        }

                        if (dvm.om.isObjectProperty(dvm.selectedProp.propObj)) {
                            dvm.setRangeClass();
                        } else {
                            dvm.selectedColumn = dvm.util.getPropertyValue(dvm.selectedPropMapping, prefixes.delim + 'columnIndex');
                        }
                    }
                },
                templateUrl: 'modules/mapper/directives/propMappingOverlay/propMappingOverlay.html'
            }
        }
})();

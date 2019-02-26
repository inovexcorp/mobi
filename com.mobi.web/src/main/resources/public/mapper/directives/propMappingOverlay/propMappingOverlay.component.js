/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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

    /**
     * @ngdoc component
     * @name propMappingOverlay.component:propMappingOverlay
     * @requires shared.service:prefixes
     * @requires shared.service:utilService
     * @requires shared.service:ontologyManagerService
     * @requires shared.service:mapperStateService
     * @requires shared.service:mappingManagerService
     *
     * @description
     * `propMappingOverlay` is a component that creates content an overlay that creates or edits a PropertyMapping in
     * the current {@link shared.service:mapperStateService#mapping mapping}. If the selected property in the
     * {@link propSelect.directive:propSelect propSelect} is a data property, a
     * {@link columnSelect.directive:columnSelect columnSelect} will appear to select the linked column index for the
     * DataMapping being created/edited. If the selected property is an object property, a select for ClassMappings of
     * the type the property links to will be displayed. Meant to be used in conjunction with the
     * {@link modalService.directive:modalService}.
     *
     * @param {Function} close A function that closes the modal
     * @param {Function} dismiss A function that dismisses the modal
     */
    const propMappingOverlayComponent = {
        templateUrl: 'mapper/directives/propMappingOverlay/propMappingOverlay.component.html',
        bindings: {
            close: '&',
            dismiss: '&'
        },
        controllerAs: 'dvm',
        controller: propMappingOverlayComponentCtrl,
    };

    propMappingOverlayComponentCtrl.$inject = ['prefixes', 'utilService', 'ontologyManagerService', 'mapperStateService', 'mappingManagerService', 'propertyManagerService'];

    function propMappingOverlayComponentCtrl(prefixes, utilService, ontologyManagerService, mapperStateService, mappingManagerService, propertyManagerService) {
        var dvm = this;
        var mm = mappingManagerService;
        var pm = propertyManagerService;
        dvm.util = utilService;
        dvm.state = mapperStateService;
        dvm.om = ontologyManagerService;

        dvm.selectedPropMapping = undefined;
        dvm.selectedProp = undefined;
        dvm.selectedColumn = '';
        // First item in list will always be a representation of creating a new class mapping
        dvm.classMappings = [];
        dvm.rangeClassMappingId = '';
        dvm.rangeClass = undefined;
        dvm.showDatatypeSelect = false;
        dvm.datatype = undefined;
        dvm.language = undefined;
        dvm.datatypeMap = {};

        var newClassMappingIdentifier = 'new';

        dvm.$onInit = function() {
            dvm.datatypeMap = pm.getDatatypeMap();
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
                    dvm.datatype = dvm.util.getPropertyId(dvm.selectedPropMapping, prefixes.delim + 'datatypeSpec');
                    if (dvm.datatype) {
                        dvm.showDatatypeSelect = true;
                        if (dvm.isLangString()) {
                            dvm.language = dvm.util.getPropertyValue(dvm.selectedPropMapping, prefixes.delim + 'languageSpec');
                        }
                    }
                }
            }
        }
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
                dvm.datatype = undefined;
                dvm.language = undefined;
                dvm.showDatatypeSelect = false;
            }
        }
        dvm.isLangString = function() {
            if (prefixes.rdf + 'langString' === dvm.datatype) {
                return true;
            } else {
                dvm.language = undefined;
                return false;
            }
        }
        dvm.clearDatatype = function() {
            dvm.showDatatypeSelect = false;
            dvm.datatype = undefined;
            dvm.language = undefined;
        }
        dvm.set = function() {
            if (dvm.state.newProp) {
                var additionsObj = _.find(dvm.state.mapping.difference.additions, {'@id': dvm.state.selectedClassMappingId});
                var propMap;
                var prop;
                if (dvm.om.isObjectProperty(dvm.selectedProp.propObj)) {
                    // Add range ClassMapping first
                    var classMappingId = getRangeClassMappingId();

                    // Add ObjectMapping pointing to new range class mapping
                    propMap = dvm.state.addObjectMapping(dvm.selectedProp, dvm.state.selectedClassMappingId, classMappingId);
                    prop = prefixes.delim + 'objectProperty';
                } else {
                    // Add the DataMapping pointing to the selectedColumn
                    propMap = dvm.state.addDataMapping(dvm.selectedProp, dvm.state.selectedClassMappingId, dvm.selectedColumn, dvm.datatype, dvm.language);
                    prop = prefixes.delim + 'dataProperty';
                }

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
                dvm.state.newProp = false;
            } else {
                if (mm.isDataMapping(dvm.selectedPropMapping)) {
                    var originalIndex = dvm.util.getPropertyValue(dvm.selectedPropMapping, prefixes.delim + 'columnIndex');
                    dvm.selectedPropMapping[prefixes.delim + 'columnIndex'][0]['@value'] = dvm.selectedColumn;
                    dvm.state.changeProp(dvm.selectedPropMapping['@id'], prefixes.delim + 'columnIndex', dvm.selectedColumn, originalIndex);

                    var originalDatatype = dvm.util.getPropertyId(dvm.selectedPropMapping, prefixes.delim + 'datatypeSpec');
                    if (dvm.datatype) {
                        dvm.selectedPropMapping[prefixes.delim + 'datatypeSpec'] = [{'@id': dvm.datatype}];
                        dvm.state.changeProp(dvm.selectedPropMapping['@id'], prefixes.delim + 'datatypeSpec', dvm.datatype, originalDatatype, true);
                    } else {
                        dvm.util.removePropertyId(dvm.selectedPropMapping, prefixes.delim + 'datatypeSpec', originalDatatype);
                    }

                    var originalLanguage = dvm.util.getPropertyValue(dvm.selectedPropMapping, prefixes.delim + 'languageSpec');
                    if (dvm.language) {
                        dvm.selectedPropMapping[prefixes.delim + 'languageSpec'] = [{'@value': dvm.language}];
                        dvm.state.changeProp(dvm.selectedPropMapping['@id'], prefixes.delim + 'languageSpec', dvm.language, originalLanguage);
                    }
                    if (!dvm.isLangString()) {
                        dvm.util.removePropertyValue(dvm.selectedPropMapping, prefixes.delim + 'languageSpec', originalLanguage);
                    }
                    _.remove(dvm.state.invalidProps, {'@id': dvm.state.selectedPropMappingId})
                } else {
                    var classMappingId = getRangeClassMappingId();
                    var originalClassMappingId = dvm.util.getPropertyId(dvm.selectedPropMapping, prefixes.delim + 'classMapping');
                    dvm.selectedPropMapping[prefixes.delim + 'classMapping'][0]['@id'] = classMappingId;
                    dvm.state.changeProp(dvm.selectedPropMapping['@id'], prefixes.delim + 'classMapping', classMappingId, originalClassMappingId);
                }
            }

            var selectedClassMappingId = dvm.state.selectedClassMappingId;
            dvm.state.resetEdit();
            dvm.state.selectedClassMappingId = selectedClassMappingId;
            dvm.close();
        }
        dvm.cancel = function() {
            dvm.state.newProp = false;
            dvm.dismiss();
        }

        function getRangeClassMappingId() {
            var classMappingId = dvm.rangeClassMappingId;
            if (dvm.rangeClassMappingId === newClassMappingIdentifier) {
                // Add a new ClassMapping for the range if that is what was selected
                classMappingId = dvm.state.addClassMapping(dvm.rangeClass)['@id'];
                if (!dvm.state.hasPropsSet(dvm.rangeClass.classObj['@id'])) {
                    dvm.state.setProps(dvm.rangeClass.classObj['@id']);
                }
            }
            return classMappingId;
        }
    }

    angular
        /**
         * @ngdoc overview
         * @name propMappingOverlay
         *
         * @description
         * The `propMappingOverlay` module only provides the `propMappingOverlay` component which creates content for a
         * modal to create or edit a PropertyMapping.
         */
        .module('propMappingOverlay', [])
        .component('propMappingOverlay', propMappingOverlayComponent);
})();

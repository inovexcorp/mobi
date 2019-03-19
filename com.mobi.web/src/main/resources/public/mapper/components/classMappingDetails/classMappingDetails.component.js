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
     * @name mapper.component:classMappingDetails
     * @requires shared.service:mappingManagerService
     * @requires shared.service:mapperStateService
     * @requires shared.service:delimitedManagerService
     * @requires shared.service:propertyManagerService
     * @requires shared.service:prefixes
     * @requires shared.service:utilService
     * @requires shared.service:modalService
     *
     * @description
     * `classMappingDetails` is a component that creates a div with sections to view and edit information about the
     * {@link shared.service:mapperStateService#selectedClassMappingId selected class mapping}. One section is for
     * viewing and editing the {@link mapper.component:iriTemplateOverlay IRI template} of the class mapping. Another
     * section is for viewing the list of property mappings associated with the class mapping, adding to that list,
     * editing items in the list, and removing from that list. The component houses methods for opening the modals for
     * {@link mapper.component:propMappingOverlay editing, adding}, and removing PropertyMappings.
     */
    const classMappingDetailsComponent = {
        templateUrl: 'mapper/components/classMappingDetails/classMappingDetails.component.html',
        bindings: {
            classMappingId: '<',
            changeClassMapping: '&',
            updateClassMappings: '&'
        },
        controllerAs: 'dvm',
        controller: classMappingDetailsComponentCtrl
    };

    classMappingDetailsComponentCtrl.$inject = ['utilService', 'prefixes', 'mappingManagerService', 'mapperStateService', 'delimitedManagerService', 'propertyManagerService', 'modalService'];

    function classMappingDetailsComponentCtrl(utilService, prefixes, mappingManagerService, mapperStateService, delimitedManagerService, propertyManagerService, modalService) {
        var dvm = this;
        var pm = propertyManagerService;
        var mm = mappingManagerService;
        var util = utilService;
        var dm = delimitedManagerService;
        dvm.state = mapperStateService;
        dvm.propMappings = [];
        dvm.iriTemplate = '';
        dvm.hasPropsToMap = false;

        dvm.$onChanges = function() {
            dvm.hasPropsToMap = dvm.state.hasPropsByClassMappingId(dvm.classMappingId);
            dvm.setPropMappings();
            dvm.setIriTemplate();
        }
        dvm.editIriTemplate = function() {
            modalService.openModal('iriTemplateOverlay', {}, dvm.setIriTemplate);
        }
        dvm.isInvalid = function(propMapping) {
            return !!_.find(dvm.state.invalidProps, {'@id': propMapping['@id']});
        }
        dvm.clickProperty = function(propMapping) {
            dvm.state.selectedPropMappingId = propMapping['@id'];
            dvm.state.highlightIndexes = [dvm.getLinkedColumnIndex(propMapping)];
        }
        dvm.setIriTemplate = function() {
            var classMapping = _.find(dvm.state.mapping.jsonld, {'@id': dvm.classMappingId});
            var prefix = util.getPropertyValue(classMapping, prefixes.delim + 'hasPrefix');
            var localName = util.getPropertyValue(classMapping, prefixes.delim + 'localName');
            dvm.iriTemplate = prefix + localName;
        }
        dvm.getPropValue = function(propMapping) {
            if (mm.isDataMapping(propMapping)) {
                return dm.getHeader(dvm.getLinkedColumnIndex(propMapping));
            } else {
                return util.getDctermsValue(_.find(dvm.state.mapping.jsonld, {'@id': dvm.getLinkedClassId(propMapping)}), 'title');
            }
        }
        dvm.getDataValuePreview = function(propMapping) {
            var firstRowIndex = dm.containsHeaders ? 1 : 0;
            return _.get(dm.dataRows, '[' + firstRowIndex + '][' + dvm.getLinkedColumnIndex(propMapping) + ']', '(None)');
        }
        dvm.getDatatypePreview = function(propMapping) {
            var props = dvm.state.getPropsByClassMappingId(dvm.classMappingId);
            var mapProp = util.getPropertyId(propMapping, prefixes.delim + 'hasProperty');
            var prop = _.find(props, {propObj: {'@id': mapProp}});
            var propIRI = util.getPropertyId(propMapping, prefixes.delim + 'datatypeSpec') || util.getPropertyId(prop.propObj, prefixes.rdfs + 'range') || prefixes.xsd + 'string';
            return util.getBeautifulIRI(propIRI);
        }
        dvm.getLanguagePreview = function(propMapping) {
            var languageObj = _.find(pm.languageList, {value: dvm.getLanguageTag(propMapping)});
            return languageObj ? languageObj.label : undefined;
        }
        dvm.getLanguageTag = function(propMapping) {
            return util.getPropertyValue(propMapping, prefixes.delim + 'languageSpec');
        }
        dvm.getLinkedClassId = function(propMapping) {
            return util.getPropertyId(propMapping, prefixes.delim + 'classMapping');
        }
        dvm.getLinkedColumnIndex = function(propMapping) {
            return util.getPropertyValue(propMapping, prefixes.delim + 'columnIndex');
        }
        dvm.switchClass = function(propMapping) {
            if (mm.isObjectMapping(propMapping)) {
                dvm.changeClassMapping({value: dvm.getLinkedClassId(propMapping)})
                dvm.state.selectedPropMappingId = '';
            }
        }
        dvm.addProp = function() {
            dvm.state.newProp = true;
            modalService.openModal('propMappingOverlay', {}, () => {
                dvm.setPropMappings();
                // In case the added prop added a class mapping
                dvm.updateClassMappings();
            });
        }
        dvm.editProp = function(propMapping) {
            dvm.state.selectedPropMappingId = propMapping['@id'];
            modalService.openModal('propMappingOverlay', {}, dvm.setPropMappings);
        }
        dvm.confirmDeleteProp = function(propMapping) {
            dvm.state.selectedPropMappingId = propMapping['@id'];
            modalService.openConfirmModal('<p>Are you sure you want to delete <strong>' + dvm.getEntityName(dvm.state.selectedPropMappingId) + '</strong> from <strong>' + dvm.getEntityName(dvm.state.selectedClassMappingId) + '</strong>?</p>', dvm.deleteProp);
        }
        dvm.getEntityName = function(id) {
            return util.getDctermsValue(_.find(dvm.state.mapping.jsonld, {'@id': id}), 'title');
        }
        dvm.deleteProp = function() {
            dvm.state.deleteProp(dvm.state.selectedPropMappingId, dvm.classMappingId);
            dvm.state.selectedPropMappingId = '';
            dvm.state.highlightIndexes = [];
            dvm.setPropMappings();
        }
        dvm.setPropMappings = function() {
            dvm.propMappings = _.map(mm.getPropMappingsByClass(dvm.state.mapping.jsonld, dvm.classMappingId), propMapping => {
                propMapping.isInvalid = dvm.isInvalid(propMapping);
                propMapping.title = util.getDctermsValue(propMapping, 'title');
                if (mm.isDataMapping(propMapping)) {
                    propMapping.dataMappingInfo = {
                        value: dvm.getPropValue(propMapping),
                        preview: dvm.getDataValuePreview(propMapping),
                        datatype: dvm.getDatatypePreview(propMapping),
                    };
                    var languageTag = dvm.getLanguageTag(propMapping);
                    if (languageTag) {
                        propMapping.language = {
                            preview: dvm.getLanguagePreview(propMapping),
                            tag: languageTag
                        };
                    }
                } else if (mm.isObjectMapping(propMapping)) {
                    propMapping.objectMappingInfo = {
                        value: dvm.getPropValue(propMapping)
                    };
                }
                return propMapping;
            });
            dvm.propMappings.sort((propMapping1, propMapping2) => propMapping1.title.localeCompare(propMapping2.title));
        }
    }

    angular.module('mapper')
        .component('classMappingDetails', classMappingDetailsComponent);
})();

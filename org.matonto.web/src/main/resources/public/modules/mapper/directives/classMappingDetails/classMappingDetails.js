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
         * @name classMappingDetails
         *
         * @description 
         * The `classMappingDetails` module only provides the `classMappingDetails` directive which creates
         * a number of different tools to view and edit information about a class mapping.
         */
        .module('classMappingDetails', [])
        /**
         * @ngdoc directive
         * @name classMappingDetails.directive:classMappingDetails
         * @scope
         * @restrict E
         * @requires ontologyManager.service:ontologyManagerService
         * @requires prefixes.service:prefixes
         *
         * @description 
         * `classMappingDetails` is a directive that creates a div with sections to view and edit information
         * about the {@link mapperState.service:mapperStateService#selectedClassMappingId selected class mapping}.
         * One section is for viewing and editing the IRI template of the class mapping. Another section is for
         * view the list of property mappings associated with the class mapping, adding to that list, editing 
         * items in the list, and removing from that list. The directive is replaced by the contents of its template.
         */
        .directive('classMappingDetails', classMappingDetails);

        classMappingDetails.$inject = ['prefixes', 'mappingManagerService', 'mapperStateService', 'ontologyManagerService', 'delimitedManagerService'];

        function classMappingDetails(prefixes, mappingManagerService, mapperStateService, ontologyManagerService, delimitedManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.state = mapperStateService;
                    dvm.mm = mappingManagerService;
                    dvm.om = ontologyManagerService;
                    dvm.dm = delimitedManagerService;

                    dvm.isInvalid = function(propMapping) {
                        return !!_.find(dvm.state.invalidProps, {'@id': propMapping['@id']});
                    }
                    dvm.getIriTemplate = function() {
                        var classMapping = _.find(dvm.state.mapping.jsonld, {'@id': dvm.state.selectedClassMappingId});
                        var prefix = _.get(classMapping, "['" + prefixes.delim + "hasPrefix'][0]['@value']", '');
                        var localName = _.get(classMapping, "['" + prefixes.delim + "localName'][0]['@value']", '');
                        return prefix + localName;
                    }
                    dvm.getPropName = function(propMapping) {
                        var propId = dvm.mm.getPropIdByMapping(propMapping);
                        return dvm.om.getEntityName(dvm.om.getEntity(_.get(dvm.mm.findSourceOntologyWithProp(propId, dvm.state.sourceOntologies), 'entities'), propId));
                    }
                    dvm.getClassName = function(classMapping) {
                        var classId = dvm.mm.getClassIdByMapping(classMapping);
                        return dvm.om.getEntityName(dvm.om.getEntity(_.get(dvm.mm.findSourceOntologyWithClass(classId, dvm.state.sourceOntologies), 'entities'), classId));
                    }
                    dvm.getPropValue = function(propMapping) {
                        if (dvm.mm.isDataMapping(propMapping)) {
                            return dvm.dm.getHeader(dvm.getLinkedColumnIndex(propMapping));
                        } else {
                            return dvm.getClassName(_.find(dvm.state.mapping.jsonld, {'@id': dvm.getLinkedClassId(propMapping)}));
                        }
                    }
                    dvm.getLinkedClassId = function(propMapping) {
                        return dvm.mm.isObjectMapping(propMapping) ? propMapping[prefixes.delim + 'classMapping'][0]['@id'] : '';
                    }
                    dvm.getLinkedColumnIndex = function(propMapping) {
                        return dvm.mm.isDataMapping(propMapping) ? propMapping[prefixes.delim + 'columnIndex'][0]['@value'] : '';
                    }
                    dvm.switchClass = function(propMapping) {
                        if (dvm.mm.isObjectMapping(propMapping)) {
                            dvm.state.selectedClassMappingId = dvm.getLinkedClassId(propMapping);
                            dvm.state.selectedPropMappingId = '';
                        }
                    }
                    dvm.addProp = function() {
                        dvm.state.updateAvailableColumns();
                        dvm.state.displayPropMappingOverlay = true;
                        dvm.state.newProp = true;
                    }
                    dvm.editProp = function(propMapping) {
                        dvm.state.selectedPropMappingId = propMapping['@id'];
                        dvm.state.updateAvailableColumns();
                        dvm.state.displayPropMappingOverlay = true;
                    }
                    dvm.deleteProp = function(propMapping) {
                        dvm.state.selectedPropMappingId = propMapping['@id'];
                        dvm.state.displayDeletePropConfirm = true;
                    }
                },
                templateUrl: 'modules/mapper/directives/classMappingDetails/classMappingDetails.html'
            }
        }
})();
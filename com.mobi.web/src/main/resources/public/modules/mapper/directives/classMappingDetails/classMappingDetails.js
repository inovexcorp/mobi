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
         * @requires mappingManager.service:mappingManagerService
         * @requires mapperState.service:mapperStateService
         * @requires delimitedManager.service:delimitedManagerService
         * @requires prefixes.service:prefixes
         * @requires util.service:utilService
         *
         * @description
         * `classMappingDetails` is a directive that creates a div with sections to view and edit information
         * about the {@link mapperState.service:mapperStateService#selectedClassMappingId selected class mapping}.
         * One section is for viewing and editing the IRI template of the class mapping. Another section is for
         * view the list of property mappings associated with the class mapping, adding to that list, editing
         * items in the list, and removing from that list. The directive is replaced by the contents of its template.
         */
        .directive('classMappingDetails', classMappingDetails);

        classMappingDetails.$inject = ['utilService', 'prefixes', 'mappingManagerService', 'mapperStateService', 'delimitedManagerService'];

        function classMappingDetails(utilService, prefixes, mappingManagerService, mapperStateService, delimitedManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.state = mapperStateService;
                    dvm.mm = mappingManagerService;
                    dvm.dm = delimitedManagerService;
                    dvm.util = utilService;

                    dvm.isInvalid = function(propMapping) {
                        return !!_.find(dvm.state.invalidProps, {'@id': propMapping['@id']});
                    }
                    dvm.getIriTemplate = function() {
                        var classMapping = _.find(dvm.state.mapping.jsonld, {'@id': dvm.state.selectedClassMappingId});
                        var prefix = dvm.util.getPropertyValue(classMapping, prefixes.delim + 'hasPrefix');
                        var localName = dvm.util.getPropertyValue(classMapping, prefixes.delim + 'localName');
                        return prefix + localName;
                    }
                    dvm.getPropName = function(propMapping) {
                        return dvm.util.getBeautifulIRI(dvm.mm.getPropIdByMapping(propMapping));
                    }
                    dvm.getClassName = function(classMapping) {
                        return dvm.util.getBeautifulIRI(dvm.mm.getClassIdByMapping(classMapping));
                    }
                    dvm.getPropValue = function(propMapping) {
                        if (dvm.mm.isDataMapping(propMapping)) {
                            return dvm.dm.getHeader(dvm.getLinkedColumnIndex(propMapping));
                        } else {
                            return dvm.getClassName(_.find(dvm.state.mapping.jsonld, {'@id': dvm.getLinkedClassId(propMapping)}));
                        }
                    }
                    dvm.getDataValuePreview = function(propMapping) {
                        var firstRowIndex = dvm.dm.containsHeaders ? 1 : 0;
                        return _.get(dvm.dm.dataRows, '[' + firstRowIndex + '][' + dvm.getLinkedColumnIndex(propMapping) + ']', '(None)');
                    }
                    dvm.getLinkedClassId = function(propMapping) {
                        return dvm.util.getPropertyId(propMapping, prefixes.delim + 'classMapping');
                    }
                    dvm.getLinkedColumnIndex = function(propMapping) {
                        return dvm.util.getPropertyValue(propMapping, prefixes.delim + 'columnIndex');
                    }
                    dvm.switchClass = function(propMapping) {
                        if (dvm.mm.isObjectMapping(propMapping)) {
                            dvm.state.selectedClassMappingId = dvm.getLinkedClassId(propMapping);
                            dvm.state.selectedPropMappingId = '';
                        }
                    }
                    dvm.addProp = function() {
                        dvm.state.displayPropMappingOverlay = true;
                        dvm.state.newProp = true;
                    }
                    dvm.editProp = function(propMapping) {
                        dvm.state.selectedPropMappingId = propMapping['@id'];
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

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
     * @name mapper.component:mappingPreview
     * @requires shared.service:prefixes
     * @requires shared.service:ontologyManagerService
     * @requires shared.service:mappingManagerService
     * @requires shared.service:mapperStateService
     *
     * @description
     * `mappingPreview` is a component that creates a "boxed" div with a preview of a mapping with its description,
     * source ontology, and all its mapped classes and properties.
     */
    const mappingPreviewComponent = {
        templateUrl: 'mapper/components/mappingPreview/mappingPreview.component.html',
        bindings: {
            mapping: '<',
            invalidProps: '<'
        },
        controllerAs: 'dvm',
        controller: mappingPreviewComponentCtrl
    };

    mappingPreviewComponentCtrl.$inject = ['prefixes', 'utilService', 'mappingManagerService'];

    function mappingPreviewComponentCtrl(prefixes, utilService, mappingManagerService) {
        var dvm = this;
        var util = utilService;
        var mm = mappingManagerService;
        dvm.classMappings = [];

        dvm.$onChanges = function() {
            dvm.classMappings = _.map(mm.getAllClassMappings(dvm.mapping.jsonld), originalClassMapping => {
                var classMapping = angular.copy(originalClassMapping);
                classMapping.title = util.getDctermsValue(classMapping, 'title');
                classMapping.iriTemplate = dvm.getIriTemplate(classMapping);
                classMapping.propMappings = _.map(mm.getPropMappingsByClass(dvm.mapping.jsonld, classMapping['@id']), originalPropMapping => {
                    var propMapping = angular.copy(originalPropMapping);
                    propMapping.title = util.getDctermsValue(propMapping, 'title');
                    propMapping.isInvalid = dvm.isInvalid(propMapping['@id']);
                    propMapping.value = dvm.getPropValue(propMapping);
                    return propMapping;
                }).sort((propMapping1, propMapping2) => propMapping1.title.localeCompare(propMapping2.title));
                return classMapping;
            }).sort((classMapping1, classMapping2) => classMapping1.title.localeCompare(classMapping2.title));
        }
        dvm.getIriTemplate = function(classMapping) {
            var prefix = util.getPropertyValue(classMapping, prefixes.delim + 'hasPrefix');
            var localName = util.getPropertyValue(classMapping, prefixes.delim + 'localName');
            return prefix + localName;
        }
        dvm.getPropValue = function(propMapping) {
            if (mm.isDataMapping(propMapping)) {
                return util.getPropertyValue(propMapping, prefixes.delim + 'columnIndex')
            } else {
                var classMapping = _.find(dvm.mapping.jsonld, {'@id': util.getPropertyId(propMapping, prefixes.delim + 'classMapping')});
                return util.getDctermsValue(classMapping, 'title');
            }
        }
        dvm.isInvalid = function(propMappingId) {
            return _.some(dvm.invalidProps, {'@id': propMappingId});
        }
    }

    angular.module('mapper')
        .component('mappingPreview', mappingPreviewComponent);
})();

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
     * @name mapper.component:fileUploadPage
     * @requires shared.service:delimitedManagerService
     * @requires shared.service:mapperStateService
     * @requires shared.service:mappingManagerService
     * @requires shared.service:utilService
     * @requires shared.service:modalService
     *
     * @description
     * `fileUploadPage` is a component that creates a Bootstrap `row` div with two columns containing
     * {@link shared.component:block blocks} for uploading and previewing delimited data. The left column contains a
     * block with a {@link mapper.component:fileUploadForm file upload form} and buttons to cancel the current workflow
     * or continue. If there are invalid property mapping in the current mapping, you can only continue if editing a
     * mapping. The right column contains a {@link mapper.component:previewDataGrid preview} of the loaded delimited
     * data.
     */
    const fileUploadPageComponent = {
        templateUrl: 'mapper/components/fileUploadPage/fileUploadPage.component.html',
        bindings: {},
        controllerAs: 'dvm',
        controller: fileUploadPageComponentCtrl
    };

    fileUploadPageComponentCtrl.$inject = ['mapperStateService', 'mappingManagerService', 'delimitedManagerService', 'utilService', 'modalService'];

    function fileUploadPageComponentCtrl(mapperStateService, mappingManagerService, delimitedManagerService, utilService, modalService) {
        var dvm = this;
        dvm.state = mapperStateService;
        dvm.mm = mappingManagerService;
        dvm.dm = delimitedManagerService;
        dvm.util = utilService;

        dvm.runMappingDownload = function() {
            modalService.openModal('runMappingDownloadOverlay', {}, undefined, 'sm');
        }
        dvm.runMappingDataset = function() {
            modalService.openModal('runMappingDatasetOverlay', {}, undefined, 'sm');
        }
        dvm.runMappingOntology = function() {
            modalService.openModal('runMappingOntologyOverlay');
        }
        dvm.getDataMappingName = function(dataMappingId) {
            var propMapping = _.find(dvm.state.mapping.jsonld, {'@id': dataMappingId});
            var classMapping = dvm.mm.findClassWithDataMapping(dvm.state.mapping.jsonld, dataMappingId)
            return dvm.mm.getPropMappingTitle(dvm.util.getDctermsValue(classMapping, 'title'), dvm.util.getDctermsValue(propMapping, 'title'));
        }
        dvm.cancel = function() {
            dvm.state.initialize();
            dvm.state.resetEdit();
            dvm.dm.reset();
        }
        dvm.edit = function() {
            var classMappings = dvm.mm.getAllClassMappings(dvm.state.mapping.jsonld);
            dvm.state.selectedClassMappingId = _.get(_.head(classMappings), '@id', '');
            _.forEach(_.uniq(_.map(classMappings, dvm.mm.getClassIdByMapping)), dvm.state.setProps);
            dvm.state.step = dvm.state.editMappingStep;
            if (dvm.state.newMapping) {
                modalService.openModal('mappingConfigOverlay', {}, undefined, 'lg');
            }
        }
    }

    angular.module('mapper')
        .component('fileUploadPage', fileUploadPageComponent);
})();

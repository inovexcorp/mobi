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
     * @ngdoc directive
     * @name editMappingPage.directive:editMappingPage
     * @requires shared.service:delimitedManagerService
     * @requires shared.service:mapperStateService
     * @requires shared.service:mappingManagerService
     * @requires shared.service:modalService
     *
     * @description
     * `editMappingPage` is a component that creates a Bootstrap `row` div with two columns containing
     * {@link shared.component:block blocks} for editing the current
     * {@link shared.service:mapperStateService#mapping mapping}. The left column contains either a block for
     * {@link mapper.component:editMappingForm editing} the mapping or a block for
     * {@link mapper.component:rdfPreviewForm previewing} the mapped data using the current state of the mapping. The
     * right column contains a {@link mapper.component:previewDataGrid preview} of the loaded delimited data. From here,
     * the user can choose to save the mapping and optionally run it against the loaded delimited data. The component
     * houses the method for opening a modal to confirm canceling a mapping.
     */
    const editMappingPageComponent = {
        templateUrl: 'mapper/components/editMappingPage/editMappingPage.component.html',
        bindings: {},
        controllerAs: 'dvm',
        controller: editMappingPageComponentCtrl
    };

    editMappingPageComponentCtrl.$inject = ['mapperStateService', 'mappingManagerService', 'delimitedManagerService', 'modalService'];

    function editMappingPageComponentCtrl(mapperStateService, mappingManagerService, delimitedManagerService, modalService) {
        var dvm = this;
        dvm.state = mapperStateService;
        dvm.mm = mappingManagerService;
        dvm.dm = delimitedManagerService;
        dvm.errorMessage = '';
        dvm.tabs = {
            edit: true,
            preview: false
        };

        dvm.runMappingDownload = function() {
            modalService.openModal('runMappingDownloadOverlay', {}, undefined, 'sm');
        }
        dvm.runMappingDataset = function() {
            modalService.openModal('runMappingDatasetOverlay', {}, undefined, 'sm');
        }
        dvm.runMappingOntology = function() {
            modalService.openModal('runMappingOntologyOverlay');
        }
        dvm.isSaveable = function() {
            return dvm.state.invalidProps.length === 0 && !!dvm.mm.getAllClassMappings(dvm.state.mapping.jsonld).length;
        }
        dvm.save = function() {
            if (dvm.state.isMappingChanged()) {
                dvm.state.saveMapping().then(success, onError);
            } else {
                success();
            }
        }
        dvm.cancel = function() {
            if (dvm.state.isMappingChanged()) {
                modalService.openConfirmModal('<p>Are you sure you want to cancel? Any current progress will be lost.</p>', dvm.reset);
            } else {
                success();
            }
        }
        dvm.reset = function() {
            dvm.state.initialize();
            dvm.state.resetEdit();
            dvm.dm.reset();
        }

        function onError(errorMessage) {
            dvm.errorMessage = errorMessage
        }
        function success() {
            dvm.errorMessage = '';
            dvm.state.step = dvm.state.selectMappingStep;
            dvm.state.initialize();
            dvm.state.resetEdit();
            dvm.dm.reset();
        }
    }

    angular.module('mapper')
        .component('editMappingPage', editMappingPageComponent);
})();

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
     * @name datasets.component:uploadDataOverlay
     * @requires shared.service:datasetManagerService
     * @requires shared.service:datasetStateService
     * @requires shared.service:utilService
     * @requires shared.service:httpService
     *
     * @description
     * `uploadDataOverlay` is a component that creates content for a modal with a form to select an RDF file to
     * import into the {@link shared.service:datasetStateService selected dataset}. Meant to be used in
     * conjunction with the {@link shared.service:modalService}.
     *
     * @param {Function} close A function that closes the modal
     * @param {Function} dismiss A function that dismisses the modal
     */
    const uploadDataOverlayComponent ={
        templateUrl: 'datasets/components/uploadDataOverlay/uploadDataOverlay.component.html',
        bindings: {
            close: '&',
            dismiss: '&'
        },
        controllerAs: 'dvm',
        controller: UploadDataOverlayComponentCtrl
    };

    uploadDataOverlayComponentCtrl.$inject = ['datasetManagerService', 'datasetStateService', 'utilService', 'httpService'];

    function UploadDataOverlayComponentCtrl(datasetManagerService, datasetStateService, utilService, httpService) {
        var dvm = this;
        var state = datasetStateService;
        var dm = datasetManagerService;
        var util = utilService;
        dvm.error = '';
        dvm.fileObj = undefined;
        dvm.datasetTitle = '';
        dvm.uploadId = 'upload-dataset-data';
        dvm.importing = false;

        dvm.$onInit = function() {
            dvm.datasetTitle = util.getDctermsValue(state.selectedDataset.record, 'title');
        }
        dvm.update = function(value) {
            dvm.fileObj = value;
        }
        dvm.submit = function() {
            dvm.importing = true;
            dm.uploadData(state.selectedDataset.record['@id'], dvm.fileObj, dvm.uploadId)
                .then(() => {
                    dvm.importing = false;
                    util.createSuccessToast("Data successfully uploaded to " + dvm.datasetTitle);
                    dvm.close();
                }, onError);
        }
        dvm.cancel = function() {
            httpService.cancel(dvm.uploadId);
            dvm.dismiss();
        }

        function onError(errorMessage) {
            dvm.importing = false;
            dvm.error = errorMessage;
        }
    }

    angular.module('datasets')
        .component('uploadDataOverlay', uploadDataOverlayComponent);
})();

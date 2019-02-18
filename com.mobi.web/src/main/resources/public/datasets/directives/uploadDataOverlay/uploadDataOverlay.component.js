(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name uploadDataOverlay
         *
         * @description
         * The `uploadDataOverlay` module only provides the `uploadDataOverlay` component which creates content for a
         * modal to upload data in a file into a Dataset.
         */
        .module('uploadDataOverlay', [])
        /**
         * @ngdoc component
         * @name uploadDataOverlay.component:uploadDataOverlay
         * @requires datasetManager.service:datasetManagerService
         * @requires datasetState.service:datasetStateService
         * @requires util.service:utilService
         * @requires http.service:httpService
         *
         * @description
         * `uploadDataOverlay` is a component that creates content for a modal with a form to select an RDF file to
         * import into the {@link datasetState.service:datasetStateService selected dataset}. Meant to be used in
         * conjunction with the {@link modalService.directive:modalService}.
         *
         * @param {Function} close A function that closes the modal
         * @param {Function} dismiss A function that dismisses the modal
         */
        .component('uploadDataOverlay', {
            bindings: {
                close: '&',
                dismiss: '&'
            },
            controllerAs: 'dvm',
            controller: ['datasetManagerService', 'datasetStateService', 'utilService', 'httpService', UploadDataOverlayController],
            templateUrl: 'datasets/directives/uploadDataOverlay/uploadDataOverlay.component.html',
        });

        function UploadDataOverlayController(datasetManagerService, datasetStateService, utilService, httpService) {
            var dvm = this;
            var state = datasetStateService;
            var dm = datasetManagerService;
            var util = utilService;
            dvm.error = '';
            dvm.fileObj = undefined;
            dvm.fileName = 'No file selected';
            dvm.datasetTitle = util.getDctermsValue(state.selectedDataset.record, 'title');
            dvm.uploadId = 'upload-dataset-data';
            dvm.importing = false;

            dvm.update = function() {
                dvm.fileName = dvm.fileObj.name;
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
})();

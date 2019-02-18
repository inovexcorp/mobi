(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name runMappingDatasetOverlay
         *
         * @description
         * The `runMappingDatasetOverlay` module only provides the `runMappingDatasetOverlay` component which creates
         * content for a modal to upload a mapping into a dataset.
         */
        .module('runMappingDatasetOverlay', [])
        /**
         * @ngdoc component
         * @name runMappingDatasetOverlay.component:runMappingDatasetOverlay
         * @requires mapperState.service:mapperStateService
         * @requires delimitedManager.service:delimitedManagerService
         * @requires datasetManager.service:datasetManagerService
         * @requires util.service:utilService
         *
         * @description
         * `runMappingDatasetOverlay` is a component that creates content for a modal that contains a configuration
         * settings for running the currently selected {@link mapperState.service:mapperStateService#mapping mapping}
         * against the uploaded {@link delimitedManager.service:delimitedManagerService#dataRows delimited data}.
         * This includes a `ui-select` to determine which dataset to upload the results of a mapping into. Meant to be
         * used in conjunction with the {@link modalService.directive:modalService}.
         *
         * @param {Function} close A function that closes the modal
         * @param {Function} dismiss A function that dismisses the modal
         */
        .component('runMappingDatasetOverlay', {
            bindings: {
                close: '&',
                dismiss: '&'
            },
            controllerAs: 'dvm',
            controller: ['mapperStateService', 'delimitedManagerService', 'datasetManagerService', 'utilService', RunMappingDatasetOverlayController],
            templateUrl: 'mapper/directives/runMappingDatasetOverlay/runMappingDatasetOverlay.component.html'
        });

        function RunMappingDatasetOverlayController(mapperStateService, delimitedManagerService, datasetManagerService, utilService) {
            var dvm = this;
            var dam = datasetManagerService;
            var state = mapperStateService;
            var dm = delimitedManagerService;
            dvm.util = utilService;
            dvm.errorMessage = '';
            dvm.datasetRecordIRI = '';
            dvm.datasetRecords = [];

            dam.getDatasetRecords().then(response => {
                dvm.datasetRecords = _.map(response.data, arr => dam.getRecordFromArray(arr));
            }, onError);

            dvm.run = function() {
                if (state.editMapping && state.isMappingChanged()) {
                    state.saveMapping().then(runMapping, onError);
                } else {
                    runMapping(state.mapping.record.id);
                }
            }
            dvm.cancel = function() {
                dvm.dismiss();
            }

            function onError(errorMessage) {
                dvm.errorMessage = errorMessage;
            }
            function runMapping(id) {
                state.mapping.record.id = id;
                dm.mapAndUpload(id, dvm.datasetRecordIRI).then(reset, onError);
            }
            function reset() {
                state.step = state.selectMappingStep;
                state.initialize();
                state.resetEdit();
                dm.reset();
                dvm.util.createSuccessToast('Successfully ran mapping');
                dvm.close();
            }
        }
})();

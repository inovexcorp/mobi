(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name downloadMappingOverlay
         *
         * @description
         * The `downloadMappingOverlay` module only provides the `downloadMappingOverlay` component which creates
         * content for a modal to download the a mapping.
         */
        .module('downloadMappingOverlay', [])
        /**
         * @ngdoc component
         * @name downloadMappingOverlay.directive:downloadMappingOverlay
         * @requires mappingManager.service:mappingManagerService
         * @requires mapperState.service:mapperStateService
         *
         * @description
         * `downloadMappingOverlay` is a component that content for a modal to download the current
         * {@link mapperState.service:mapperStateService#mapping mapping} in a variety of different formats using a
         * {@link mapperSerializationSelect.directive:mapperSerializationSelect mapperSerializationSelect}.
         *
         * @param {Function} close A function that closes the modal
         * @param {Function} dismiss A function that dismisses the modal
         */
        .component('downloadMappingOverlay', {
            bindings: {
                close: '&',
                dismiss: '&'
            },
            controllerAs: 'dvm',
            controller: ['mappingManagerService', 'mapperStateService', DownloadMappingOverlayController],
            templateUrl: 'mapper/directives/downloadMappingOverlay/downloadMappingOverlay.component.html'
        });

        function DownloadMappingOverlayController(mappingManagerService, mapperStateService) {
            var dvm = this;
            dvm.state = mapperStateService;
            dvm.mm = mappingManagerService;
            dvm.downloadFormat = 'turtle';

            dvm.cancel = function() {
                dvm.dismiss();
            }
            dvm.download = function() {
                dvm.mm.downloadMapping(dvm.state.mapping.record.id, dvm.downloadFormat);
                dvm.close();
            }
        }
})();

(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name classMappingOverlay
         *
         * @description
         * The `classMappingOverlay` module only provides the `classMappingOverlay` component which creates
         * creates content for a modal to add a ClassMapping to a mapping.
         */
        .module('classMappingOverlay', [])
        /**
         * @ngdoc directive
         * @name classMappingOverlay.component:classMappingOverlay
         * @requires mappingManager.service:mappingManagerService
         * @requires mapperState.service:mapperStateService
         *
         * @description
         * `classMappingOverlay` is a component that creates content for a modal that creates a ClassMapping in the
         * current {@link mapperState.service:mapperStateService#mapping mapping} and a preview of
         * the selected class. Meant to be used in conjunction with the {@link modalService.directive:modalService}.
         *
         * @param {Function} close A function that closes the modal
         * @param {Function} dismiss A function that dismisses the modal
         */
        .component('classMappingOverlay', {
            bindings: {
                close: '&',
                dismiss: '&'
            },
            controllerAs: 'dvm',
            controller: ['mapperStateService', 'mappingManagerService', ClassMappingOverlayController],
            templateUrl: 'mapper/directives/classMappingOverlay/classMappingOverlay.component.html'
        });

        function ClassMappingOverlayController(mapperStateService, mappingManagerService) {
            var dvm = this;
            var mm = mappingManagerService;
            dvm.state = mapperStateService;
            dvm.selectedClass = undefined;

            dvm.addClass = function() {
                var classMapping = dvm.state.addClassMapping(dvm.selectedClass);
                if (!dvm.state.hasPropsSet(dvm.selectedClass.classObj['@id'])) {
                    dvm.state.setProps(dvm.selectedClass.classObj['@id']);
                }
                dvm.state.resetEdit();
                dvm.state.selectedClassMappingId = classMapping['@id'];
                dvm.close();
            }
            dvm.cancel = function() {
                dvm.dismiss();
            }
        }
})();

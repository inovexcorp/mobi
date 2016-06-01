(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name mappingNameOverlay
         * @requires  mappingManager
         * @requires  mapperState
         *
         * @description 
         * The `mappingNameOverlay` module only provides the `mappingNameOverlay` directive which creates
         * an overlay with a {@link mappingNameInput.directive:mappingNameInput mappingNameInput} to edit a mapping name.
         */
        .module('mappingNameOverlay', ['mappingManager', 'mapperState'])
        /**
         * @ngdoc directive
         * @name mappingNameOverlay.directive:mappingNameOverlay
         * @scope
         * @restrict E
         * @requires  mappingManager.service:mappingManagerService
         * @requires  mapperState.service:mapperStateService
         *
         * @description 
         * `mappingNameOverlay` is a directive that creates an overlay containing a 
         * {@link mappingNameInput.directive:mappingNameInput mappingNameInput} to edit the currently selected mapping's 
         * name. The directive is replaced by the contents of its template.
         */
        .directive('mappingNameOverlay', mappingNameOverlay);

        mappingNameOverlay.$inject = ['mappingManagerService', 'mapperStateService']

        function mappingNameOverlay(mappingManagerService, mapperStateService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.state = mapperStateService;
                    dvm.manager = mappingManagerService;
                    dvm.newName = _.get(dvm.manager.mapping, 'name', '');

                    dvm.set = function() {
                        if (dvm.state.step === 0) {
                            dvm.state.step = 1;
                            dvm.manager.mapping.jsonld = dvm.manager.createNewMapping();
                        }
                        dvm.manager.mapping.name = dvm.newName;
                        dvm.state.editMappingName = false;
                    }
                    dvm.cancel = function() {
                        if (dvm.state.step === 0) {
                            dvm.state.editMapping = false;
                            dvm.state.newMapping = false;
                            dvm.manager.mapping = undefined;
                        }
                        dvm.state.editMappingName = false;
                    }
                },
                templateUrl: 'modules/mapper/directives/mappingNameOverlay/mappingNameOverlay.html'
            }
        }
})();

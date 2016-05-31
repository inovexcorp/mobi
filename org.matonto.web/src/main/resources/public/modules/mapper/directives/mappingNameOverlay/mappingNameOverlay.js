(function() {
    'use strict';

    angular
        .module('mappingNameOverlay', ['mappingManager', 'mapperState'])
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

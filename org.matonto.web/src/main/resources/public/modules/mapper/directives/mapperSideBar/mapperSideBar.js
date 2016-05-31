(function() {
    'use strict';

    angular
        .module('mapperSideBar', ['mapperState', 'mappingManager'])
        .directive('mapperSideBar', mapperSideBar);

        mapperSideBar.$inject = ['mapperStateService', 'mappingManagerService'];

        function mapperSideBar(mapperStateService, mappingManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.state = mapperStateService;
                    dvm.manager = mappingManagerService;

                    dvm.mappingList = function() {
                        dvm.state.displayCancelConfirm = dvm.state.editMapping;
                    }
                    dvm.createMapping = function() {
                        if (!dvm.state.editMapping) {
                            dvm.state.createMapping();
                        }
                        dvm.state.displayNewMappingConfirm = dvm.state.editMapping;
                    }
                    dvm.downloadMapping = function() {
                        dvm.manager.downloadMapping(dvm.manager.mapping.name);
                    }
                    dvm.addPropMapping = function() {
                        var classMappingId = dvm.state.selectedClassMappingId;
                        dvm.state.resetEdit();
                        dvm.state.newProp = true;
                        dvm.state.selectedClassMappingId = classMappingId;
                        dvm.state.updateAvailableProps();
                    }
                    dvm.deleteEntity = function() {
                        dvm.state.displayDeleteEntityConfirm = true;
                        dvm.state.deleteId = dvm.state.selectedPropMappingId || dvm.state.selectedClassMappingId;
                    }
                    dvm.deleteMapping = function() {
                        dvm.state.displayDeleteMappingConfirm = true;
                    }
                },
                templateUrl: 'modules/mapper/directives/mapperSideBar/mapperSideBar.html'
            }
        }
})();

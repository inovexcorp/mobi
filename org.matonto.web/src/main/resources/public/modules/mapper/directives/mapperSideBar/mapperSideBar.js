(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name mapperSideBar
         * @requires  mappingManager
         * @requires  mapperState
         *
         * @description 
         * The `mapperSideBar` module only provides the `mapperSideBar` directive which creates
         * a left navigation of action buttons for the mapping tool.
         */
        .module('mapperSideBar', ['mapperState', 'mappingManager'])
        /**
         * @ngdoc directive
         * @name mapperSideBar.directive:mapperSideBar
         * @scope
         * @restrict E
         * @requires  mappingManager.service:mappingManagerService
         * @requires  mapperState.service:mapperStateService
         *
         * @description 
         * `mapperSideBar` is a directive that creates a "left-nav" div with buttons for mapping
         * tool actions. These actions are navigating to the mapping list, creating a new mapping,
         * downloading a mapping, adding a property mapping, and deleting either an entity in a 
         * mapping or a mapping itself. The directive is replaced by the contents of its template.
         */
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
                            dvm.state.displayNewMappingConfirm = false;                            
                            dvm.state.createMapping();
                        } else {
                            dvm.state.displayNewMappingConfirm = true;                            
                        }
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

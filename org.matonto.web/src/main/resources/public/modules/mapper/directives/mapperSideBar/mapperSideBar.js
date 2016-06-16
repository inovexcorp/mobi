(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name mapperSideBar
         * @requires  mappingManager
         * @requires  mapperState
         * @requires ontologyManager
         *
         * @description 
         * The `mapperSideBar` module only provides the `mapperSideBar` directive which creates
         * a left navigation of action buttons for the mapping tool.
         */
        .module('mapperSideBar', ['mapperState', 'mappingManager', 'ontologyManager'])
        /**
         * @ngdoc directive
         * @name mapperSideBar.directive:mapperSideBar
         * @scope
         * @restrict E
         * @requires  mappingManager.service:mappingManagerService
         * @requires  mapperState.service:mapperStateService
         * @requires ontologyManager.service:ontologyManagerService
         *
         * @description 
         * `mapperSideBar` is a directive that creates a "left-nav" div with buttons for mapping
         * tool actions. These actions are navigating to the mapping list, creating a new mapping,
         * downloading a mapping, adding a property mapping, and deleting either an entity in a 
         * mapping or a mapping itself.
         */
        .directive('mapperSideBar', mapperSideBar);

        mapperSideBar.$inject = ['mapperStateService', 'mappingManagerService', 'ontologyManagerService'];

        function mapperSideBar(mapperStateService, mappingManagerService, ontologyManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.state = mapperStateService;
                    dvm.mm = mappingManagerService;
                    dvm.om = ontologyManagerService;

                    dvm.noOntologies = function() {
                        return _.concat(dvm.om.getList(), dvm.om.getOntologyIds()).length === 0;
                    }
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
                        dvm.mm.downloadMapping(dvm.mm.mapping.name);
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

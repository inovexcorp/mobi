/*-
 * #%L
 * org.matonto.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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

    angular
        /**
         * @ngdoc overview
         * @name mapperSideBar
         *
         * @description 
         * The `mapperSideBar` module only provides the `mapperSideBar` directive which creates
         * a left navigation of action buttons for the mapping tool.
         */
        .module('mapperSideBar', [])
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
                        dvm.mm.downloadMapping(dvm.mm.mapping.name, 'jsonld');
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

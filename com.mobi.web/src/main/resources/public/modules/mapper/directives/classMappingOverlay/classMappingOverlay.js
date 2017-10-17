/*-
 * #%L
 * com.mobi.web
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
         * @name classMappingOverlay
         *
         * @description
         * The `classMappingOverlay` module only provides the `classMappingOverlay` directive which creates
         * an overlay with functionality to create a class mapping in the current
         * {@link mapperState.service:mapperStateService#mapping mapping}.
         */
        .module('classMappingOverlay', [])
        /**
         * @ngdoc directive
         * @name classMappingOverlay.directive:classMappingOverlay
         * @scope
         * @restrict E
         * @requires mappingManager.service:mappingManagerService
         * @requires mapperState.service:mapperStateService
         *
         * @description
         * `classMappingOverlay` is a directive that creates an overlay with functionality to create a class
         * mapping in the current {@link mapperState.service:mapperStateService#mapping mapping} and a preview of
         * the selected class. You can only create a class mapping for a class that does not already have a class
         * mapping in the mapping. The directive is replaced by the contents of its template.
         */
        .directive('classMappingOverlay', classMappingOverlay);

        classMappingOverlay.$inject = ['mapperStateService', 'mappingManagerService'];

        function classMappingOverlay(mapperStateService, mappingManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.state = mapperStateService;
                    dvm.mm = mappingManagerService;
                    dvm.selectedClass = undefined;

                    dvm.addClass = function() {
                        var ontology = _.find(dvm.state.sourceOntologies, {id: dvm.selectedClass.ontologyId});
                        var classMapping = dvm.mm.addClass(dvm.state.mapping.jsonld, ontology.entities, dvm.selectedClass.classObj['@id']);
                        dvm.state.mapping.difference.additions.push(angular.copy(classMapping));
                        dvm.state.setAvailableProps(classMapping['@id']);
                        _.remove(dvm.state.availableClasses, dvm.selectedClass);
                        dvm.state.resetEdit();
                        dvm.state.selectedClassMappingId = classMapping['@id'];
                        dvm.state.displayClassMappingOverlay = false;
                    }
                    dvm.cancel = function() {
                        dvm.state.displayClassMappingOverlay = false;
                    }
                },
                templateUrl: 'modules/mapper/directives/classMappingOverlay/classMappingOverlay.html'
            }
        }
})();

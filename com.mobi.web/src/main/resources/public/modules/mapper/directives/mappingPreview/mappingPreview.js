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
         * @name mappingPreview
         *
         * @description
         * The `mappingPreview` module only provides the `mappingPreview` directive which creates
         * a "boxed" area with a preview of a mapping.
         */
        .module('mappingPreview', [])
        /**
         * @ngdoc directive
         * @name mappingPreview.directive:mappingPreview
         * @scope
         * @restrict E
         * @requires prefixes.service:prefixes
         * @requires ontologyManager.service:ontologyManagerService
         * @requires mappingManager.service:mappingManagerService
         * @requires mapperState.service:mapperStateService
         * @requires delimitedManager.service:delimitedManagerService
         *
         * @description
         * `mappingPreview` is a directive that creates a "boxed" div with a preview of a mapping with
         * its description, source ontology, and all its mapped classes and properties. The directive
         * is replaced bym the contents of its template.
         */
        .directive('mappingPreview', mappingPreview);

        mappingPreview.$inject = ['prefixes', 'utilService', 'mappingManagerService', 'mapperStateService', 'delimitedManagerService'];

        function mappingPreview(prefixes, utilService, mappingManagerService, mapperStateService, delimitedManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.state = mapperStateService;
                    dvm.mm = mappingManagerService;
                    dvm.dm = delimitedManagerService;
                    dvm.util = utilService;

                    dvm.getClassName = function(classMapping) {
                        return dvm.util.getBeautifulIRI(dvm.mm.getClassIdByMapping(classMapping));
                    }
                    dvm.getPropName = function(propMapping) {
                        return dvm.util.getBeautifulIRI(dvm.mm.getPropIdByMapping(propMapping));
                    }
                    dvm.getColumnIndex = function(propMapping) {
                        return dvm.util.getPropertyValue(propMapping, prefixes.delim + 'columnIndex');
                    }
                    dvm.isInvalid = function(propMappingId) {
                        return _.some(dvm.state.invalidProps, {'@id': propMappingId});
                    }
                },
                templateUrl: 'modules/mapper/directives/mappingPreview/mappingPreview.html'
            }
        }
})();

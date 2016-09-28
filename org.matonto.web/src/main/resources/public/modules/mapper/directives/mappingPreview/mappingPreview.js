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
         * @name mappingPreview
         *
         * @description 
         * The `mappingPreview` module only provides the `mappingPreview` directive which creates
         * a "boxed" area with a preview of a mapping and a button to select it.
         */
        .module('mappingPreview', [])
        /**
         * @ngdoc directive
         * @name mappingPreview.directive:mappingPreview
         * @scope
         * @restrict E
         * @requires  $q
         * @requires  ontologyManager.service:ontologyManagerService
         * @requires  mappingManager.service:mappingManagerService
         * @requires  mapperState.service:mapperStateService
         *
         * @description 
         * `mappingPreview` is a directive that creates a "boxed" div with a preview of a mapping with 
         * its source ontology and all its mapped classes and properties. It also provides a button to
         * select the mapping for mapping delimited data. The directive is replaced by the contents of 
         * its template.
         */
        .directive('mappingPreview', mappingPreview);

        mappingPreview.$inject = ['$q', 'prefixes', 'mappingManagerService', 'mapperStateService', 'ontologyManagerService', 'delimitedManagerService'];

        function mappingPreview($q, prefixes, mappingManagerService, mapperStateService, ontologyManagerService, delimitedManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.state = mapperStateService;
                    dvm.mm = mappingManagerService;
                    dvm.om = ontologyManagerService;
                    dvm.dm = delimitedManagerService;

                    dvm.ontologyExists = function() {
                        var objs = angular.copy(dvm.om.list);
                        var ids = _.union(dvm.om.ontologyIds, _.map(objs, 'ontologyId'));
                        return _.includes(ids, dvm.mm.getSourceOntologyId(dvm.mm.mapping.jsonld));
                    }
                    dvm.getClassName = function(classMapping) {
                        return dvm.om.getBeautifulIRI(dvm.mm.getClassIdByMapping(classMapping));
                    }
                    dvm.getPropName = function(propMapping) {
                        return dvm.om.getBeautifulIRI(dvm.mm.getPropIdByMapping(propMapping));
                    }
                    dvm.getColumnIndex = function(propMapping) {
                        return propMapping[prefixes.delim + 'columnIndex'][0]['@value'];
                    }
                    dvm.isInvalid = function(propMappingId) {
                        return !!_.find(dvm.state.invalidProps, {'@id': propMappingId});
                    }
                },
                templateUrl: 'modules/mapper/directives/mappingPreview/mappingPreview.html'
            }
        }
})();

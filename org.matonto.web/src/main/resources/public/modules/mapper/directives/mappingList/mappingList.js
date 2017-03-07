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
         * @name mappingList
         *
         * @description
         * The `mappingList` module only provides the `mappingList` directive which creates
         * a "boxed" area with a list of saved mappings in the repository.
         */
        .module('mappingList', [])
        /**
         * @ngdoc directive
         * @name mappingList.directive:mappingList
         * @scope
         * @restrict E
         * @requires  mappingManager.service:mappingManagerService
         * @requires  mapperState.service:mapperStateService
         *
         * @description
         * `mappingList` is a directive that creates a div with an unordered list of the
         * all the saved mappings in the repository. Each mapping name is clickable and sets the
         * selected {@link mapperState.service:mapperStateService#mapping mapping} for the mapping
         * tool. The list will also be filtered by the
         * {@link mapperState.service:mapperStateService#mappingSearchString mappingSearchString}.
         * The directive is replaced by the contents of its template.
         */
        .directive('mappingList', mappingList);

        mappingList.$inject = ['utilService', 'mappingManagerService', 'mapperStateService', 'catalogManagerService', 'prefixes', '$q'];

        function mappingList(utilService, mappingManagerService, mapperStateService, catalogManagerService, prefixes, $q) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    var openedMappings = [];
                    dvm.state = mapperStateService;
                    dvm.mm = mappingManagerService;
                    dvm.cm = catalogManagerService;
                    dvm.util = utilService;

                    dvm.onClick = function(id) {
                        var openedMapping = _.find(openedMappings, {id: id});
                        if (openedMapping) {
                            dvm.state.mapping = openedMapping;
                        } else {
                            dvm.mm.getMapping(id).then(jsonld => {
                                var mapping = {
                                    jsonld,
                                    id,
                                    record: undefined
                                };
                                dvm.state.mapping = mapping;
                                openedMappings.push(mapping);
                                return dvm.cm.getRecord(_.get(dvm.mm.getSourceOntologyInfo(jsonld), 'recordId'), dvm.cm.localCatalog['@id']);
                            }, error => $q.reject('Mapping ' + id + ' could not be found')).then(record => {
                                dvm.state.mapping.record = _.pick(record, ['@id', '@type', prefixes.dcterms + 'title', prefixes.dcterms + 'description', prefixes.dcterms + 'issued', prefixes.dcterms + 'modified', prefixes.catalog + 'keyword'])
                            }, dvm.util.createErrorToast);
                        }
                        _.remove(openedMappings, mapping => dvm.mm.mappingIds.indexOf(mapping.id) < 0);
                    }
                },
                templateUrl: 'modules/mapper/directives/mappingList/mappingList.html'
            }
        }
})();

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
         * @name mappingListBlock
         *
         * @description
         * The `mappingListBlock` module only provides the `mappingListBlock` directive which creates a "boxed" area
         * with a list of saved mappings in the repository.
         */
        .module('mappingListBlock', [])
        .config(['$qProvider', function($qProvider) {
            $qProvider.errorOnUnhandledRejections(false);
        }])
        /**
         * @ngdoc directive
         * @name mappingListBlock.directive:mappingListBlock
         * @scope
         * @restrict E
         * @requires mappingManager.service:mappingManagerService
         * @requires mapperState.service:mapperStateService
         * @requires catalogManager.service:catalogManagerService
         * @requires prefixes.service:prefixes
         * @requires modal.service:modalService
         *
         * @description
         * `mappingListBlock` is a directive that creates a div with an unordered list of the all the saved mappings in
         * the repository. Each mapping name is clickable and sets the selected
         * {@link mapperState.service:mapperStateService#mapping mapping} for the mapping tool. The list will also be
         * filtered by the {@link mapperState.service:mapperStateService#mappingSearchString mappingSearchString}. Also
         * includes a button for {@link createMappingOverlay.component:createMappingOverlay creating a mapping}. The
         * directive houses the method for opening a modal to confirm deleting a mapping. The directive is replaced by
         * the contents of its template.
         */
        .directive('mappingListBlock', mappingListBlock);

        mappingListBlock.$inject = ['$q', 'utilService', 'mappingManagerService', 'mapperStateService', 'catalogManagerService', 'prefixes', 'modalService'];

        function mappingListBlock($q, utilService, mappingManagerService, mapperStateService, catalogManagerService, prefixes, modalService) {
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
                    dvm.list = [];

                    dvm.confirmDeleteMapping = function() {
                        modalService.openConfirmModal('<p>Are you sure you want to delete <strong>' + dvm.state.mapping.record.title + '</strong>?</p>', dvm.deleteMapping);
                    }
                    dvm.createMapping = function() {
                        dvm.state.mapping = undefined;
                        modalService.openModal('createMappingOverlay');
                    }
                    dvm.deleteMapping = function() {
                        dvm.mm.deleteMapping(dvm.state.mapping.record.id)
                            .then(() => {
                                _.remove(openedMappings, {record: {id: dvm.state.mapping.record.id}});
                                dvm.state.mapping = undefined;
                                dvm.state.sourceOntologies = [];
                                setRecords();
                            }, dvm.util.createErrorToast);
                    }
                    dvm.onClick = function(record) {
                        var openedMapping = _.find(openedMappings, {record: {id: record.id}});
                        if (openedMapping) {
                            dvm.state.mapping = openedMapping;
                        } else {
                            dvm.mm.getMapping(record.id)
                                .then(jsonld => {
                                    var mapping = {
                                        jsonld,
                                        record,
                                        difference: {
                                            additions: [],
                                            deletions: []
                                        }
                                    };
                                    dvm.state.mapping = mapping;
                                    openedMappings.push(mapping);
                                    return dvm.cm.getRecord(_.get(dvm.mm.getSourceOntologyInfo(jsonld), 'recordId'), dvm.cm.localCatalog['@id']);
                                }, error => $q.reject('Mapping ' + record.title + ' could not be found'))
                                .then(ontologyRecord => {
                                    dvm.state.mapping.ontology = ontologyRecord;
                                }, errorMessage => dvm.util.createErrorToast(_.startsWith(errorMessage, 'Mapping') ? errorMessage : 'Ontology could not be found'));
                        }
                    }

                    setRecords();

                    function setRecords() {
                        dvm.mm.getMappingRecords()
                            .then(records => {
                                dvm.list = _.map(records, record => {
                                    return {
                                        id: record['@id'],
                                        title: dvm.util.getDctermsValue(record, 'title'),
                                        description: dvm.util.getDctermsValue(record, 'description'),
                                        keywords: _.map(_.get(record, "['" + prefixes.catalog + "keyword']", []), '@value'),
                                        branch: dvm.util.getPropertyId(record, prefixes.catalog + 'masterBranch')
                                    };
                                });
                            }, dvm.util.createErrorToast);
                    }
                },
                templateUrl: 'mapper/directives/mappingListBlock/mappingListBlock.directive.html'
            }
        }
})();

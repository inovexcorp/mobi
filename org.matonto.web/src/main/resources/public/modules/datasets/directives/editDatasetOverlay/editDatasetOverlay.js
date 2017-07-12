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
         * @name editDatasetOverlay
         *
         * @description
         * The `editDatasetOverlay` module only provides the `editDatasetOverlay` directive which creates
         * creates overlays with forms to create a Dataset Record.
         */
        .module('editDatasetOverlay', [])
        /**
         * @ngdoc directive
         * @name editDatasetOverlay.directive:newDatasetOverlay
         * @scope
         * @restrict E
         * @requires datasetManager.service:datasetManagerService
         * @requires datasetState.service:datasetStateService
         * @requires catalogManager.service:catalogManagerService
         * @requires util.service:utilService
         * @requires prefixes.service:prefixes
         *
         * @description
         * `editDatasetOverlay` is a directive that creates overlays with form containing fields for creating
         * a new Dataset Record. The first overlay contains fields for the title, repository id, dataset IRI,
         * description, and {@link keywordSelect.directive:keywordSelect keywords}. The repository id is a static
         * field for now. The close functionality of the first overlay is controlled by a passed function. The second
         * overlay contains a searchable list of Ontology Records that can be linked to the new Dataset Record.
         *
         * @param {Function} onClose The method to be called when closing the overlay
         */
        .directive('editDatasetOverlay', editDatasetOverlay);

        editDatasetOverlay.$inject = ['datasetManagerService', 'datasetStateService', 'catalogManagerService', 'utilService', 'prefixes', 'uuid', '$q'];

        function editDatasetOverlay(datasetManagerService, datasetStateService, catalogManagerService, utilService, prefixes, uuid, $q) {
            return {
                restrict: 'E',
                templateUrl: 'modules/datasets/directives/editDatasetOverlay/editDatasetOverlay.html',
                scope: {},
                bindToController: {
                    onClose: '&',
                    dataset: '='
                },
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var state = datasetStateService;
                    var dm = datasetManagerService;
                    var cm = catalogManagerService;
                    
                    dvm.util = utilService;
                    dvm.error = '';
                    
                    dvm.recordConfig = {
                        title: dvm.util.getPropertyValue(dvm.dataset.record, prefixes.dcterms + 'title'),
                        repositoryId: dvm.util.getPropertyValue(dvm.dataset.record, prefixes.dataset + 'repository'),
                        datasetIRI: dvm.dataset.record['@id'],
                        description: dvm.util.getPropertyValue(dvm.dataset.record, prefixes.dcterms + 'description')
                    };
                    dvm.keywords = _.map(_.get(dvm.dataset.record, prefixes.catalog + 'keyword', []), '@value').sort();
                    dvm.ontologySearchConfig = {
                        pageIndex: 0,
                        sortOption: _.find(cm.sortOptions, {field: prefixes.dcterms + 'title', ascending: true}),
                        recordType: prefixes.ontologyEditor + 'OntologyRecord',
                        limit: 10,
                        searchText: ''
                    };
                    dvm.totalSize = 0;
                    dvm.links = {
                        next: '',
                        prev: ''
                    };
                    dvm.ontologies = [];
                    dvm.selectedOntologies = [];

                    _.forEach(_.map(dvm.dataset.identifiers, identifier => identifier[prefixes.dataset + 'linksToRecord'][0]['@id']), 
                        ontologyId => cm.getRecord(ontologyId, cm.localCatalog['@id']).then(ontology => dvm.selectedOntologies.push(ontology), onError)
                    );

                    dvm.getOntologies = function() {
                        dvm.ontologySearchConfig.pageIndex = 0;
                        cm.getRecords(cm.localCatalog['@id'], dvm.ontologySearchConfig).then(parseOntologyResults, errorMessage => {
                            dvm.ontologies = [];
                            dvm.links = {
                                next: '',
                                prev: ''
                            };
                            dvm.totalSize = 0;
                            onError(errorMessage);
                        });
                    }
                    dvm.update = function() {
                        dvm.dataset.record[prefixes.catalog + 'keyword'] = _.map(dvm.keywords, _.trim);
                        dvm.dataset.record[prefixes.dcterms + 'description'] = dvm.recordConfig.description.trim();
                        
                        var curOntologies = _.map(dvm.selectedOntologies, o => _.get(o, '@id'));
                        var oldOntologies = _.map(dvm.dataset.identifiers, r => _.get(_.get(r, prefixes.dataset + 'linksToRecord')[0], '@id'));
                        
                        var added = _.difference(curOntologies, oldOntologies);
                        var deleted = _.difference(oldOntologies, curOntologies);
                        
                        _.forEach(deleted, id => {
                            var identifier = _.find(dvm.dataset.identifiers, o => { if(_.get(o[prefixes.dataset + 'linksToRecord'][0], '@id') === id) return o; });
                            if (identifier) {
                                _.remove(dvm.dataset.identifiers, identifier);
                                _.remove(dvm.dataset.record[prefixes.dataset + 'ontology'], o => _.get(o, '@id') === _.get(identifier, '@id'));
                            }
                        });
                        
                        createBlankNodes(added);
                    }
                    dvm.isSelected = function(ontologyId) {
                        return _.some(dvm.selectedOntologies, {'@id': ontologyId});
                    }
                    dvm.selectOntology = function(ontology) {
                        if (!dvm.isSelected(ontology['@id'])) {
                            dvm.selectedOntologies.push(ontology);
                        }
                    }
                    dvm.unselectOntology = function(ontologyId) {
                        _.remove(dvm.selectedOntologies, {'@id': ontologyId});
                    }

                    function onError(errorMessage) {
                        dvm.error = errorMessage;
                    }
                    function parseOntologyResults(response) {
                        dvm.ontologies = response.data;
                        var headers = response.headers();
                        dvm.totalSize = _.get(headers, 'x-total-count', 0);
                        var links = dvm.util.parseLinks(_.get(headers, 'link', ''));
                        dvm.links.prev = _.get(links, 'prev', '');
                        dvm.links.next = _.get(links, 'next', '');
                        dvm.error = '';
                    }
                    function createBlankNodes(ontologyIds) {
                        var ontologyId = _.head(ontologyIds);
                        var ontology = _.find(dvm.selectedOntologies, o => {if(_.get(o, '@id') === ontologyId) return o});
                        var recordId = _.get(ontology, '@id');
                        var branchId = _.get(_.get(ontology, prefixes.catalog + 'branch')[0], '@id');
                        
                        cm.getBranchHeadCommit(branchId, recordId, cm.localCatalog['@id']).then(response => {
                            var id = '_:matonto/bnode/' + uuid.v4();
                            dvm.dataset.identifiers.push(createBlankNode(id, recordId, branchId, response.commit['@id']));
                            dvm.dataset.record[prefixes.dataset + 'ontology'].push(angular.fromJson('{ "@id": "' + id + '" }'));
                            if (ontologyIds.length > 1) {
                                createBlankNodes(_.tail(ontologyIds));
                            } else {
                                cm.updateRecord(_.get(dvm.dataset.record, '@id'), cm.localCatalog['@id'], dvm.dataset).then(() => { 
                                    // TODO: Close overlay...
                                }, onError);
                            }
                        }, onError);

                    }
                    function createBlankNode(id, recordId, branchId, commitId) {
                        var jsonString = '{\n\t"@id": "' + id + '",\n\t"' 
                                + prefixes.dataset + 'linksToRecord":[{"@id": "' + recordId + '"}],\n\t"'
                                + prefixes.dataset + 'linksToBranch":[{"@id": "' + branchId + '"}],\n\t"'
                                + prefixes.dataset + 'linksToCommit":[{"@id": "' + commitId + '"}]\n}';

                        return angular.fromJson(jsonString);
                    }
                }
            }
        }
})();

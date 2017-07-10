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

        editDatasetOverlay.$inject = ['datasetManagerService', 'datasetStateService', 'catalogManagerService', 'utilService', 'prefixes'];

        function editDatasetOverlay(datasetManagerService, datasetStateService, catalogManagerService, utilService, prefixes) {
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
                    dvm.create = function() {
                        dvm.recordConfig.keywords = _.map(dvm.keywords, _.trim);
                        dvm.recordConfig.ontologies = _.map(dvm.selectedOntologies, '@id');
                        dm.createDatasetRecord(dvm.recordConfig)
                            .then(() => {
                                dvm.util.createSuccessToast('Dataset successfully created');
                                state.setResults();
                                dvm.onClose();
                            }, onError);
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
                }
            }
        }
})();

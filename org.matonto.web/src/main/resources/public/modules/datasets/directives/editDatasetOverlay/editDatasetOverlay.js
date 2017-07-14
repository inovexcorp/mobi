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
         * creates overlays with a form to edit a Dataset Record.
         */
        .module('editDatasetOverlay', [])
        /**
         * @ngdoc directive
         * @name editDatasetOverlay.directive:editDatasetOverlay
         * @scope
         * @restrict E
         * @requires datasetState.service:datasetStateService
         * @requires catalogManager.service:catalogManagerService
         * @requires util.service:utilService
         * @requires prefixes.service:prefixes
         *
         * @description
         * `editDatasetOverlay` is a directive that creates overlays with form containing fields for editing
         * an existing Dataset Record. The first overlay contains fields for the title, description, 
         * {@link keywordSelect.directive:keywordSelect keywords}, and  a searchable list of Ontology Records that can 
         * be linked to the Dataset Record.
         *
         * @param {Function} onClose The method to be called when closing the overlay
         * @param {Object} dataset The dataset record with associated ontology information.
         */
        .directive('editDatasetOverlay', editDatasetOverlay);

        editDatasetOverlay.$inject = ['datasetStateService', 'catalogManagerService', 'utilService', 'prefixes', '$q'];

        function editDatasetOverlay(datasetStateService, catalogManagerService, utilService, prefixes, $q) {
            return {
                restrict: 'E',
                templateUrl: 'modules/datasets/directives/editDatasetOverlay/editDatasetOverlay.html',
                scope: {},
                bindToController: {
                    onClose: '&',
                    dataset: '<'
                },
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var cm = catalogManagerService;
                    var ds = datasetStateService;
                    
                    dvm.util = utilService;
                    dvm.error = '';
                    
                    dvm.recordConfig = {
                        datasetIRI: dvm.util.getPropertyValue(dvm.dataset.record, prefixes.dataset + 'dataset'),
                        repositoryId: dvm.util.getPropertyValue(dvm.dataset.record, prefixes.dataset + 'repository'),
                        title: dvm.util.getDctermsValue(dvm.dataset.record, 'title'),
                        description: dvm.util.getDctermsValue(dvm.dataset.record, 'description')
                    };
                    
                    dvm.keywords = [];
                    _.forEach(dvm.dataset.record[prefixes.catalog + 'keyword'], kw => dvm.keywords.push(kw['@value']));
                    dvm.keywords.sort();
                    
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
                    dvm.step = 0;

                    dvm.getOntologies = function() {
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
                    dvm.getRecordPage = function(direction) {
                        if (direction === 'prev') {
                            dvm.util.getResultsPage(dvm.links.prev).then(response => {
                                dvm.ontologySearchConfig.pageIndex -= 1;
                                parseOntologyResults(response);
                            }, onError);
                        } else {
                            dvm.util.getResultsPage(dvm.links.next).then(response => {
                                dvm.ontologySearchConfig.pageIndex += 1;
                                parseOntologyResults(response);
                            }, onError);
                        }
                    }
                    dvm.update = function() {
                        dvm.dataset.record[prefixes.dcterms + 'title'] = [];
                        dvm.dataset.record[prefixes.dcterms + 'description'] = [];
                        dvm.dataset.record[prefixes.dcterms + 'description'] = [];
                        dvm.dataset.record[prefixes.catalog + 'keyword'] = [];

                        dvm.util.setDctermsValue(dvm.dataset.record, 'title', dvm.recordConfig.title.trim());
                        dvm.util.setDctermsValue(dvm.dataset.record, 'description', dvm.recordConfig.description.trim());
                        _.forEach(dvm.keywords, kw => dvm.util.setPropertyValue(dvm.dataset.record, prefixes.catalog + 'keyword', kw.trim()));

                        var curOntologies = _.map(dvm.selectedOntologies, '@id');
                        var oldOntologies = [];
                        
                        _.forEach(dvm.dataset.identifiers, identifier => {
                            var propertyIRI = prefixes.dataset + 'linksToRecord';
                            oldOntologies.push(dvm.util.getPropertyId(identifier, propertyIRI));
                        });

                        var added = _.difference(curOntologies, oldOntologies);
                        var deleted = _.difference(oldOntologies, curOntologies);

                        _.forEach(deleted, id => {
                            var identifier = _.find(dvm.dataset.identifiers, o => { 
                                if (dvm.util.getPropertyId(o, prefixes.dataset + 'linksToRecord') === id) { 
                                    return o;
                                } 
                            });
                            if (identifier) {
                                _.remove(dvm.dataset.identifiers, identifier);
                                _.remove(dvm.dataset.record[prefixes.dataset + 'ontology'], o => o['@id'] === identifier['@id']);
                            }
                        });
                        
                        if (added.length > 0) {
                            $q.all(_.map(added, record => cm.getRecordMasterBranch(record['@id'], cm.localCatalog['@id'])))
                                    .then(responses => {
                                        _.forEach(responses, branch => {
                                            console.error(branch);
                                            var id = dvm.util.getIdForBlankNode();
                                            var ontologyRecord = _.find(dvm.ontologies, {[prefixes.catalog + 'branch']: [{'@id': branch['@id']}]});
                                            var recordId = ontologyRecord['@id'];

                                            dvm.util.setPropertyId(dvm.dataset.record, prefixes.dataset + 'ontology', id);
                                            dvm.dataset.identifiers.push(createBlankNode(id, recordId, branch['@id'], 
                                                    dvm.util.getPropertyId(branch, prefixes.catalog + 'head')));
                                        });
                                        triggerUpdate();
                                    }, onError);
                        } else {
                            triggerUpdate();
                        }
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
                    function createBlankNode(id, recordId, branchId, commitId) {
                        return {
                                "@id": id,
                                [prefixes.dataset + 'linksToRecord']: [{ "@id": recordId }],
                                [prefixes.dataset + 'linksToBranch']: [{ "@id": branchId }],
                                [prefixes.dataset + 'linksToCommit']: [{ "@id": commitId }]
                            }
                    }
                    function triggerUpdate() {
                        // Unparse the JSON object...
                        var jsonld = _.concat(dvm.dataset.identifiers, dvm.dataset.record);
                        
                        // Send unparsed object to the update endpoint.
                        cm.updateRecord(dvm.dataset.record['@id'], cm.localCatalog['@id'], jsonld).then(() => { 
                            dvm.util.createSuccessToast('Dataset successfully updated');
                            ds.setResults();
                            dvm.onClose();
                        }, onError);
                    }
                    dvm.getOntologies(); // Populate the list automatically...
                    
                    var sol = _.map(dvm.dataset.identifiers, identifier => dvm.util.getPropertyId(identifier, prefixes.dataset + 'linksToRecord'));
                    _.forEach(sol, id => {
                        var ontology = _.find(dvm.ontologies, o => { if (o['@id'] === id) { return o; }});
                        if (ontology) {
                            dvm.selectedOntologies.push(ontology);
                        } else {
                            cm.getRecord(id, cm.localCatalog['@id']).then(ontology => dvm.selectedOntologies.push(ontology), onError);
                        }
                    });
                }
            }
        }
})();

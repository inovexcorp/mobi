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
         */
        .directive('editDatasetOverlay', editDatasetOverlay);

        editDatasetOverlay.$inject = ['datasetStateService', 'catalogManagerService', 'utilService', 'prefixes', '$q'];

        function editDatasetOverlay(datasetStateService, catalogManagerService, utilService, prefixes, $q) {
            return {
                restrict: 'E',
                templateUrl: 'modules/datasets/directives/editDatasetOverlay/editDatasetOverlay.html',
                scope: {},
                bindToController: {
                    onClose: '&'
                },
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var cm = catalogManagerService;
                    var ds = datasetStateService;
                    
                    dvm.util = utilService;
                    dvm.error = '';
                    
                    dvm.recordConfig = {
                        datasetIRI: dvm.util.getPropertyId(ds.selectedDataset.record, prefixes.dataset + 'dataset'),
                        repositoryId: dvm.util.getPropertyValue(ds.selectedDataset.record, prefixes.dataset + 'repository'),
                        title: dvm.util.getDctermsValue(ds.selectedDataset.record, 'title'),
                        description: dvm.util.getDctermsValue(ds.selectedDataset.record, 'description')
                    };
                    
                    dvm.keywords = [];
                    _.forEach(ds.selectedDataset.record[prefixes.catalog + 'keyword'], kw => dvm.keywords.push(kw['@value']));
                    dvm.keywords.sort();
                    dvm.ontologies = [];
                    dvm.selectedOntologies = [];
                    
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
                        ds.selectedDataset.record[prefixes.dcterms + 'title'] = [];
                        ds.selectedDataset.record[prefixes.dcterms + 'description'] = [];
                        ds.selectedDataset.record[prefixes.dcterms + 'description'] = [];
                        ds.selectedDataset.record[prefixes.catalog + 'keyword'] = [];

                        dvm.util.setDctermsValue(ds.selectedDataset.record, 'title', dvm.recordConfig.title.trim());
                        dvm.util.setDctermsValue(ds.selectedDataset.record, 'description', dvm.recordConfig.description.trim());
                        _.forEach(dvm.keywords, kw => dvm.util.setPropertyValue(ds.selectedDataset.record, prefixes.catalog + 'keyword', kw.trim()));

                        var curOntologies = _.map(dvm.selectedOntologies, '@id');
                        var oldOntologies = [];
                        
                        _.forEach(ds.selectedDataset.identifiers, identifier => {
                            var propertyIRI = prefixes.dataset + 'linksToRecord';
                            oldOntologies.push(dvm.util.getPropertyId(identifier, propertyIRI));
                        });

                        var added = _.difference(curOntologies, oldOntologies);
                        var deleted = _.difference(oldOntologies, curOntologies);

                        _.forEach(deleted, id => {
                            var identifier = _.find(ds.selectedDataset.identifiers, o => { 
                                if (dvm.util.getPropertyId(o, prefixes.dataset + 'linksToRecord') === id) { 
                                    return o;
                                } 
                            });
                            if (identifier) {
                                _.remove(ds.selectedDataset.identifiers, identifier);
                                _.remove(ds.selectedDataset.record[prefixes.dataset + 'ontology'], o => o['@id'] === identifier['@id']);
                            }
                        });
                        
                        if (added.length > 0) {
                            $q.all(_.map(added, record => cm.getRecordMasterBranch(record, cm.localCatalog['@id'])))
                                    .then(responses => {
                                        _.forEach(responses, branch => {
                                            var id = dvm.util.getIdForBlankNode();
                                            var ontologyRecord = _.find(dvm.ontologies, {[prefixes.catalog + 'branch']: [{'@id': branch['@id']}]});
                                            var recordId = ontologyRecord['@id'];

                                            dvm.util.setPropertyId(ds.selectedDataset.record, prefixes.dataset + 'ontology', id);
                                            ds.selectedDataset.identifiers.push(createBlankNode(id, recordId, branch['@id'], 
                                                    dvm.util.getPropertyId(branch, prefixes.catalog + 'head')));
                                        });
                                        triggerUpdate();
                                    }, onError);
                        } else {
                            triggerUpdate();
                        }
                    }

                    function onError(errorMessage) {
                        dvm.error = errorMessage;
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
                        var jsonld = _.concat(ds.selectedDataset.identifiers, ds.selectedDataset.record);
                        
                        // Send unparsed object to the update endpoint.
                        cm.updateRecord(ds.selectedDataset.record['@id'], cm.localCatalog['@id'], jsonld).then(() => { 
                            dvm.util.createSuccessToast('Dataset successfully updated');
                            ds.setResults();
                            dvm.onClose();
                        }, onError);
                    }
                }
            }
        }
})();

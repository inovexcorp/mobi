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
         * @name editDatasetOverlay
         *
         * @description
         * The `editDatasetOverlay` module only provides the `editDatasetOverlay` directive which creates an overlay
         * with a form to edit a Dataset Record.
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
         * `editDatasetOverlay` is a directive that creates an overlay with a form containing fields for editing an
         * existing Dataset Record. The form contains fields for the title, description,
         * {@link keywordSelect.directive:keywordSelect keywords}, and a searchable list of Ontology Records that can
         * be linked to the Dataset Record.
         *
         * @param {Function} onClose The method to be called when closing the overlay
         */
        .directive('editDatasetOverlay', editDatasetOverlay);

        editDatasetOverlay.$inject = ['datasetStateService', 'datasetManagerService', 'catalogManagerService', 'utilService', 'prefixes', '$q'];

        function editDatasetOverlay(datasetStateService, datasetManagerService, catalogManagerService, utilService, prefixes, $q) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/datasets/directives/editDatasetOverlay/editDatasetOverlay.html',
                scope: {},
                bindToController: {
                    onClose: '&'
                },
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var cm = catalogManagerService;
                    var dm = datasetManagerService;
                    var ds = datasetStateService;

                    dvm.util = utilService;
                    dvm.error = '';

                    dvm.recordConfig = {
                        datasetIRI: dvm.util.getPropertyId(ds.selectedDataset.record, prefixes.dataset + 'dataset'),
                        repositoryId: dvm.util.getPropertyValue(ds.selectedDataset.record, prefixes.dataset + 'repository'),
                        title: dvm.util.getDctermsValue(ds.selectedDataset.record, 'title'),
                        description: dvm.util.getDctermsValue(ds.selectedDataset.record, 'description')
                    };

                    dvm.keywords = _.map(ds.selectedDataset.record[prefixes.catalog + 'keyword'], '@value');
                    dvm.keywords.sort();
                    dvm.ontologies = [];
                    dvm.selectedOntologies = [];

                    dvm.update = function() {
                        var newRecord = angular.copy(ds.selectedDataset.record);

                        newRecord[prefixes.dcterms + 'title'] = [];
                        newRecord[prefixes.dcterms + 'description'] = [];
                        newRecord[prefixes.catalog + 'keyword'] = [];

                        dvm.util.setDctermsValue(newRecord, 'title', dvm.recordConfig.title.trim());
                        dvm.util.setDctermsValue(newRecord, 'description', dvm.recordConfig.description.trim());
                        _.forEach(dvm.keywords, kw => dvm.util.setPropertyValue(newRecord, prefixes.catalog + 'keyword', kw.trim()));

                        var curOntologies = _.map(dvm.selectedOntologies, '@id');
                        var oldOntologies = _.map(ds.selectedDataset.identifiers, identifier => dvm.util.getPropertyId(identifier, prefixes.dataset + 'linksToRecord'));

                        var newIdentifiers = angular.copy(ds.selectedDataset.identifiers);

                        var added = _.difference(curOntologies, oldOntologies);
                        var deleted = _.remove(newIdentifiers, identifier => !_.includes(curOntologies, dvm.util.getPropertyId(identifier, prefixes.dataset + 'linksToRecord')));

                        _.forEach(deleted, identifier => {
                            _.remove(newRecord[prefixes.dataset + 'ontology'], {'@id': identifier['@id']});
                        });

                        if (added.length > 0) {
                            $q.all(_.map(added, recordId => cm.getRecordMasterBranch(recordId, cm.localCatalog['@id'])))
                                    .then(responses => {
                                        _.forEach(responses, (branch, idx) => {
                                            var id = dvm.util.getSkolemizedIRI();
                                            newIdentifiers.push(createBlankNode(id, added[idx], branch['@id'], dvm.util.getPropertyId(branch, prefixes.catalog + 'head')));
                                            dvm.util.setPropertyId(newRecord, prefixes.dataset + 'ontology', id);
                                        });
                                        triggerUpdate(newRecord, newIdentifiers);
                                    }, onError);
                        } else {
                            triggerUpdate(newRecord, newIdentifiers);
                        }
                    }

                    function onError(errorMessage) {
                        dvm.error = errorMessage;
                    }
                    function createBlankNode(id, recordId, branchId, commitId) {
                        return {
                                '@id': id,
                                [prefixes.dataset + 'linksToRecord']: [{ '@id': recordId }],
                                [prefixes.dataset + 'linksToBranch']: [{ '@id': branchId }],
                                [prefixes.dataset + 'linksToCommit']: [{ '@id': commitId }]
                            }
                    }
                    function triggerUpdate(newRecord, newIdentifiers) {
                        var jsonld = _.concat(newIdentifiers, newRecord);

                        // Send unparsed object to the update endpoint.
                        dm.updateDatasetRecord(newRecord['@id'], cm.localCatalog['@id'], jsonld, dvm.util.getDctermsValue(newRecord, 'title')).then(() => {
                            dvm.util.createSuccessToast('Dataset successfully updated');
                            ds.selectedDataset.identifiers = newIdentifiers;
                            ds.selectedDataset.record = newRecord;
                            ds.setResults();
                            dvm.onClose();
                        }, onError);
                    }
                }
            }
        }
})();

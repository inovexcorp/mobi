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
         * @name datasetsOntologyPicker
         *
         * @description
         * The `datasetsOntologyPicker` module only provides the `datasetsOntologyPicker` directive
         * which creates a paged list for selecting ontologies.
         */
        .module('datasetsOntologyPicker', [])
        /**
         * @ngdoc directive
         * @name datasetsTabset.directive:datasetsOntologyPicker
         * @scope
         * @restrict E
         * @requires datasetState.service:datasetStateService
         * @requires catalogManager.service:catalogManagerService
         * @requires util.service:utilService
         * @requires prefixes.service:prefixes
         *
         * @description
         * `datasetsOntologyPicker` is a directive which creates a paged list for selecting ontologies.
         */
        .directive('datasetsOntologyPicker', datasetsOntologyPicker);

        datasetsOntologyPicker.$inject = ['catalogManagerService', 'datasetStateService', 'utilService', 'prefixes'];

        function datasetsOntologyPicker(catalogManagerService, datasetStateService, utilService, prefixes) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/datasets/directives/datasetsOntologyPicker/datasetsOntologyPicker.html',
                scope: {},
                bindToController: {
                    error: '=',
                    selectedOntologies: '='
                },
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var cm = catalogManagerService;
                    var state = datasetStateService;
                    dvm.ontologies = [];
                    dvm.util = utilService;

                    dvm.ontologySearchConfig = {
                        pageIndex: 0,
                        sortOption: _.find(cm.sortOptions, {field: prefixes.dcterms + 'title', asc: true}),
                        recordType: prefixes.ontologyEditor + 'OntologyRecord',
                        limit: 10,
                        searchText: ''
                    };
                    dvm.totalSize = 0;
                    dvm.links = {
                        next: '',
                        prev: ''
                    };

                    dvm.getOntologies = function() {
                        return cm.getRecords(cm.localCatalog['@id'], dvm.ontologySearchConfig).then(parseOntologyResults, errorMessage => {
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

                    // Begin Initialization...
                    dvm.getOntologies()
                        .then(() => {
                            if (state.showEditOverlay) {
                                dvm.selectedOntologies = [];
                                var selectedOntologies = _.map(state.selectedDataset.identifiers, identifier => dvm.util.getPropertyId(identifier, prefixes.dataset + 'linksToRecord'));
                                _.forEach(selectedOntologies, id => {
                                    var ontology = _.find(dvm.ontologies, {'@id': id});
                                    if (ontology) {
                                        dvm.selectedOntologies.push(ontology);
                                    } else {
                                        onError('Selected ontology could not be found');
                                    }
                                });
                            }
                        });
                }
            }
        }
})();

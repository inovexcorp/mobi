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
         * @name datasetsOntologyPicker
         *
         * @description
         * The `datasetsOntologyPicker` module only provides the `datasetsOntologyPicker` directive
         * which creates ...
         */
        .module('datasetsOntologyPicker', [])
        /**
         * @ngdoc directive
         * @name datasetsTabset.directive:datasetsOntologyPicker
         * @scope
         * @restrict E
         * @requires prefixes.service:prefixes
         *
         * @description
         * `datasetsOntologyPicker` is a directive which ...
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
                    ontologies: '=',
                    selectedOntologies: '='
                },
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    var cm = catalogManagerService;
                    var ds = datasetStateService;

                    dvm.util = utilService;
                    
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
                    dvm.getOntologies(); // Populate the list automatically...
                    
                    $scope.$watch('dvm.ds.selectedDataset', function() {
                        if (dvm.ds && dvm.ds.selectedDataset) {
                            dvm.selectedOntologies = [];
                            var selectedOntologies = _.map(dvm.ds.selectedDataset.identifiers, 
                                    identifier => dvm.util.getPropertyId(identifier, prefixes.dataset + 'linksToRecord'));
                            _.forEach(selectedOntologies, id => {
                                var ontology = _.find(dvm.ontologies, o => { if (o['@id'] === id) { return o; }});
                                if (ontology) {
                                    dvm.selectedOntologies.push(ontology);
                                } else {
                                    cm.getRecord(id, cm.localCatalog['@id'])
                                            .then(ontology => dvm.selectedOntologies.push(ontology), onError);
                                }
                            });
                        }
                    });
                }]
            }
        }
})();

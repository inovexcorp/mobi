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

    /**
     * @ngdoc component
     * @name datasetsTabset.component:datasetsOntologyPicker
     * @requires catalogManager.service:catalogManagerService
     * @requires util.service:utilService
     * @requires prefixes.service:prefixes
     *
     * @description
     * `datasetsOntologyPicker` is a component which creates a searchable list for selecting ontologies along with an
     * editable display of selected ontologies. The `selectedOntologies` bindings will determine which ontologies will
     * display as selected, but is one way bound. The `selectOntology` function is expected to add an ontology to the
     * `selectedOntologies` and the `unselectOntology` function is expected to remove an ontology from the
     * `selectedOntologies`. Each selected ontology will have the following structure:
     * ```
     * {
     *     recordId: '',
     *     ontologyIRI: '',
     *     title: '',
     *     selected: false,
     *     jsonld: {...}
     * }
     * ```
     *
     * @param {Object[]} selectedOntologies A list of objects representing the selected ontologies
     * @param {Function} selectOntology A function that expects a parameter called `ontology` and will be called when an
     * ontology's checkbox is checked in the list. This function should update the `selectedOntologies` binding.
     * @param {Function} unselectOntology A function that expects a parameter called `ontology` and will be called when
     * an ontology's checkbox is unchecked in the list or the remove button is clicked in the selected ontologies list.
     * This function should update the `selectedOntologies` binding.
     */
    const datasetsOntologyPickerComponent = {
        templateUrl: 'datasets/directives/datasetsOntologyPicker/datasetsOntologyPicker.component.html',
        bindings: {
            selectedOntologies: '<',
            selectOntology: '&',
            unselectOntology: '&'
        },
        controllerAs: 'dvm',
        controller: datasetsOntologyPickerComponentCtrl
    };

    datasetsOntologyPickerComponentCtrl.$inject = ['httpService', 'catalogManagerService', 'utilService', 'prefixes'];

    function datasetsOntologyPickerComponentCtrl(httpService, catalogManagerService, utilService, prefixes) {
        var dvm = this;
        var cm = catalogManagerService;
        var catalogId = '';
        dvm.ontologies = [];
        dvm.util = utilService;
        dvm.spinnerId = 'datasets-ontology-picker';

        dvm.ontologySearchConfig = {
            pageIndex: 0,
            sortOption: _.find(cm.sortOptions, {field: prefixes.dcterms + 'title', asc: true}),
            recordType: prefixes.ontologyEditor + 'OntologyRecord',
            limit: 100,
            searchText: ''
        };

        dvm.$onInit = function() {
            catalogId = _.get(cm.localCatalog, '@id');
            dvm.setOntologies();
        }
        dvm.getOntologyIRI = function(record) {
            return dvm.util.getPropertyId(record, prefixes.ontologyEditor + 'ontologyIRI');
        }
        dvm.setOntologies = function() {
            httpService.cancel(dvm.spinnerId);
            return cm.getRecords(catalogId, dvm.ontologySearchConfig, dvm.spinnerId)
                .then(parseOntologyResults, onError);
        }
        dvm.toggleOntology = function(ontology) {
            if (ontology.selected) {
                dvm.selectOntology({ontology});
            } else {
                dvm.unselectOntology({ontology});
            }
        }
        dvm.unselect = function(ontology) {
            ontology.selected = false;
            dvm.unselectOntology({ontology});
        }

        function onError(errorMessage) {
            dvm.ontologies = [];
            dvm.error = errorMessage;
        }
        function parseOntologyResults(response) {
            dvm.error = '';
            dvm.ontologies = _.map(response.data, record => ({
                recordId: record['@id'],
                ontologyIRI: dvm.getOntologyIRI(record),
                title: dvm.util.getDctermsValue(record, 'title'),
                selected: _.some(dvm.selectedOntologies, {recordId: record['@id']}),
                jsonld: record
            }));
        }
    }

    angular
        /**
         * @ngdoc overview
         * @name datasetsOntologyPicker
         *
         * @description
         * The `datasetsOntologyPicker` module only provides the `datasetsOntologyPicker` component which creates a
         * paged list for selecting ontologies.
         */
        .module('datasetsOntologyPicker', [])
        .config(['$qProvider', function($qProvider) {
            $qProvider.errorOnUnhandledRejections(false);
        }])
        .component('datasetsOntologyPicker', datasetsOntologyPickerComponent);
})();

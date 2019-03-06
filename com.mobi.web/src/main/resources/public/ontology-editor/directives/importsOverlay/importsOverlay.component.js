/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
     * @name importsOverlay.component:importsOverlay
     * @requires shared.service:httpService
     * @requires shared.service:ontologyStateService
     * @requires shared.service:utilService
     * @requires shared.service:prefixes
     * @requires shared.service:propertyManagerService
     * @requires shared.service:catalogManagerService
     *
     * @description
     * `importsOverlay` is a component that creates content for a modal that adds an imported ontology to the
     * current {@link shared.service:ontologyStateService selected ontology}. The form in the modal contains
     * a {@link shared.component:tabset} to choose between a URL import or an ontology within the Mobi instance. The
     * "Server" tab contains a searchable selectable list of ontologies. Only 100 will be shown at a time. Selected
     * ontologies can be removed from the list by either unchecking the checkbox in the list or clicking the x button
     * on the ontology in the Selected list. Meant to be used in conjunction with the
     * {@link modalService.directive:modalService}.
     *
     * @param {Function} close A function that closes the modal
     * @param {Function} dismiss A function that dismisses the modal
     */
    const importsOverlayComponent = {
        templateUrl: 'ontology-editor/directives/importsOverlay/importsOverlay.component.html',
        bindings: {
            close: '&',
            dismiss: '&'
        },
        controllerAs: 'dvm',
        controller: importsOverlayComponentCtrl
    };

    importsOverlayComponentCtrl.$inject = ['$http', 'httpService', '$q', 'REGEX', 'ontologyStateService', 'utilService', 'prefixes', 'propertyManagerService', 'catalogManagerService'];

    function importsOverlayComponentCtrl($http, httpService, $q, REGEX, ontologyStateService, utilService, prefixes, propertyManagerService, catalogManagerService) {
        var dvm = this;
        var os = ontologyStateService;
        var pm = propertyManagerService;
        var cm = catalogManagerService;
        var catalogId = _.get(cm.localCatalog, '@id', '');
        dvm.spinnerId = 'imports-overlay';
        dvm.util = utilService;
        dvm.url = '';
        dvm.urls = [];
        dvm.ontologies = [];
        dvm.selectedOntologies = [];
        dvm.iriPattern = REGEX.IRI;
        dvm.urlError = '';
        dvm.serverError = '';
        dvm.tabs = {
            url: true,
            server: false
        };
        dvm.getOntologyConfig = {
            pageIndex: 0,
            limit: 100,
            recordType: prefixes.ontologyEditor + 'OntologyRecord',
            sortOption: _.find(cm.sortOptions, {field: 'http://purl.org/dc/terms/title', asc: true}),
            searchText: ''
        };

        dvm.setOntologies = function() {
            httpService.cancel(dvm.spinnerId);
            return cm.getRecords(catalogId, dvm.getOntologyConfig, dvm.spinnerId)
                .then(parseOntologyResults, errorMessage => onError(errorMessage, 'server'));
        }
        dvm.toggleOntology = function(ontology) {
            if (ontology.selected) {
                dvm.selectedOntologies.push(ontology);
                dvm.selectedOntologies = _.sortBy(dvm.selectedOntologies, 'title');
            } else {
                _.remove(dvm.selectedOntologies, ontology);
            }
        }
        dvm.unselectOntology = function(ontology) {
            ontology.selected = false;
            _.remove(dvm.selectedOntologies, ontology);
        }
        dvm.clickTab = function(tabKey) {
            if (tabKey === 'server' && dvm.ontologies.length === 0) {
                dvm.getOntologyConfig.searchText = '';
                dvm.selectedOntologies = [];
                dvm.setOntologies();
            }
        }
        dvm.getOntologyIRI = function(record) {
            return dvm.util.getPropertyId(record, prefixes.ontologyEditor + 'ontologyIRI');
        }
        dvm.addImport = function() {
            if (dvm.tabs.url) {
                $http.get('/mobirest/imported-ontologies/' + encodeURIComponent(dvm.url))
                    .then(() => {
                        dvm.confirmed([dvm.url], 'url');
                    }, () => onError('The provided URL was unresolvable.', 'url'));
            } else if (dvm.tabs.server) {
                dvm.confirmed(_.map(dvm.selectedOntologies, 'ontologyIRI'), 'server');
            }
        }
        dvm.confirmed = function(urls, tabKey) {
            var importsIRI = prefixes.owl + 'imports';
            var addedUrls = _.filter(urls, url => pm.addId(os.listItem.selected, importsIRI, url));
            if (addedUrls.length !== urls.length) {
                dvm.util.createWarningToast('Duplicate property values not allowed');
            }
            if (addedUrls.length) {
                var urlObjs = _.map(addedUrls, url => ({'@id': url}));
                os.addToAdditions(os.listItem.ontologyRecord.recordId, {'@id': os.listItem.selected['@id'], [importsIRI]: urlObjs});
                os.saveChanges(os.listItem.ontologyRecord.recordId, {additions: os.listItem.additions, deletions: os.listItem.deletions})
                    .then(() => os.afterSave(), $q.reject)
                    .then(() => os.updateOntology(os.listItem.ontologyRecord.recordId, os.listItem.ontologyRecord.branchId, os.listItem.ontologyRecord.commitId, os.listItem.upToDate, os.listItem.inProgressCommit), $q.reject)
                    .then(() => {
                        os.listItem.isSaved = os.isCommittable(os.listItem);
                        dvm.close()
                    }, errorMessage => onError(errorMessage, tabKey));
            } else {
                dvm.dismiss();
            }
        }
        dvm.cancel = function() {
            dvm.dismiss();
        }

        function parseOntologyResults(response) {
            dvm.ontologies = _.map(_.filter(response.data, isOntologyUnused), record => ({
                recordId: record['@id'],
                ontologyIRI: dvm.getOntologyIRI(record),
                title: dvm.util.getDctermsValue(record, 'title'),
                selected: false
            }));
            if (dvm.selectedOntologies.length) {
                _.forEach(dvm.ontologies, ontology => {
                    if (_.some(dvm.selectedOntologies, {recordId: ontology.recordId})) {
                        ontology.selected = true;
                    }
                });
            }
            dvm.serverError = '';
        }
        function isOntologyUnused(ontologyRecord) {
            return ontologyRecord['@id'] !== os.listItem.ontologyRecord.recordId && !_.includes(os.listItem.importedOntologyIds, dvm.getOntologyIRI(ontologyRecord));
        }
        function onError(errorMessage, tabKey) {
            if (tabKey === 'url') {
                dvm.urlError = errorMessage;
            } else if (tabKey = 'server') {
                dvm.ontologies = [];
                dvm.serverError = errorMessage;
            }
        }
    }

    angular
        /**
         * @ngdoc overview
         * @name importsOverlay
         *
         * @description
         * The `importsOverlay` module only provides the `importsOverlay` component which creates content
         * for a modal to add an import to an ontology.
         */
        .module('importsOverlay', [])
        .component('importsOverlay', importsOverlayComponent);
})();

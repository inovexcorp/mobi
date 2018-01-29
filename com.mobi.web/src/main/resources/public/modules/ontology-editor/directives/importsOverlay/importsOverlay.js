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
        .module('importsOverlay', [])
        .directive('importsOverlay', importsOverlay);

        importsOverlay.$inject = ['$http', 'httpService', '$q', 'REGEX', 'ontologyStateService', 'ontologyManagerService', 'utilService', 'prefixes', 'propertyManagerService'];

        function importsOverlay($http, httpService, $q, REGEX, ontologyStateService, ontologyManagerService, utilService, prefixes, propertyManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/importsOverlay/importsOverlay.html',
                scope: {},
                bindToController: {
                    onClose: '&',
                    onSubmit: '&'
                },
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var om = ontologyManagerService;
                    var os = ontologyStateService;
                    var pm = propertyManagerService;
                    dvm.spinnerId = 'imports-overlay';
                    dvm.util = utilService;
                    dvm.url = '';
                    dvm.urls = [];
                    dvm.ontologies = [];
                    dvm.iriPattern = REGEX.IRI;
                    dvm.urlError = '';
                    dvm.serverError = '';
                    dvm.tabs = {
                        url: true,
                        server: false
                    };

                    dvm.clickTab = function(tabKey) {
                        if (tabKey === 'server' && dvm.ontologies.length === 0) {
                            httpService.cancel(dvm.spinnerId);
                            om.getAllOntologyRecords(undefined, dvm.spinnerId)
                                .then(ontologies => {
                                    dvm.ontologies = _.map(_.filter(ontologies, isOntologyUnused), record => {
                                        return {
                                            recordId: record['@id'],
                                            ontologyIRI: dvm.getOntologyIRI(record),
                                            title: dvm.util.getDctermsValue(record, 'title'),
                                            selected: false
                                        };
                                    });
                                    dvm.serverError = '';
                                }, errorMessage => onError(errorMessage, tabKey));
                        }
                    }
                    dvm.ontologyIsSelected = function() {
                        return _.some(dvm.ontologies, 'selected');
                    }
                    dvm.getOntologyIRI = function(record) {
                        return dvm.util.getPropertyId(record, prefixes.ontologyEditor + 'ontologyIRI');
                    }
                    dvm.addImport = function() {
                        if (dvm.tabs.url) {
                            $http.get('/mobirest/imported-ontologies/' + encodeURIComponent(dvm.url))
                                .then(response => {
                                    dvm.confirmed([dvm.url], 'url');
                                }, () => onError('The provided URL was unresolvable.', 'url'));
                        } else if (dvm.tabs.server) {
                            dvm.confirmed(_.map(_.filter(dvm.ontologies, 'selected'), 'ontologyIRI'), 'server');
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
                                    os.listItem.isSaved = os.isCommittable(os.listItem.ontologyRecord.recordId);
                                    dvm.onSubmit();
                                    dvm.onClose();
                                }, errorMessage => onError(errorMessage, tabKey));
                        } else {
                            dvm.onClose();
                        }
                    }

                    function isOntologyUnused(ontologyRecord) {
                        return ontologyRecord['@id'] !== os.listItem.ontologyRecord.recordId && !_.includes(os.listItem.importedOntologyIds, dvm.getOntologyIRI(ontologyRecord));
                    }
                    function onError(errorMessage, tabKey) {
                        if (tabKey === 'url') {
                            dvm.urlError = errorMessage;
                        } else if (tabKey = 'server') {
                            dvm.serverError = errorMessage;
                        }
                    }
                }
            }
        }
})();

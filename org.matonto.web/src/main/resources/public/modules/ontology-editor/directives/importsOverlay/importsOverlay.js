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
        .module('importsOverlay', [])
        .directive('importsOverlay', importsOverlay);

        importsOverlay.$inject = ['$http', 'httpService', '$q', 'REGEX', 'ontologyStateService', 'ontologyManagerService', 'utilService', 'prefixes'];

        function importsOverlay($http, httpService, $q, REGEX, ontologyStateService, ontologyManagerService, utilService, prefixes) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/importsOverlay/importsOverlay.html',
                scope: {},
                bindToController: {
                    onClose: '&'
                },
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var om = ontologyManagerService;
                    var os = ontologyStateService;
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

                    dvm.clickTab = function() {
                        if (dvm.tabs.server && dvm.ontologies.length === 0) {
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
                                }, onError);
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
                            $http.get('/matontorest/imported-ontologies/' + encodeURIComponent(dvm.url))
                                .then(response => {
                                    dvm.confirmed([dvm.url]);
                                }, () => onError('The provided URL was unresolvable.'));
                        } else if (dvm.tabs.server) {
                            dvm.confirmed(_.map(_.filter(dvm.ontologies, 'selected'), 'ontologyIRI'));
                        }
                    }
                    dvm.confirmed = function(urls) {
                        var importsIRI = prefixes.owl + 'imports';
                        _.forEach(urls, url => {
                            dvm.util.setPropertyId(os.listItem.selected, importsIRI, url);
                            os.addToAdditions(os.listItem.ontologyRecord.recordId, dvm.util.createJson(os.listItem.selected['@id'], importsIRI, {'@id': url}));
                        });
                        os.saveChanges(os.listItem.ontologyRecord.recordId, {additions: os.listItem.additions, deletions: os.listItem.deletions})
                            .then(() => os.afterSave(), $q.reject)
                            .then(() => os.updateOntology(os.listItem.ontologyRecord.recordId, os.listItem.ontologyRecord.branchId, os.listItem.ontologyRecord.commitId, os.listItem.ontologyRecord.type, os.listItem.ontologyState.upToDate, os.listItem.inProgressCommit), $q.reject)
                            .then(() => {
                                os.listItem.isSaved = os.isCommittable(os.listItem.ontologyRecord.recordId);
                                dvm.onClose();
                            }, onError);
                    }

                    function isOntologyUnused(ontologyRecord) {
                        return ontologyRecord['@id'] !== os.listItem.ontologyRecord.recordId && !_.includes(os.listItem.importedOntologyIds, dvm.getOntologyIRI(ontologyRecord));
                    }
                    function onError(errorMessage) {
                        if (dvm.tabs.url) {
                            dvm.urlError = errorMessage;
                        } else if (dvm.tabs.server) {
                            dvm.serverError = errorMessage;
                        }
                    }
                }
            }
        }
})();

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

        importsOverlay.$inject = ['$http', '$q', 'REGEX', 'ontologyStateService', 'utilService', 'prefixes', 'ontologyManagerService'];

        function importsOverlay($http, $q, REGEX, ontologyStateService, utilService, prefixes, ontologyManagerService) {
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
                    var os = ontologyStateService;
                    var util = utilService;
                    var om = ontologyManagerService;
                    dvm.url = '';
                    dvm.iriPattern = REGEX.IRI;
                    dvm.error = '';
                    dvm.openConfirmation = false;

                    dvm.create = function() {
                        $http.get('/matontorest/imported-ontologies/' + encodeURIComponent(dvm.url))
                            .then(response => {
                                if (os.hasChanges(os.listItem.recordId)) {
                                    dvm.openConfirmation = true;
                                } else {
                                    dvm.confirmed();
                                }
                            }, () => dvm.error = 'The provided URL was unresolvable.');
                    }

                    dvm.confirmed = function() {
                        var importsIRI = prefixes.owl + 'imports';
                        util.setPropertyId(os.selected, importsIRI, dvm.url);
                        om.addToAdditions(os.listItem.recordId, util.createJson(os.selected['@id'], importsIRI, {'@id': dvm.url}));
                        om.saveChanges(os.listItem.recordId, {additions: os.listItem.additions, deletions: os.listItem.deletions})
                            .then(() => os.afterSave(), $q.reject)
                            .then(() => om.updateOntology(os.listItem.recordId, os.listItem.branchId, os.listItem.commitId, os.listItem.type, os.listItem.upToDate, os.listItem.inProgressCommit), $q.reject)
                            .then(() => {
                                os.listItem.isSaved = os.isCommittable(os.listItem.recordId);
                                dvm.onClose();
                            }, errorMessage => dvm.error = errorMessage);
                    }
                }
            }
        }
})();

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
        .module('ontologyDownloadOverlay', [])
        .directive('ontologyDownloadOverlay', ontologyDownloadOverlay);

        ontologyDownloadOverlay.$inject = ['$q', '$filter', 'REGEX', 'ontologyStateService', 'ontologyManagerService', 'catalogManagerService'];

        function ontologyDownloadOverlay($q, $filter, REGEX, ontologyStateService, ontologyManagerService, catalogManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/ontologyDownloadOverlay/ontologyDownloadOverlay.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var cm = catalogManagerService;

                    dvm.fileNamePattern = REGEX.FILENAME;
                    dvm.sm = ontologyStateService;
                    dvm.om = ontologyManagerService;
                    dvm.fileName = $filter('splitIRI')(dvm.sm.listItem.ontologyId).end;
                    dvm.error = '';

                    dvm.download = function() {
                        var catalogId = _.get(cm.localCatalog, '@id');
                        cm.getInProgressCommit(dvm.sm.listItem.recordId, catalogId)
                            .then(inProgressCommit => cm.downloadResource(dvm.sm.listItem.commitId, dvm.sm.listItem.branchId, dvm.sm.listItem.recordId, catalogId, true, dvm.serialization, dvm.fileName), errorMessage => {
                                if (errorMessage === 'User has no InProgressCommit') {
                                    return cm.downloadResource(dvm.sm.listItem.commitId, dvm.sm.listItem.branchId, dvm.sm.listItem.recordId, catalogId, false, dvm.serialization, dvm.fileName);
                                }
                                return $q.reject(errorMessage);
                            })
                            .then(() => dvm.sm.showDownloadOverlay = false, errorMessage => dvm.error = errorMessage);
                    }
                }
            }
        }
})();

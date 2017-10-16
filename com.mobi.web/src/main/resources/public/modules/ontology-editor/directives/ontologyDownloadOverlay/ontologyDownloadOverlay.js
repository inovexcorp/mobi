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
        .module('ontologyDownloadOverlay', [])
        .directive('ontologyDownloadOverlay', ontologyDownloadOverlay);

        ontologyDownloadOverlay.$inject = ['$q', '$filter', 'REGEX', 'ontologyStateService', 'ontologyManagerService'];

        function ontologyDownloadOverlay($q, $filter, REGEX, ontologyStateService, ontologyManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/ontologyDownloadOverlay/ontologyDownloadOverlay.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var om = ontologyManagerService;

                    dvm.fileNamePattern = REGEX.FILENAME;
                    dvm.os = ontologyStateService;
                    dvm.fileName = $filter('splitIRI')(dvm.os.listItem.ontologyId).end;

                    dvm.download = function() {
                        om.downloadOntology(dvm.os.listItem.ontologyRecord.recordId, dvm.os.listItem.ontologyRecord.branchId, dvm.os.listItem.ontologyRecord.commitId, dvm.serialization, dvm.fileName);
                        dvm.os.showDownloadOverlay = false;
                    }
                }
            }
        }
})();

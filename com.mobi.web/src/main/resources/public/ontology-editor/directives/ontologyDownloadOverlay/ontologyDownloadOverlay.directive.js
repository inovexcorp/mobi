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

    angular
        /**
         * @ngdoc overview
         * @name ontologyDownloadOverlay
         *
         * @description
         * The `ontologyDownloadOverlay` module only provides the `ontologyDownloadOverlay` directive which creates content
         * for a modal to download an ontology.
         */
        .module('ontologyDownloadOverlay', [])
        /**
         * @ngdoc directive
         * @name ontologyDownloadOverlay.directive:ontologyDownloadOverlay
         * @scope
         * @restrict E
         * @requires shared.service:ontologyStateService
         * @requires shared.service:ontologyManagerService
         *
         * @description
         * `ontologyDownloadOverlay` is a directive that creates content for a modal that downloads the current
         * {@link shared.service:ontologyStateService selected ontology} as an RDF file. The form in the modal
         * contains a {@link serializationSelect.directive:serializationSelect} and text input for the file name. Meant
         * to be used in conjunction with the {@link shared.service:modalService}.
         *
         * @param {Function} close A function that closes the modal
         * @param {Function} dismiss A function that dismisses the modal
         */
        .directive('ontologyDownloadOverlay', ontologyDownloadOverlay);

        ontologyDownloadOverlay.$inject = ['$q', '$filter', 'REGEX', 'ontologyStateService', 'ontologyManagerService'];

        function ontologyDownloadOverlay($q, $filter, REGEX, ontologyStateService, ontologyManagerService) {
            return {
                restrict: 'E',
                templateUrl: 'ontology-editor/directives/ontologyDownloadOverlay/ontologyDownloadOverlay.directive.html',
                scope: {
                    close: '&',
                    dismiss: '&'
                },
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    var om = ontologyManagerService;

                    dvm.fileNamePattern = REGEX.FILENAME;
                    dvm.os = ontologyStateService;
                    dvm.fileName = $filter('splitIRI')(dvm.os.listItem.ontologyId).end;

                    dvm.download = function() {
                        om.downloadOntology(dvm.os.listItem.ontologyRecord.recordId, dvm.os.listItem.ontologyRecord.branchId, dvm.os.listItem.ontologyRecord.commitId, dvm.serialization, dvm.fileName);
                        $scope.close();
                    }
                    dvm.cancel = function() {
                        $scope.dismiss();
                    }
                }]
            }
        }
})();

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
         * @name previewBlock
         *
         * @description
         * The `previewBlock` module only provides the `previewBlock` directive which creates a
         * {@link block.directive:block} for displaying a preview of an ontology in RDF.
         */
        .module('previewBlock', [])
        /**
         * @ngdoc directive
         * @name previewBlock.directive:previewBlock
         * @scope
         * @restrict E
         * @requires ontologyState.service:ontologyStateService
         * @requires ontologyManager.service:ontologyManagerService
         * @requires modal.service:modalService
         *
         * @description
         * `previewBlock` is a directive that creates a {@link block.directive:block} that displays a `codemirror` with
         * the current {@link ontologyState.service:ontologyStateService selected ontology} in a specified RDF format.
         * The `block` contains a {@link serializationSelect.directive:serializationSelect}, button to refresh the
         * preview, and a button for {@link ontologyDownloadOverlay.directive:ontologyDownloadOverlay downloading}
         * the ontology. The directive is replaced by the contents of its template.
         */
        .directive('previewBlock', previewBlock);

        previewBlock.$inject = ['$filter', 'ontologyStateService', 'ontologyManagerService', 'modalService'];

        function previewBlock($filter, ontologyStateService, ontologyManagerService, modalService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/previewBlock/previewBlock.html',
                scope: {},
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    var om = ontologyManagerService;
                    dvm.os = ontologyStateService;
                    dvm.activePage = dvm.os.getActivePage();
                    dvm.options = {
                        mode: dvm.activePage.mode,
                        lineNumbers: true,
                        lineWrapping: true,
                        readOnly: true
                    };

                    function setMode(serialization) {
                        if (serialization === 'turtle') {
                            dvm.options.mode = 'text/turtle';
                        } else if (serialization === 'jsonld') {
                            dvm.options.mode = 'application/ld+json';
                        } else {
                            dvm.options.mode = 'application/xml';
                        }
                        dvm.activePage.mode = angular.copy(dvm.options.mode);
                    }

                    dvm.getPreview = function() {
                        setMode(dvm.activePage.serialization);
                        om.getOntology(dvm.os.listItem.ontologyRecord.recordId, dvm.os.listItem.ontologyRecord.branchId, dvm.os.listItem.ontologyRecord.commitId, dvm.activePage.serialization, false, true)
                            .then(ontology => dvm.activePage.preview = (dvm.activePage.serialization === 'jsonld' ? $filter('json')(ontology) : ontology),
                                response => dvm.activePage.preview = response);
                    }
                    dvm.showDownloadOverlay = function() {
                        modalService.openModal('ontologyDownloadOverlay');
                    }
                    $scope.$watch(() => dvm.os.getActivePage(), newValue => {
                        dvm.activePage = newValue;
                        dvm.options.mode = dvm.activePage.mode;
                    });
                }]
            }
        }
})();

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
        .module('previewBlock', [])
        .directive('previewBlock', previewBlock);

        previewBlock.$inject = ['$filter', 'ontologyStateService', 'ontologyManagerService', 'modalService'];

        function previewBlock($filter, ontologyStateService, ontologyManagerService, modalService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/previewBlock/previewBlock.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
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
                }
            }
        }
})();

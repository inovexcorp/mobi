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
        .module('previewBlock', [])
        .directive('previewBlock', previewBlock);

        previewBlock.$inject = ['stateManagerService', 'ontologyManagerService'];

        function previewBlock(stateManagerService, ontologyManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/new-directives/previewBlock/previewBlock.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.sm = stateManagerService;
                    dvm.om = ontologyManagerService;
                    dvm.activePage = dvm.sm.getActivePage();
                    dvm.options = {
                        lineNumbers: true,
                        lineWrapping: true,
                        readOnly: 'nocursor'
                    };

                    dvm.getPreview = function() {
                        if (dvm.activePage.serialization === 'turtle') {
                            dvm.options.mode = 'text/turtle';
                        } else if (dvm.activePage.serialization === 'jsonld') {
                            dvm.options.mode = 'application/ld+json';
                        } else {
                            dvm.options.mode = 'application/xml';
                        }
                        dvm.om.getPreview(dvm.sm.state.ontologyId, dvm.activePage.serialization)
                            .then(response => {
                                dvm.activePage.preview = response;
                            }, response => {
                                dvm.activePage.preview = response;
                            });
                    }
                }
            }
        }
})();

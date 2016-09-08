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
        .module('rdfPreviewForm', [])
        .directive('rdfPreviewForm', rdfPreviewForm);

        rdfPreviewForm.$inject = ['delimitedManagerService', 'mappingManagerService'];

        function rdfPreviewForm(delimitedManagerService, mappingManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.dm = delimitedManagerService;
                    dvm.mm = mappingManagerService;
                    dvm.serializeFormat = 'turtle';
                    dvm.errorMessage = '';
                    dvm.editorOptions = {
                        mode: 'text/turtle',
                        readOnly: 'nocursor',
                        indentUnit: 2,
                        lineWrapping: true
                    };

                    dvm.generatePreview = function() {
                        dvm.dm.previewMap(dvm.mm.mapping.jsonld, dvm.serializeFormat).then(preview => {
                            dvm.dm.preview = preview;
                            if (dvm.serializeFormat === 'turtle') {
                                dvm.editorOptions.mode = 'text/turtle';
                            } else if (dvm.serializeFormat === 'jsonld') {
                                dvm.editorOptions.mode = 'application/json';
                            } else if (dvm.serializeFormat === 'rdf/xml') {
                                dvm.editorOptions.mode = 'application/xml';
                            }
                        }, errorMessage => {
                            dvm.errorMessage = errorMessage;
                        });
                    }
                },
                templateUrl: 'modules/mapper/new-directives/rdfPreviewForm/rdfPreviewForm.html'
            }
        }
})();
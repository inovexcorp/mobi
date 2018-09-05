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
        .module('objectPropertyAxioms', [])
        .directive('objectPropertyAxioms', objectPropertyAxioms);

        objectPropertyAxioms.$inject = ['ontologyStateService', 'propertyManagerService', 'prefixes', 'ontologyUtilsManagerService', 'ontologyManagerService', 'modalService'];

        function objectPropertyAxioms(ontologyStateService, propertyManagerService, prefixes, ontologyUtilsManagerService, ontologyManagerService, modalService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/objectPropertyAxioms/objectPropertyAxioms.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var om = ontologyManagerService;
                    dvm.os = ontologyStateService;
                    dvm.pm = propertyManagerService;
                    dvm.ontoUtils = ontologyUtilsManagerService;

                    dvm.getAxioms = function() {
                        return _.map(dvm.pm.objectAxiomList, 'iri');
                    }
                    dvm.openRemoveOverlay = function(key, index) {
                        dvm.key = key;
                        // dvm.index = index;
                        // dvm.showRemoveOverlay = true;
                        modalService.openConfirmModal(dvm.ontoUtils.getRemovePropOverlayMessage(key, index), () => {
                            dvm.ontoUtils.removeProperty(key, index).then(dvm.removeFromHierarchy);
                        });
                    }
                    dvm.removeFromHierarchy = function(axiomObject) {
                        if (prefixes.rdfs + 'subPropertyOf' === dvm.key && !om.isBlankNodeId(axiomObject['@id'])) {
                            dvm.os.deleteEntityFromParentInHierarchy(dvm.os.listItem.objectProperties.hierarchy, dvm.os.listItem.selected['@id'], axiomObject['@id'], dvm.os.listItem.objectProperties.index);
                            dvm.os.listItem.objectProperties.flat = dvm.os.flattenHierarchy(dvm.os.listItem.objectProperties.hierarchy, dvm.os.listItem.ontologyRecord.recordId);
                            dvm.os.setVocabularyStuff();
                        }
                    }
                }
            }
        }
})();

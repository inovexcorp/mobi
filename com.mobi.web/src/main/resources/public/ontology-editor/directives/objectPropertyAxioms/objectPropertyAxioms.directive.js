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
         * @name objectPropertyAxioms
         *
         * @description
         * The `objectPropertyAxioms` module only provides the `objectPropertyAxioms` directive which creates a
         * list of the axioms on an object property.
         */
        .module('objectPropertyAxioms', [])
        /**
         * @ngdoc directive
         * @name objectPropertyAxioms.directive:objectPropertyAxioms
         * @scope
         * @restrict E
         * @requires ontologyState.service:ontologyStateService
         * @requires propertyManager.service:propertyManagerService
         * @requires prefixes.service:prefixes
         * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
         * @requires ontologyManager.service:ontologyManagerService
         * @requires modal.service:modalService
         *
         * @description
         * `objectPropertyAxioms` is a directive that creates a list of
         * {@link propertyValues.directive:propertyValues} of the axioms on the
         * {@link ontologyState.service:ontologyStateService selected object property}.
         * The directive houses the methods for opening the modal for removing property axioms. The
         * directive is replaced by the contents of its template.
         */
        .directive('objectPropertyAxioms', objectPropertyAxioms);

        objectPropertyAxioms.$inject = ['ontologyStateService', 'propertyManagerService', 'prefixes', 'ontologyUtilsManagerService', 'ontologyManagerService', 'modalService'];

        function objectPropertyAxioms(ontologyStateService, propertyManagerService, prefixes, ontologyUtilsManagerService, ontologyManagerService, modalService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'ontology-editor/directives/objectPropertyAxioms/objectPropertyAxioms.directive.html',
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

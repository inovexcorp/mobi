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
        .module('axiomBlock', [])
        .directive('axiomBlock', axiomBlock);

        axiomBlock.$inject = ['ontologyStateService', 'ontologyManagerService', 'ontologyUtilsManagerService', 'propertyManagerService', 'modalService', 'prefixes'];

        function axiomBlock(ontologyStateService, ontologyManagerService, ontologyUtilsManagerService, propertyManagerService, modalService, prefixes) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/axiomBlock/axiomBlock.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var pm = propertyManagerService;
                    var ontoUtils = ontologyUtilsManagerService;
                    dvm.om = ontologyManagerService;
                    dvm.os = ontologyStateService;

                    dvm.showAxiomOverlay = function() {
                        if (dvm.om.isClass(dvm.os.listItem.selected)) {
                            modalService.openModal('axiomOverlay', {axiomList: pm.classAxiomList}, dvm.updateClassHierarchy);
                        } else if (dvm.om.isObjectProperty(dvm.os.listItem.selected)) {
                            modalService.openModal('axiomOverlay', {axiomList: pm.objectAxiomList}, dvm.updateObjectPropHierarchy);
                        } else if (dvm.om.isDataTypeProperty(dvm.os.listItem.selected)) {
                            modalService.openModal('axiomOverlay', {axiomList: pm.datatypeAxiomList}, dvm.updateDataPropHierarchy);
                        }
                    }
                    dvm.updateClassHierarchy = function(updatedAxiomObj) {
                        if (updatedAxiomObj.axiom === prefixes.rdfs + 'subClassOf' && updatedAxiomObj.values.length) {
                            ontoUtils.setSuperClasses(dvm.os.listItem.selected['@id'], updatedAxiomObj.values);
                            if (_.includes(dvm.os.listItem.individualsParentPath, dvm.os.listItem.selected['@id'])) {
                                ontoUtils.updateflatIndividualsHierarchy(updatedAxiomObj.values);
                            }
                            dvm.os.setVocabularyStuff();
                        }
                    }
                    dvm.updateDataPropHierarchy = function(updatedAxiomObj) {
                        if (updatedAxiomObj.axiom === prefixes.rdfs + 'subPropertyOf' && updatedAxiomObj.values.length) {
                            ontoUtils.setSuperProperties(dvm.os.listItem.selected['@id'], updatedAxiomObj.values, 'dataProperties');
                        } else if (updatedAxiomObj.axiom === prefixes.rdfs + 'domain' && updatedAxiomObj.values.length) {
                            dvm.os.listItem.flatEverythingTree = dvm.os.createFlatEverythingTree(dvm.os.getOntologiesArray(), dvm.os.listItem);
                        }
                    }
                    dvm.updateObjectPropHierarchy = function(updatedAxiomObj) {
                        if (updatedAxiomObj.axiom === prefixes.rdfs + 'subPropertyOf' && updatedAxiomObj.values.length) {
                            ontoUtils.setSuperProperties(dvm.os.listItem.selected['@id'], updatedAxiomObj.values, 'objectProperties');
                            if (ontoUtils.containsDerivedSemanticRelation(updatedAxiomObj.values)) {
                                dvm.os.setVocabularyStuff();
                            }
                        } else if (updatedAxiomObj.axiom === prefixes.rdfs + 'domain' && updatedAxiomObj.values.length) {
                            dvm.os.listItem.flatEverythingTree = dvm.os.createFlatEverythingTree(dvm.os.getOntologiesArray(), dvm.os.listItem);
                        }
                    }
                }
            }
        }
})();

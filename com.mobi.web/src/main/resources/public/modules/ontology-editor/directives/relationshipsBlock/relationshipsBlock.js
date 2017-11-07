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
         * @name relationshipsBlock
         *
         * @description
         * The `relationshipsBlock` module only provides the `relationshipsBlock` directive which creates
         * the relationships block within the vocabulary editor.
         */
        .module('relationshipsBlock', [])
        /**
         * @ngdoc directive
         * @name relationshipsBlock.directive:relationshipsBlock
         * @scope
         * @restrict E
         * @requires ontologyManager.service:ontologyManagerService
         * @requires ontologyState.service:ontologyStateService
         * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
         * @requires prefixes.service:prefixes
         * @requires responseObj.service:responseObj
         *
         * @description
         * HTML contents in the relationships block with provides the users with a display of SKOS vocabulary relationships
         * for the selected entity. A link to add additional relationships is also provided.
         *
         * @param {Object[]} relationshipList the list of relationships to display
         */
        .directive('relationshipsBlock', relationshipsBlock);

        relationshipsBlock.$inject = ['ontologyManagerService', 'ontologyStateService', 'ontologyUtilsManagerService', 'prefixes', 'responseObj'];

        function relationshipsBlock(ontologyManagerService, ontologyStateService, ontologyUtilsManagerService, prefixes, responseObj) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/relationshipsBlock/relationshipsBlock.html',
                scope: {},
                bindToController: {
                    relationshipList: '='
                },
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var ro = responseObj;
                    var broaderRelations = [
                        prefixes.skos + 'broaderTransitive',
                        prefixes.skos + 'broader',
                        prefixes.skos + 'broadMatch'
                    ];
                    var narrowerRelations = [
                        prefixes.skos + 'narrowerTransitive',
                        prefixes.skos + 'narrower',
                        prefixes.skos + 'narrowMatch'
                    ];
                    var conceptToScheme = [
                        prefixes.skos + 'inScheme',
                        prefixes.skos + 'topConceptOf'
                    ];
                    var schemeToConcept = [
                        prefixes.skos + 'hasTopConcept'
                    ];
                    dvm.om = ontologyManagerService;
                    dvm.os = ontologyStateService;
                    dvm.ontoUtils = ontologyUtilsManagerService;
                    dvm.prefixes = prefixes;
                    dvm.showTopConceptOverlay = false;

                    dvm.openRemoveOverlay = function(key, index) {
                        dvm.key = key;
                        dvm.index = index;
                        dvm.showRemoveOverlay = true;
                    }

                    dvm.updateHierarchy = function(relationship, values) {
                        var relationshipIRI = ro.getItemIri(relationship);
                        if (shouldAdd(relationshipIRI, broaderRelations)) {
                            commonAdd(relationshipIRI, values, dvm.os.listItem.selected['@id'], undefined, broaderRelations, narrowerRelations, 'concepts');
                        } else if (shouldAdd(relationshipIRI, narrowerRelations)) {
                            commonAdd(relationshipIRI, values, undefined, dvm.os.listItem.selected['@id'], narrowerRelations, broaderRelations, 'concepts');
                        } else if (shouldAdd(relationshipIRI, conceptToScheme)) {
                            commonAdd(relationshipIRI, values, dvm.os.listItem.selected['@id'], undefined, conceptToScheme, schemeToConcept, 'conceptSchemes')
                        } else if (shouldAdd(relationshipIRI, schemeToConcept)) {
                            commonAdd(relationshipIRI, values, undefined, dvm.os.listItem.selected['@id'], schemeToConcept, conceptToScheme, 'conceptSchemes')
                        }
                    }

                    dvm.removeFromHierarchy = function(axiomObject) {
                        if (shouldDelete(axiomObject, broaderRelations, narrowerRelations)) {
                            deleteFromConceptHierarchy(dvm.os.listItem.selected['@id'], axiomObject['@id']);
                        } else if (shouldDelete(axiomObject, narrowerRelations, broaderRelations)) {
                            deleteFromConceptHierarchy(axiomObject['@id'], dvm.os.listItem.selected['@id']);
                        } else if (shouldDelete(axiomObject, conceptToScheme, schemeToConcept)) {
                            deleteFromSchemeHierarchy(dvm.os.listItem.selected['@id']);
                        } else if (shouldDelete(axiomObject, schemeToConcept, conceptToScheme)) {
                            deleteFromSchemeHierarchy(axiomObject['@id']);
                        }
                    }

                    dvm.hasTopConceptProperty = function() {
                        return !_.isEmpty(dvm.os.getEntityByRecordId(dvm.os.listItem.ontologyRecord.recordId, prefixes.skos + 'hasTopConcept', dvm.os.listItem));
                    }

                    function containsProperty(entity, properties, value) {
                        return _.some(properties, property => _.some(_.get(entity, property), {'@id': value}));
                    }
                    function shouldAdd(relationshipIRI, array) {
                        return _.includes(array, relationshipIRI);
                    }
                    function commonAdd(relationshipIRI, values, entityIRI, parentIRI, targetArray, otherArray, key) {
                        var update = false;
                        _.forEach(values, value => {
                            if (!containsProperty(dvm.os.listItem.selected, _.without(targetArray, relationshipIRI), value['@id']) && !containsProperty(dvm.os.getEntityByRecordId(dvm.os.listItem.ontologyRecord.recordId, value['@id'], dvm.os.listItem), otherArray, value['@id'])) {
                                dvm.os.addEntityToHierarchy(dvm.os.listItem[key].hierarchy, entityIRI || value['@id'], dvm.os.listItem[key].index, parentIRI || value['@id']);
                                update = true;
                            }
                        });
                        if (update) {
                            dvm.os.listItem[key].flat = dvm.os.flattenHierarchy(dvm.os.listItem[key].hierarchy, dvm.os.listItem.ontologyRecord.recordId);
                        }
                    }
                    function shouldDelete(axiomObject, targetArray, otherArray) {
                        return _.includes(targetArray, dvm.key) && !containsProperty(dvm.os.listItem.selected, _.without(targetArray, dvm.key), axiomObject['@id']) && !containsProperty(dvm.os.getEntityByRecordId(dvm.os.listItem.ontologyRecord.recordId, axiomObject['@id'], dvm.os.listItem), otherArray, dvm.os.listItem.selected['@id']);
                    }
                    function deleteFromConceptHierarchy(entityIRI, parentIRI) {
                        dvm.os.deleteEntityFromParentInHierarchy(dvm.os.listItem.concepts.hierarchy, entityIRI, parentIRI, dvm.os.listItem.concepts.index);
                        commonDelete('concepts');
                    }
                    function deleteFromSchemeHierarchy(entityIRI) {
                        dvm.os.deleteEntityFromHierarchy(dvm.os.listItem.conceptSchemes.hierarchy, entityIRI, dvm.os.listItem.conceptSchemes.index);
                        if (_.get(dvm.os.listItem, 'editorTabStates.schemes.entityIRI') === entityIRI) {
                            _.unset(dvm.os.listItem, 'editorTabStates.schemes.entityIRI');
                        }
                        commonDelete('conceptSchemes');
                    }
                    function commonDelete(key) {
                        dvm.os.listItem[key].flat = dvm.os.flattenHierarchy(dvm.os.listItem[key].hierarchy, dvm.os.listItem.ontologyRecord.recordId);
                        dvm.os.goTo(dvm.os.listItem.selected['@id']);
                    }
                }
            }
        }
})();

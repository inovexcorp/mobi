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
        .module('relationshipsBlock', [])
        .directive('relationshipsBlock', relationshipsBlock);

        relationshipsBlock.$inject = ['ontologyStateService', 'ontologyManagerService', 'prefixes', 'responseObj'];

        function relationshipsBlock(ontologyStateService, ontologyManagerService, prefixes, responseObj) {
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
                    dvm.om = ontologyManagerService;
                    dvm.sm = ontologyStateService;
                    dvm.ro = responseObj;

                    function containsProperty(entity, properties) {
                        _.forOwn(entity, (value, key) => {
                            if (_.includes(properties, key)) {
                                return true;
                            }
                        });
                        return false;
                    }

                    dvm.openRemoveOverlay = function(key, index) {
                        dvm.key = key;
                        dvm.index = index;
                        dvm.showRemoveOverlay = true;
                    }

                    dvm.updateHierarchy = function(relationship, values) {
                        var relationshipIRI = dvm.ro.getItemIri(relationship);
                        if (_.includes(broaderRelations, relationshipIRI) && !containsProperty(dvm.sm.selected,
                            _.without(broaderRelations, relationshipIRI))) {
                            _.forEach(values, value => {
                                if (!containsProperty(dvm.om.getEntityById(dvm.sm.listItem.ontologyId, value['@id']),
                                    narrowerRelations)) {
                                    dvm.sm.addEntityToHierarchy(dvm.sm.listItem.conceptHierarchy,
                                        dvm.sm.selected.matonto.originalIRI, dvm.sm.listItem.conceptIndex,
                                        value['@id']);
                                }
                            });
                            dvm.sm.goTo(dvm.sm.selected.matonto.originalIRI);
                        } else if (_.includes(narrowerRelations, relationshipIRI) && !containsProperty(dvm.sm.selected,
                            _.without(narrowerRelations, relationshipIRI))) {
                            _.forEach(values, value => {
                                if (!containsProperty(dvm.om.getEntityById(dvm.sm.listItem.ontologyId, value['@id']),
                                    narrowerRelations)) {
                                    dvm.sm.addEntityToHierarchy(dvm.sm.listItem.conceptHierarchy, value['@id'],
                                        dvm.sm.listItem.conceptIndex, dvm.sm.selected.matonto.originalIRI);
                                }
                            });
                            dvm.sm.goTo(dvm.sm.selected.matonto.originalIRI);
                        } else if ()
                    }

                    dvm.removeFromHierarchy = function(axiomObject) {
                        if (_.includes(broaderRelations, dvm.key)) {
                            dvm.sm.deleteEntityFromParentInHierarchy(dvm.sm.listItem.conceptHierarchy,
                                dvm.sm.selected.matonto.originalIRI, axiomObject['@id'], dvm.sm.listItem.conceptIndex);
                            dvm.sm.goTo(dvm.sm.selected.matonto.originalIRI);
                        } else if (_.includes(narrowerRelations, dvm.key)) {
                            dvm.sm.deleteEntityFromParentInHierarchy(dvm.sm.listItem.conceptHierarchy,
                                axiomObject['@id'], dvm.sm.selected.matonto.originalIRI, dvm.sm.listItem.conceptIndex);
                            dvm.sm.goTo(dvm.sm.selected.matonto.originalIRI);
                        }
                    }
                }
            }
        }
})();

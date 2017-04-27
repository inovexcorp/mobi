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
        .module('datatypePropertyAxioms', [])
        .directive('datatypePropertyAxioms', datatypePropertyAxioms);

        datatypePropertyAxioms.$inject = ['ontologyStateService', 'propertyManagerService', 'responseObj', 'prefixes', 'ontologyUtilsManagerService'];

        function datatypePropertyAxioms(ontologyStateService, propertyManagerService, responseObj, prefixes, ontologyUtilsManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/datatypePropertyAxioms/datatypePropertyAxioms.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.os = ontologyStateService;
                    dvm.pm = propertyManagerService;
                    dvm.ro = responseObj;
                    dvm.ontoUtils = ontologyUtilsManagerService;

                    dvm.openRemoveOverlay = function(key, index) {
                        dvm.key = key;
                        dvm.index = index;
                        dvm.showRemoveOverlay = true;
                    }

                    dvm.updateHierarchy = function(axiom, values) {
                        var localName = _.get(axiom, 'localName');
                        if (localName === 'subPropertyOf') {
                            _.forEach(values, value => {
                                dvm.os.addEntityToHierarchy(dvm.os.listItem.dataPropertyHierarchy, dvm.os.selected.matonto.originalIRI, dvm.os.listItem.dataPropertyIndex, dvm.ro.getItemIri(value));
                            });
                            dvm.os.listItem.flatDataPropertyHierarchy = dvm.os.flattenHierarchy(dvm.os.listItem.dataPropertyHierarchy, dvm.os.listItem.recordId);
                        } else if (localName === 'domain') {
                            dvm.os.listItem.flatEverythingTree = dvm.os.createFlatEverythingTree(dvm.os.listItem.ontology, dvm.os.listItem.recordId);
                        }
                    }

                    dvm.removeFromHierarchy = function(axiomObject) {
                        if (prefixes.rdfs + 'subPropertyOf' === dvm.key) {
                            dvm.os.deleteEntityFromParentInHierarchy(dvm.os.listItem.dataPropertyHierarchy, dvm.os.selected.matonto.originalIRI, axiomObject['@id'], dvm.os.listItem.dataPropertyIndex);
                            dvm.os.listItem.flatDataPropertyHierarchy = dvm.os.flattenHierarchy(dvm.os.listItem.dataPropertyHierarchy, dvm.os.listItem.recordId);
                        }
                    }
                }
            }
        }
})();

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
        .module('objectPropertyAxioms', [])
        .directive('objectPropertyAxioms', objectPropertyAxioms);

        objectPropertyAxioms.$inject = ['ontologyStateService', 'propertyManagerService', 'responseObj', 'prefixes', 'ontologyUtilsManagerService'];

        function objectPropertyAxioms(ontologyStateService, propertyManagerService, responseObj, prefixes, ontologyUtilsManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/objectPropertyAxioms/objectPropertyAxioms.html',
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
                        if (_.get(axiom, 'localName') === 'subPropertyOf') {
                            _.forEach(values, value => {
                                dvm.os.addEntityToHierarchy(dvm.os.listItem.objectPropertyHierarchy,
                                    dvm.os.selected.matonto.originalIRI, dvm.os.listItem.objectPropertyIndex,
                                    dvm.ro.getItemIri(value));
                            });
                        }
                    }

                    dvm.removeFromHierarchy = function(axiomObject) {
                        if (prefixes.rdfs + 'subPropertyOf' === dvm.key) {
                            dvm.os.deleteEntityFromParentInHierarchy(dvm.os.listItem.objectPropertyHierarchy,
                                dvm.os.selected.matonto.originalIRI, axiomObject['@id'], dvm.os.listItem.objectPropertyIndex);
                        }
                    }
                }
            }
        }
})();

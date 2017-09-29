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
        .module('classAxioms', [])
        .directive('classAxioms', classAxioms);

        classAxioms.$inject = ['ontologyStateService', 'propertyManagerService', 'responseObj', 'prefixes', 'ontologyUtilsManagerService', 'ontologyManagerService'];

        function classAxioms(ontologyStateService, propertyManagerService, responseObj, prefixes, ontologyUtilsManagerService, ontologyManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/classAxioms/classAxioms.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var om = ontologyManagerService;
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
                        if (_.get(axiom, 'localName') === 'subClassOf' && values.length) {
                            var classIRIs = _.map(values, value => dvm.ro.getItemIri(value));
                            dvm.ontoUtils.setSuperClasses(dvm.os.listItem.selected['@id'], classIRIs);
                            dvm.ontoUtils.updateflatIndividualsHierarchy(classIRIs);
                        }
                    }

                    dvm.removeFromHierarchy = function(axiomObject) {
                        if (prefixes.rdfs + 'subClassOf' === dvm.key && !om.isBlankNodeId(axiomObject['@id'])) {
                            dvm.os.deleteEntityFromParentInHierarchy(dvm.os.listItem.classHierarchy, dvm.os.listItem.selected['@id'], axiomObject['@id'], dvm.os.listItem.classIndex);
                            dvm.os.listItem.flatClassHierarchy = dvm.os.flattenHierarchy(dvm.os.listItem.classHierarchy, dvm.os.listItem.ontologyRecord.recordId);
                            dvm.os.listItem.individualsParentPath = dvm.os.getIndividualsParentPath(dvm.os.listItem);
                            dvm.os.listItem.flatIndividualsHierarchy = dvm.os.createFlatIndividualTree(dvm.os.listItem);
                        }
                    }
                }
            }
        }
})();

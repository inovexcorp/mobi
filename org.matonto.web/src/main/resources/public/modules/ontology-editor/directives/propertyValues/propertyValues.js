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
        .module('propertyValues', [])
        .directive('propertyValues', propertyValues);

        propertyValues.$inject = ['responseObj', 'ontologyStateService', 'ontologyManagerService'];

        function propertyValues(responseObj, ontologyStateService, ontologyManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/propertyValues/propertyValues.html',
                scope: {
                    property: '=',
                    entity: '=',
                    edit: '&?',
                    remove: '&?'
                },
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.ro = responseObj;
                    dvm.sm = ontologyStateService;
                    dvm.om = ontologyManagerService;

                    dvm.isBlankNode = function(id) {
                        return typeof id === 'string' && _.includes(id, '_:b');
                    }

                    dvm.getBlankNodeValue = function(id) {
                        var result;
                        if (dvm.isBlankNode(id)) {
                            result = _.get(dvm.sm.listItem.blankNodes, id, id);
                        }
                        return result;
                    }

                    dvm.isLinkable = function(id) {
                        return _.has(dvm.sm.listItem.index, id) && !dvm.isBlankNode(id);
                    }

                    dvm.goTo = function(iri) {
                        var entity = dvm.om.getEntityById(dvm.sm.listItem.ontologyId, iri);
                        if (dvm.sm.listItem.type === 'vocabulary') {
                            commonGoTo('concepts', iri);
                        } else if (dvm.om.isClass(entity)) {
                            commonGoTo('classes', iri);
                        } else if (dvm.om.isProperty(entity)) {
                            commonGoTo('properties', iri);
                        } else if (dvm.om.isIndividual(entity)) {
                            commonGoTo('individuals', iri);
                        }
                    }

                    function commonGoTo(key, iri) {
                        dvm.sm.setActivePage(key);
                        dvm.sm.selectItem(iri);
                    }
                }
            }
        }
})();

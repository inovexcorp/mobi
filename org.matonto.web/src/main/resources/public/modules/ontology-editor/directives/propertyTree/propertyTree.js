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
        .module('propertyTree', ['ontologyManager', 'stateManager', 'prefixes'])
        .directive('propertyTree', propertyTree);

        propertyTree.$inject = ['ontologyManagerService', 'stateManagerService', 'prefixes'];

        function propertyTree(ontologyManagerService, stateManagerService, prefixes) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/propertyTree/propertyTree.html',
                scope: {
                    headerText: '@'
                },
                bindToController: {
                    propertyType: '@'
                },
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;

                    dvm.om = ontologyManagerService;
                    dvm.sm = stateManagerService;
                    dvm.ontologies = dvm.om.getList();

                    dvm.isThisType = function(property, propertyType) {
                        var lowerCasePropertyTypeIRI = (prefixes.owl + propertyType).toLowerCase();
                        return _.findIndex(_.get(property, '@type', []), function(type) {
                            return type.toLowerCase() === lowerCasePropertyTypeIRI;
                        }) !== -1;
                    }

                    dvm.hasChildren = function(ontology) {
                        var result = _.some(_.get(ontology, 'matonto.noDomains', []), function(property) {
                            return dvm.isThisType(property, dvm.propertyType);
                        });

                        if(!result) {
                            result = _.some(_.get(ontology, 'matonto.classes', []), function(classObj) {
                                return _.some(_.get(classObj, 'matonto.properties', []), function(property) {
                                    return dvm.isThisType(property, dvm.propertyType);
                                });
                            });
                        }

                        return result;
                    }
                }
            }
        }
})();

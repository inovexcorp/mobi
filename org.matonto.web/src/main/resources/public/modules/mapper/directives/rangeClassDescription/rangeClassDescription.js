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
        /**
         * @ngdoc overview
         * @name rangeClassDescription
         *
         * @description 
         * The `rangeClassDescription` module only provides the `rangeClassDescription` directive 
         * which creates a brief description of the class an object property links to.
         */
        .module('rangeClassDescription', [])
        /**
         * @ngdoc directive
         * @name rangeClassDescription.directive:rangeClassDescription
         * @scope
         * @restrict E
         * @requires  prefixes.prefixes
         * @requires  ontologyManager.service:ontologyManagerService
         * @requires  mappingManager.service:mappingManagerService
         *
         * @description 
         * `rangeClassDescription` is a directive which creates a div with the name of the class
         * an object property links to and a brief description of that class. The object property 
         * in question is determined using the class id of the parent class and the property id. 
         * The directive is replaced by the contents of its template.
         *
         * @param {string} classId the id of the parent class
         * @param {string} selectedPropId the id of the object property
         */
        .directive('rangeClassDescription', rangeClassDescription);

        rangeClassDescription.$inject = ['prefixes', 'ontologyManagerService', 'mappingManagerService'];

        function rangeClassDescription(prefixes, ontologyManagerService, mappingManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                bindToController: {
                    classId: '@',
                    selectedPropId: '@'
                },
                controller: function() {
                    var dvm = this;
                    dvm.mm = mappingManagerService;
                    dvm.om = ontologyManagerService;

                    dvm.getRangeClassName = function() {
                        return dvm.om.getEntityName(getRangeClass());
                    }
                    dvm.getRangeClassDescription = function() {
                        return _.get(getRangeClass(), "['" + prefixes.rdfs + "comment'][0]['@value']", _.get(getRangeClass(), "['" + prefixes.dc + "description'][0]['@value']", ''));
                    }
                    function getRangeClass() {
                        var ontology = dvm.om.findOntologyWithClass(dvm.mm.sourceOntologies, dvm.classId);
                        var propObj = dvm.om.getClassProperty(ontology, dvm.classId, dvm.selectedPropId);
                        var rangeClassId = _.get(propObj, "['"+ prefixes.rdfs + "range'][0]['@id']");
                        return dvm.om.getEntity(dvm.om.findOntologyWithClass(dvm.mm.sourceOntologies, rangeClassId), rangeClassId);
                    }
                },
                templateUrl: 'modules/mapper/directives/rangeClassDescription/rangeClassDescription.html'
            }
        }
})();

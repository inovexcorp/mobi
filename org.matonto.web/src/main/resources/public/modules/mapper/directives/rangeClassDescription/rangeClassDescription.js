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
        .module('rangeClassDescription', ['prefixes', 'ontologyManager'])
        .directive('rangeClassDescription', rangeClassDescription);

        rangeClassDescription.$inject = ['prefixes', 'ontologyManagerService'];

        function rangeClassDescription(prefixes, ontologyManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                bindToController: {
                    ontologies: '=',
                    classId: '@',
                    selectedProp: '@'
                },
                controller: function() {
                    var dvm = this;

                    dvm.getRangeClassName = function() {
                        return ontologyManagerService.getEntityName(getRangeClass());
                    }
                    dvm.getRangeClassDescription = function() {
                        return _.get(getRangeClass(), "['" + prefixes.rdfs + "comment'][0]['@value']", _.get(dvm.ontology, "['" + prefixes.dc + "description'][0]['@value']", ''));
                    }
                    function getRangeClass() {
                        var ontology = ontologyManagerService.findOntologyWithClass(dvm.ontologies, dvm.classId);
                        var propObj = ontologyManagerService.getClassProperty(ontology, dvm.classId, dvm.selectedProp);
                        var rangeClassId = _.get(propObj, "['"+ prefixes.rdfs + "range'][0]['@id']");
                        return ontologyManagerService.getClass(ontologyManagerService.findOntologyWithClass(dvm.ontologies, rangeClassId), rangeClassId);
                    }
                },
                templateUrl: 'modules/mapper/directives/rangeClassDescription/rangeClassDescription.html'
            }
        }
})();

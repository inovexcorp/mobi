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
        .module('editClassForm', ['prefixes', 'mappingManager', 'ontologyManager'])
        .directive('editClassForm', editClassForm);

        editClassForm.$inject = ['prefixes', 'mappingManagerService', 'ontologyManagerService'];

        function editClassForm(prefixes, mappingManagerService, ontologyManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                    props: '=',
                    isLastClass: '=',
                    clickDelete: '&',
                    openProp: '&',
                    editIri: '&'
                },
                bindToController: {
                    mapping: '=',
                    ontologies: '=',
                    classMappingId: '='
                },
                controller: ['$scope', function($scope) {
                    var dvm = this;

                    dvm.getIriTemplate = function() {
                        var classMapping = _.find(dvm.mapping.jsonld, {'@id': dvm.classMappingId});
                        var prefix = _.get(classMapping, "['" + prefixes.delim + "hasPrefix'][0]['@value']", '');
                        var localName = _.get(classMapping, "['" + prefixes.delim + "localName'][0]['@value']", '');
                        return prefix + localName;
                    }
                    dvm.openProperty = function(propId) {
                        $scope.openProp({propId: propId});
                    }
                    dvm.getTitle = function() {
                        var classId = mappingManagerService.getClassIdByMappingId(dvm.mapping.jsonld, dvm.classMappingId);
                        var ontology = ontologyManagerService.findOntologyWithClass(dvm.ontologies, classId);
                        return ontologyManagerService.getEntityName(ontologyManagerService.getClass(ontology, classId));
                    }
                }],
                templateUrl: 'modules/mapper/directives/editClassForm/editClassForm.html'
            }
        }
})();

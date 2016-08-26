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
         * @name editClassForm
         *
         * @description 
         * The `editClassForm` module only provides the `editClassForm` directive which creates
         * a form with functionality to change the selected class' IRI template.
         */
        .module('editClassForm', [])
        /**
         * @ngdoc directive
         * @name editClassForm.directive:editClassForm
         * @scope
         * @restrict E
         * @requires  prefixes.service:prefixes
         * @requires  ontologyManager.service:ontologyManagerService
         * @requires  mappingManager.service:mappingManagerService
         * @requires  mapperState.service:mapperStateService
         *
         * @description 
         * `editClassForm` is a directive that creates a form with functionality to change the selected
         * class' IRI template. The directive is replaced by the contents of its template.
         */
        .directive('editClassForm', editClassForm);

        editClassForm.$inject = ['prefixes', 'mapperStateService', 'mappingManagerService', 'ontologyManagerService'];

        function editClassForm(prefixes, mapperStateService, mappingManagerService, ontologyManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.mm = mappingManagerService;
                    dvm.state = mapperStateService;
                    dvm.om = ontologyManagerService;

                    dvm.getIriTemplate = function() {
                        var classMapping = _.find(dvm.mm.mapping.jsonld, {'@id': dvm.state.selectedClassMappingId});
                        var prefix = _.get(classMapping, "['" + prefixes.delim + "hasPrefix'][0]['@value']", '');
                        var localName = _.get(classMapping, "['" + prefixes.delim + "localName'][0]['@value']", '');
                        return prefix + localName;
                    }
                    dvm.getTitle = function() {
                        var classId = dvm.mm.getClassIdByMappingId(dvm.mm.mapping.jsonld, dvm.state.selectedClassMappingId);
                        var ontology = dvm.mm.findSourceOntologyWithClass(classId);
                        return dvm.om.getEntityName(dvm.om.getEntity(ontology.entities, classId));
                    }
                },
                templateUrl: 'modules/mapper/directives/editClassForm/editClassForm.html'
            }
        }
})();

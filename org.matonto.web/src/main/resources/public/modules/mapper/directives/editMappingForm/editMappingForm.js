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
        .module('editMappingForm', [])
        .directive('editMappingForm', editMappingForm);

        editMappingForm.$inject = ['mappingManagerService', 'mapperStateService', 'ontologyManagerService'];

        function editMappingForm(mappingManagerService, mapperStateService, ontologyManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.state = mapperStateService;
                    dvm.mm = mappingManagerService;
                    dvm.om = ontologyManagerService;

                    dvm.getSourceOntologyName = function() {
                        var sourceOntology = dvm.mm.getSourceOntology(dvm.mm.mapping.jsonld);
                        return sourceOntology ? dvm.om.getEntityName(dvm.om.getOntologyEntity(sourceOntology.entities)) : '';
                    }
                    dvm.getBaseClassName = function() {
                        var baseClass = dvm.mm.getBaseClass(dvm.mm.mapping.jsonld);
                        return baseClass ? dvm.getClassName(baseClass) : '';
                    }
                    dvm.getClassName = function(classMapping) {
                        var classId = dvm.mm.getClassIdByMapping(classMapping);
                        return dvm.om.getEntityName(dvm.om.getEntity(_.get(dvm.mm.findSourceOntologyWithClass(classId), 'entities'), classId));
                    }
                },
                templateUrl: 'modules/mapper/directives/editMappingForm/editMappingForm.html'
            }
        }
})();
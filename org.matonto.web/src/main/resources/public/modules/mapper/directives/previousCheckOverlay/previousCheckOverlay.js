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
        .module('previousCheckOverlay', ['ontologyManager', 'mappingManager'])
        .directive('previousCheckOverlay', previousCheckOverlay);

        previousCheckOverlay.$inject = ['ontologyManagerService', 'mappingManagerService'];

        function previousCheckOverlay(ontologyManagerService, mappingManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                    onClickBack: '&',
                    onClickContinue: '&'
                },
                bindToController: {
                    mapping: '=',
                    ontology: '=',
                    filePreview: '='
                },
                link: function(scope, elem, attrs, ctrl) {
                    ctrl.setValidity();
                },
                controller: function() {
                    var dvm = this;
                    dvm.invalidColumns = _.chain(mappingManagerService.getMappedColumns(dvm.mapping.jsonld))
                        .forEach(obj => obj.index = parseInt(obj.index, 10))
                        .filter(obj => obj.index > dvm.filePreview.headers.length - 1)
                        .sortBy('index')
                        .value();

                    dvm.getDataMappingName = function(dataMappingId) {
                        var propId = mappingManagerService.getPropIdByMappingId(dvm.mapping.jsonld, dataMappingId);
                        var classId = mappingManagerService.getClassIdByMapping(
                            mappingManagerService.findClassWithDataMapping(dvm.mapping.jsonld, dataMappingId)
                        );
                        var propName = ontologyManagerService.getEntityName(ontologyManagerService.getClassProperty(dvm.ontology, classId, propId));
                        var className = ontologyManagerService.getEntityName(ontologyManagerService.getClass(dvm.ontology, classId));
                        return className + ': ' + propName;
                    }
                    dvm.setValidity = function() {
                        if (dvm.validateForm) {
                            dvm.validateForm.$setValidity('validColumnMappings', dvm.invalidColumns.length === 0);
                            dvm.validateForm.$setValidity('existingOntology', dvm.ontology !== undefined);
                        }
                    }
                    dvm.getSourceOntologyId = function() {
                        return mappingManagerService.getSourceOntologyId(dvm.mapping);
                    }
                },
                templateUrl: 'modules/mapper/directives/previousCheckOverlay/previousCheckOverlay.html'
            }
        }
})();

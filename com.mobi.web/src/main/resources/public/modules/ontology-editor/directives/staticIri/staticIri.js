/*-
 * #%L
 * com.mobi.web
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
        .module('staticIri', [])
        .directive('staticIri', staticIri);

        staticIri.$inject = ['$filter', 'ontologyStateService', 'ontologyUtilsManagerService', 'modalService'];

        function staticIri($filter, ontologyStateService, ontologyUtilsManagerService, modalService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/staticIri/staticIri.html',
                scope: {
                    onEdit: '&'
                },
                bindToController: {
                    iri: '=',
                    duplicateCheck: '<'
                },
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    dvm.os = ontologyStateService;
                    dvm.ontoUtils = ontologyUtilsManagerService;

                    dvm.setVariables = function(obj) {
                        var splitIri = $filter('splitIRI')(dvm.iri);
                        dvm.iriBegin = splitIri.begin;
                        dvm.iriThen = splitIri.then;
                        dvm.iriEnd = splitIri.end;
                    }
                    dvm.showIriOverlay = function() {
                        var resolveObj = {
                            iriBegin: dvm.iriBegin,
                            iriThen: dvm.iriThen,
                            iriEnd: dvm.iriEnd,
                        };
                        if (dvm.duplicateCheck) {
                            resolveObj.customValidation = {
                                func: dvm.ontoUtils.checkIri,
                                msg: 'This IRI already exists'
                            };
                        }
                        modalService.openModal('editIriOverlay', resolveObj, $scope.onEdit);
                    }

                    $scope.$watch('dvm.iri', function() {
                        dvm.setVariables();
                    });

                    dvm.setVariables();
                }]
            }
        }
})();

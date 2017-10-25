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

        staticIri.$inject = ['$filter', 'REGEX', 'ontologyStateService', 'ontologyUtilsManagerService', 'toastr'];

        function staticIri($filter, REGEX, ontologyStateService, ontologyUtilsManagerService, toastr) {
            return {
                restrict: 'E',
                transclude: true,
                templateUrl: 'directives/staticIri/staticIri.html',
                scope: {
                    onEdit: '&'
                },
                bindToController: {
                    iri: '='
                },
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;

                    dvm.os = ontologyStateService;
                    dvm.ontoUtils = ontologyUtilsManagerService;
                    dvm.refresh = {};
                    dvm.namespacePattern = REGEX.IRI;
                    dvm.localNamePattern = REGEX.LOCALNAME;

                    dvm.setVariables = function(obj) {
                        var splitIri = $filter('splitIRI')(dvm.iri);
                        obj.iriBegin = splitIri.begin;
                        obj.iriThen = splitIri.then;
                        obj.iriEnd = splitIri.end;
                    }

                    dvm.resetVariables = function() {
                        dvm.iriBegin = angular.copy(dvm.refresh.iriBegin);
                        dvm.iriThen = angular.copy(dvm.refresh.iriThen);
                        dvm.iriEnd = angular.copy(dvm.refresh.iriEnd);
                    }

                    dvm.onSuccess = function() {
                        toastr.success('', 'Copied', {timeOut: 2000});
                    }

                    dvm.isOverlay = function() {
                          return (dvm.os.showIriOverlay || dvm.os.showCreateClassOverlay || dvm.os.showCreatePropertyOverlay 
                                  || dvm.os.showCreateIndividualOverlay || dvm.os.showCreateConceptOverlay 
                                  || dvm.os.showCreateConceptSchemeOverlay);
                    }
                    $scope.$watch('dvm.iri', function() {
                        dvm.setVariables(dvm);
                        dvm.setVariables(dvm.refresh);
                    });

                    dvm.setVariables(dvm);
                    dvm.setVariables(dvm.refresh);
                }]
            }
        }
})();

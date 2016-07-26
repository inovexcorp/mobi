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
        .module('staticIri', ['stateManager'])
        .directive('staticIri', staticIri);

        staticIri.$inject = ['REGEX', 'stateManagerService'];

        function staticIri(REGEX, stateManagerService) {
            return {
                restrict: 'E',
                templateUrl: 'modules/ontology-editor/directives/staticIri/staticIri.html',
                scope: {
                    onEdit: '&'
                },
                bindToController: {
                    iri: '='
                },
                controllerAs: 'dvm',
                controller: ['$scope', '$filter', function($scope, $filter) {
                    var dvm = this;

                    dvm.sm = stateManagerService;
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

                    dvm.afterEdit = function() {
                        dvm.sm.ontology.matonto.iriBegin = angular.copy(dvm.iriBegin);
                        dvm.sm.ontology.matonto.iriThen = angular.copy(dvm.iriThen);
                        dvm.sm.showIriOverlay = false;
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

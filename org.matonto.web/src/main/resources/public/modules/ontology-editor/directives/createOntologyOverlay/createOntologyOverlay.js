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
        .module('createOntologyOverlay', ['camelCase'])
        .directive('createOntologyOverlay', createOntologyOverlay);

        function createOntologyOverlay() {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/createOntologyOverlay/createOntologyOverlay.html',
                scope: {
                    onCreate: '&',
                    onCancel: '&',
                    createOntologyError: '='
                },
                controllerAs: 'dvm',
                controller: ['$filter', 'REGEX', function($filter, REGEX) {
                    var dvm = this;
                    var date = new Date();
                    var prefix = 'https://matonto.org/ontologies/' + (date.getMonth() + 1) + '/' + date.getFullYear() + '/';

                    dvm.iriPattern = REGEX.IRI;
                    dvm.iriHasChanged = false;
                    dvm.iri = prefix;

                    dvm.nameChanged = function() {
                        if(!dvm.iriHasChanged) {
                            dvm.iri = prefix + $filter('camelCase')(dvm.name, 'class');
                        }
                    }
                }]
            }
        }
})();

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
        .module('everythingTree', [])
        .directive('everythingTree', everythingTree);

        everythingTree.$inject = ['ontologyManagerService', 'ontologyStateService', 'ontologyUtilsManagerService'];

        function everythingTree(ontologyManagerService, ontologyStateService, ontologyUtilsManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/everythingTree/everythingTree.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var ontoUtils = ontologyUtilsManagerService;

                    dvm.om = ontologyManagerService;
                    dvm.sm = ontologyStateService;

                    dvm.getName = function(entity) {
                        return ontoUtils.getLabelForIRI(_.get(entity, '@id', _.get(entity, 'matonto.originalIRI')));
                    }
                }
            }
        }
})();

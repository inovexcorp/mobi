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
        .module('classesTab', [])
        .directive('classesTab', classesTab);

        classesTab.$inject = ['$filter', 'stateManagerService', 'ontologyManagerService'];

        function classesTab($filter, stateManagerService, ontologyManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/new-directives/classesTab/classesTab.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.sm = stateManagerService;
                    dvm.om = ontologyManagerService;

                    dvm.deleteClass = function() {
                        var entityIRI = dvm.sm.getActiveEntityIRI();
                        dvm.sm.addDeletedEntity();
                        dvm.om.removeEntity(dvm.sm.ontology, entityIRI);
                        var split = $filter('splitIRI')(angular.copy(entityIRI));
                        _.remove(_.get(dvm.sm.listItem, 'subClasses'), {namespace:split.begin + split.then, localName: split.end});
                        _.pull(_.get(dvm.sm.listItem, 'classesWithIndividuals'), entityIRI);
                        var classHierarchy
                        var result = dvm.sm.deleteEntityFromHierarchy(_.get(dvm.sm.listItem, 'classHierarchy'), entityIRI);
                        console.log(result);
                        dvm.sm.unSelectItem();
                        dvm.showDeleteConfirmation = false;
                    }
                }
            }
        }
})();

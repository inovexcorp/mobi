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
        .module('ontologyUtilsManager', [])
        .service('ontologyUtilsManagerService', ontologyUtilsManagerService);

        ontologyUtilsManagerService.$inject = ['$filter', 'ontologyManagerService', 'stateManagerService',
            'updateRefsService'];

        function ontologyUtilsManagerService($filter, ontologyManagerService, stateManagerService, updateRefsService) {
            var self = this;
            self.om = ontologyManagerService;
            self.sm = stateManagerService;
            self.ur = updateRefsService;

            function commonDelete(entityIRI) {
                self.sm.addDeletedEntity();
                self.om.removeEntity(self.sm.ontology, entityIRI);
                self.ur.remove(self.sm.ontology, self.sm.selected['@id']);
                self.sm.unSelectItem();
            }

            self.deleteClass = function() {
                var entityIRI = self.sm.getActiveEntityIRI();
                var split = $filter('splitIRI')(angular.copy(entityIRI));
                _.remove(_.get(self.sm.listItem, 'subClasses'), {namespace:split.begin + split.then, localName: split.end});
                _.pull(_.get(self.sm.listItem, 'classesWithIndividuals'), entityIRI);
                self.sm.deleteEntityFromHierarchy(_.get(self.sm.listItem, 'classHierarchy'), entityIRI,
                    _.get(self.sm.listItem, 'classIndex'));
                commonDelete(entityIRI);
            }

            self.deleteObjectProperty = function() {
                var entityIRI = self.sm.getActiveEntityIRI();
                var split = $filter('splitIRI')(angular.copy(entityIRI));
                _.remove(_.get(self.sm.listItem, 'subObjectProperties'), entityIRI);
                self.sm.deleteEntityFromHierarchy(_.get(self.sm.listItem, 'objectPropertyHierarchy'), entityIRI,
                    _.get(self.sm.listItem, 'objectPropertyIndex'));
                commonDelete(entityIRI);
            }

            self.deleteDataTypeProperty = function() {
                var entityIRI = self.sm.getActiveEntityIRI();
                var split = $filter('splitIRI')(angular.copy(entityIRI));
                _.remove(_.get(self.sm.listItem, 'subDataProperties'), entityIRI);
                self.sm.deleteEntityFromHierarchy(_.get(self.sm.listItem, 'dataPropertyHierarchy'), entityIRI,
                    _.get(self.sm.listItem, 'dataPropertyIndex'));
                commonDelete(entityIRI);
            }

            self.deleteIndividual = function() {
                var entityIRI = self.sm.getActiveEntityIRI();
                var split = $filter('splitIRI')(angular.copy(entityIRI));
                _.remove(_.get(self.sm.listItem, 'individuals'), entityIRI);
                commonDelete(entityIRI);
            }

            self.deleteConcept = function() {
                var entityIRI = self.sm.getActiveEntityIRI();
                var split = $filter('splitIRI')(angular.copy(entityIRI));
                self.sm.deleteEntityFromHierarchy(_.get(self.sm.listItem, 'conceptHierarchy'), entityIRI,
                    _.get(self.sm.listItem, 'conceptIndex'));
                commonDelete(entityIRI);
            }

            self.deleteConceptScheme = function() {
                var entityIRI = self.sm.getActiveEntityIRI();
                var split = $filter('splitIRI')(angular.copy(entityIRI));
                self.sm.deleteEntityFromHierarchy(_.get(self.sm.listItem, 'conceptHierarchy'), entityIRI,
                    _.get(self.sm.listItem, 'conceptIndex'));
                commonDelete(entityIRI);
            }
        }
})();

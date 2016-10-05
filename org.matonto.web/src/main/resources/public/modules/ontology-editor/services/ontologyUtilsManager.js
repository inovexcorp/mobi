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

        ontologyUtilsManagerService.$inject = ['$filter', 'ontologyManagerService', 'ontologyStateService',
            'updateRefsService'];

        function ontologyUtilsManagerService($filter, ontologyManagerService, ontologyStateService, updateRefsService) {
            var self = this;
            var om = ontologyManagerService;
            var sm = ontologyStateService;
            var ur = updateRefsService;

            function commonDelete(entityIRI) {
                sm.addDeletedEntity();
                om.removeEntity(sm.ontology, entityIRI);
                ur.remove(sm.ontology, sm.selected['@id']);
                var entityIndex = _.get(sm.listItem.index, entityIRI);
                _.unset(sm.listItem.index, entityIRI);
                _.forOwn(sm.listItem.index, (value, key) => {
                    if (value > entityIndex) {
                        sm.listItem.index[key] = value - 1;
                    }
                });
                sm.unSelectItem();
            }

            self.deleteClass = function() {
                var entityIRI = sm.getActiveEntityIRI();
                var split = $filter('splitIRI')(entityIRI);
                _.remove(_.get(sm.listItem, 'subClasses'), {namespace:split.begin + split.then, localName: split.end});
                _.pull(_.get(sm.listItem, 'classesWithIndividuals'), entityIRI);
                sm.deleteEntityFromHierarchy(_.get(sm.listItem, 'classHierarchy'), entityIRI,
                    _.get(sm.listItem, 'classIndex'));
                commonDelete(entityIRI);
            }

            self.deleteObjectProperty = function() {
                var entityIRI = sm.getActiveEntityIRI();
                var split = $filter('splitIRI')(entityIRI);
                _.remove(_.get(sm.listItem, 'subObjectProperties'), entityIRI);
                sm.deleteEntityFromHierarchy(_.get(sm.listItem, 'objectPropertyHierarchy'), entityIRI,
                    _.get(sm.listItem, 'objectPropertyIndex'));
                commonDelete(entityIRI);
            }

            self.deleteDataTypeProperty = function() {
                var entityIRI = sm.getActiveEntityIRI();
                var split = $filter('splitIRI')(entityIRI);
                _.remove(_.get(sm.listItem, 'subDataProperties'), entityIRI);
                sm.deleteEntityFromHierarchy(_.get(sm.listItem, 'dataPropertyHierarchy'), entityIRI,
                    _.get(sm.listItem, 'dataPropertyIndex'));
                commonDelete(entityIRI);
            }

            self.deleteIndividual = function() {
                var entityIRI = sm.getActiveEntityIRI();
                var split = $filter('splitIRI')(entityIRI);
                _.remove(_.get(sm.listItem, 'individuals'), entityIRI);
                commonDelete(entityIRI);
            }

            self.deleteConcept = function() {
                var entityIRI = sm.getActiveEntityIRI();
                var split = $filter('splitIRI')(entityIRI);
                sm.deleteEntityFromHierarchy(_.get(sm.listItem, 'conceptHierarchy'), entityIRI,
                    _.get(sm.listItem, 'conceptIndex'));
                commonDelete(entityIRI);
            }

            self.deleteConceptScheme = function() {
                self.deleteConcept();
            }
        }
})();

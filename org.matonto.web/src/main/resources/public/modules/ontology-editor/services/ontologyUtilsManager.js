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

        ontologyUtilsManagerService.$inject = ['$filter', 'ontologyManagerService', 'ontologyStateService', 'updateRefsService', 'prefixes', 'utilService'];

        function ontologyUtilsManagerService($filter, ontologyManagerService, ontologyStateService, updateRefsService, prefixes, utilService) {
            var self = this;
            var om = ontologyManagerService;
            var os = ontologyStateService;
            var ur = updateRefsService;
            var util = utilService;

            self.commonDelete = function(entityIRI) {
                om.getEntityUsages(os.listItem.recordId, os.listItem.branchId, os.listItem.commitId, os.selected['@id'], 'construct')
                    .then(statements => {
                        om.addToDeletions(os.listItem.recordId, os.selected);
                        om.removeEntity(os.listItem, entityIRI);
                        _.forEach(statements, statement => om.addToDeletions(os.listItem.recordId, statement));
                        ur.remove(os.listItem.ontology, os.selected['@id']);
                        os.unSelectItem();
                    }, errorMessage => util.createErrorToast(errorMessage));
            }

            self.deleteClass = function() {
                var entityIRI = os.getActiveEntityIRI();
                var split = $filter('splitIRI')(entityIRI);
                _.remove(_.get(os.listItem, 'subClasses'), {namespace:split.begin + split.then, localName: split.end});
                _.pull(_.get(os.listItem, 'classesWithIndividuals'), entityIRI);
                os.deleteEntityFromHierarchy(_.get(os.listItem, 'classHierarchy'), entityIRI, _.get(os.listItem, 'classIndex'));
                self.commonDelete(entityIRI);
            }

            self.deleteObjectProperty = function() {
                var entityIRI = os.getActiveEntityIRI();
                var split = $filter('splitIRI')(entityIRI);
                _.remove(_.get(os.listItem, 'subObjectProperties'), {namespace:split.begin + split.then, localName: split.end});
                os.deleteEntityFromHierarchy(_.get(os.listItem, 'objectPropertyHierarchy'), entityIRI, _.get(os.listItem, 'objectPropertyIndex'));
                self.commonDelete(entityIRI);
            }

            self.deleteDataTypeProperty = function() {
                var entityIRI = os.getActiveEntityIRI();
                var split = $filter('splitIRI')(entityIRI);
                _.remove(_.get(os.listItem, 'subDataProperties'), {namespace:split.begin + split.then, localName: split.end});
                os.deleteEntityFromHierarchy(_.get(os.listItem, 'dataPropertyHierarchy'), entityIRI, _.get(os.listItem, 'dataPropertyIndex'));
                self.commonDelete(entityIRI);
            }

            self.deleteAnnotationProperty = function() {
                var entityIRI = os.getActiveEntityIRI();
                var split = $filter('splitIRI')(entityIRI);
                _.remove(_.get(os.listItem, 'annotations'), {namespace:split.begin + split.then, localName: split.end});
                self.commonDelete(entityIRI);
            }

            self.deleteIndividual = function() {
                var entityIRI = os.getActiveEntityIRI();
                var split = $filter('splitIRI')(entityIRI);
                _.remove(_.get(os.listItem, 'individuals'), entityIRI);
                self.commonDelete(entityIRI);
            }

            self.deleteConcept = function() {
                var entityIRI = os.getActiveEntityIRI();
                var split = $filter('splitIRI')(entityIRI);
                os.deleteEntityFromHierarchy(_.get(os.listItem, 'conceptHierarchy'), entityIRI, _.get(os.listItem, 'conceptIndex'));
                self.commonDelete(entityIRI);
            }

            self.deleteConceptScheme = function() {
                self.deleteConcept();
            }

            self.isBlankNodeString = function(id) {
                return _.isString(id) && _.includes(id, '_:b');
            }

            self.getBlankNodeValue = function(id) {
                var result;
                if (self.isBlankNodeString(id)) {
                    result = _.get(os.listItem.blankNodes, id, id);
                }
                return result;
            }

            self.isLinkable = function(id) {
                return _.has(os.listItem.index, id) && !self.isBlankNodeString(id);
            }

            self.getNameByIRI = function(iri) {
                return om.getEntityName(om.getEntityByRecordId(os.listItem.recordId, iri));
            }

            self.getNameByNode = function(node) {
                return self.getNameByIRI(node.entityIRI);
            }

            self.addLanguageToNewEntity = function(entity, language) {
                if (language) {
                    _.forEach([prefixes.dcterms + 'title', prefixes.dcterms + 'description', prefixes.skos + 'prefLabel'], item => {
                        if (_.get(entity, "['" + item + "'][0]")) {
                            _.set(entity[item][0], '@language', language);
                        }
                    });
                }
            }
        }
})();

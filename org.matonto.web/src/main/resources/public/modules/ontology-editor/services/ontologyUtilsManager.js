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

        ontologyUtilsManagerService.$inject = ['$q', '$filter', 'ontologyManagerService', 'ontologyStateService', 'updateRefsService', 'prefixes', 'utilService', 'responseObj'];

        function ontologyUtilsManagerService($q, $filter, ontologyManagerService, ontologyStateService, updateRefsService, prefixes, utilService, responseObj) {
            var self = this;
            var om = ontologyManagerService;
            var os = ontologyStateService;
            var ur = updateRefsService;
            var util = utilService;
            var ro = responseObj;

            self.commonDelete = function(entityIRI) {
                om.getEntityUsages(os.listItem.recordId, os.listItem.branchId, os.listItem.commitId, entityIRI, 'construct')
                    .then(statements => {
                        os.addToDeletions(os.listItem.recordId, os.selected);
                        os.removeEntity(os.listItem, entityIRI);
                        _.forEach(statements, statement => os.addToDeletions(os.listItem.recordId, statement));
                        ur.remove(os.listItem.ontology, entityIRI);
                        os.unSelectItem();
                        self.saveCurrentChanges();
                    }, util.createErrorToast);
            }

            self.deleteClass = function() {
                var entityIRI = os.getActiveEntityIRI();
                var split = $filter('splitIRI')(entityIRI);
                _.remove(os.listItem.subClasses, {namespace:split.begin + split.then, localName: split.end});
                _.pull(os.listItem.classesWithIndividuals, entityIRI);
                os.deleteEntityFromHierarchy(os.listItem.classHierarchy, entityIRI, os.listItem.classIndex, os.listItem.flatClassHierarchy);
                self.commonDelete(entityIRI);
            }

            self.deleteObjectProperty = function() {
                var entityIRI = os.getActiveEntityIRI();
                var split = $filter('splitIRI')(entityIRI);
                _.remove(os.listItem.subObjectProperties, {namespace:split.begin + split.then, localName: split.end});
                os.deleteEntityFromHierarchy(os.listItem.objectPropertyHierarchy, entityIRI, os.listItem.objectPropertyIndex, os.listItem.flatObjectPropertyHierarchy);
                self.commonDelete(entityIRI);
            }

            self.deleteDataTypeProperty = function() {
                var entityIRI = os.getActiveEntityIRI();
                var split = $filter('splitIRI')(entityIRI);
                _.remove(os.listItem.subDataProperties, {namespace:split.begin + split.then, localName: split.end});
                os.deleteEntityFromHierarchy(os.listItem.dataPropertyHierarchy, entityIRI, os.listItem.dataPropertyIndex, os.listItem.flatDataPropertyHierarchy);
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
                _.remove(_.get(os.listItem, 'individuals'), entityIRI);
                self.commonDelete(entityIRI);
            }

            self.deleteConcept = function() {
                var entityIRI = os.getActiveEntityIRI();
                os.deleteEntityFromHierarchy(os.listItem.conceptHierarchy, entityIRI, os.listItem.conceptIndex, os.listItem.flatConceptHierarchy);
                self.commonDelete(entityIRI);
            }

            self.deleteConceptScheme = function() {
                self.deleteConcept();
            }

            self.getBlankNodeValue = function(id) {
                var result;
                if (om.isBlankNodeId(id)) {
                    result = _.get(os.listItem.blankNodes, id, id);
                }
                return result;
            }

            self.isLinkable = function(id) {
                return _.has(os.listItem.index, id) && !om.isBlankNodeId(id);
            }

            self.getNameByNode = function(node) {
                return self.getLabelForIRI(node.entityIRI);
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

            self.saveCurrentChanges = function() {
                os.saveChanges(os.listItem.recordId, {additions: os.listItem.additions, deletions: os.listItem.deletions})
                    .then(() => os.afterSave(), $q.reject)
                    .then(() => {
                        var entityIRI = os.getActiveEntityIRI();
                        var activeKey = os.getActiveKey();
                        if (activeKey !== 'project' && activeKey !== 'individuals' && entityIRI) {
                            os.setEntityUsages(entityIRI);
                        }
                        os.listItem.isSaved = os.isCommittable(os.listItem.recordId);
                    }, errorMessage => {
                        util.createErrorToast(errorMessage);
                        os.listItem.isSaved = false;
                    });
            }

            self.updateLabel = function() {
                if (_.has(os.listItem.index, os.selected['@id'])) {
                    os.listItem.index[os.selected['@id']].label = om.getEntityName(os.selected, os.listItem.type);
                }
            }

            self.getLabelForIRI = function(iri) {
                return os.getEntityNameByIndex(iri, os.listItem);
            }

            self.getDropDownText = function(item) {
                return os.getEntityNameByIndex(ro.getItemIri(item), os.listItem);
            }
        }
})();

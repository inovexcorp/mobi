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

            self.commonDelete = function(entityIRI, updateEverythingTree = false) {
                om.getEntityUsages(os.listItem.ontologyRecord.recordId, os.listItem.ontologyRecord.branchId, os.listItem.ontologyRecord.commitId, entityIRI, 'construct')
                    .then(statements => {
                        var removedEntities = os.removeEntity(os.listItem, entityIRI);
                        _.forEach(removedEntities, entity => os.addToDeletions(os.listItem.ontologyRecord.recordId, entity));
                        _.forEach(statements, statement => os.addToDeletions(os.listItem.ontologyRecord.recordId, statement));
                        ur.remove(os.listItem.ontology, entityIRI);
                        os.unSelectItem();
                        self.saveCurrentChanges();
                        if (updateEverythingTree) {
                            os.listItem.flatEverythingTree = os.createFlatEverythingTree(os.getOntologiesArray(), os.listItem);
                        }
                    }, util.createErrorToast);
            }

            self.deleteClass = function() {
                var entityIRI = os.getActiveEntityIRI();
                var split = $filter('splitIRI')(entityIRI);
                _.remove(os.listItem.subClasses, {namespace:split.begin + split.then, localName: split.end});
                _.pull(os.listItem.classesWithIndividuals, entityIRI);
                os.deleteEntityFromHierarchy(os.listItem.classHierarchy, entityIRI, os.listItem.classIndex);
                os.listItem.flatClassHierarchy = os.flattenHierarchy(os.listItem.classHierarchy, os.listItem.ontologyRecord.recordId);
                delete os.listItem.classesAndIndividuals[entityIRI];
                os.listItem.classesWithIndividuals = _.keys(os.listItem.classesAndIndividuals);
                os.listItem.individualsParentPath = os.getIndividualsParentPath(os.listItem);
                os.listItem.flatIndividualsHierarchy = os.createFlatIndividualTree(os.listItem);
                self.commonDelete(entityIRI, true);
            }

            self.deleteObjectProperty = function() {
                var entityIRI = os.getActiveEntityIRI();
                var split = $filter('splitIRI')(entityIRI);
                _.remove(os.listItem.subObjectProperties, {namespace:split.begin + split.then, localName: split.end});
                os.deleteEntityFromHierarchy(os.listItem.objectPropertyHierarchy, entityIRI, os.listItem.objectPropertyIndex);
                os.listItem.flatObjectPropertyHierarchy = os.flattenHierarchy(os.listItem.objectPropertyHierarchy, os.listItem.ontologyRecord.recordId);
                self.commonDelete(entityIRI, true);
            }

            self.deleteDataTypeProperty = function() {
                var entityIRI = os.getActiveEntityIRI();
                var split = $filter('splitIRI')(entityIRI);
                _.remove(os.listItem.subDataProperties, {namespace:split.begin + split.then, localName: split.end});
                os.deleteEntityFromHierarchy(os.listItem.dataPropertyHierarchy, entityIRI, os.listItem.dataPropertyIndex);
                os.listItem.flatDataPropertyHierarchy = os.flattenHierarchy(os.listItem.dataPropertyHierarchy, os.listItem.ontologyRecord.recordId);
                self.commonDelete(entityIRI, true);
            }

            self.deleteAnnotationProperty = function() {
                var entityIRI = os.getActiveEntityIRI();
                var split = $filter('splitIRI')(entityIRI);
                _.remove(_.get(os.listItem, 'annotations'), {namespace:split.begin + split.then, localName: split.end});
                os.deleteEntityFromHierarchy(os.listItem.annotationPropertyHierarchy, entityIRI, os.listItem.annotationPropertyIndex);
                os.listItem.flatAnnotationPropertyHierarchy = os.flattenHierarchy(os.listItem.annotationPropertyHierarchy, os.listItem.ontologyRecord.recordId);
                self.commonDelete(entityIRI);
            }

            self.deleteIndividual = function() {
                var entityIRI = os.getActiveEntityIRI();
                var split = $filter('splitIRI')(entityIRI);
                _.remove(_.get(os.listItem, 'individuals'), {namespace:split.begin + split.then, localName: split.end});
                var indivTypes = os.listItem.selected['@type'];
                var indivAndClasses = _.get(os.listItem, 'classesAndIndividuals');

                _.forEach(indivTypes, type => {
                    if (type !== prefixes.owl + 'NamedIndividual') {
                        var parentAndIndivs = indivAndClasses[type];
                        if (parentAndIndivs.length) {
                            _.remove(parentAndIndivs, item => item === entityIRI);
                            if (!parentAndIndivs.length) {
                                delete os.listItem.classesAndIndividuals[type];
                            }
                        }
                    }
                });

                os.listItem.classesWithIndividuals = _.keys(os.listItem.classesAndIndividuals);
                os.listItem.individualsParentPath = os.getIndividualsParentPath(os.listItem);
                os.listItem.flatIndividualsHierarchy = os.createFlatIndividualTree(os.listItem);
                self.commonDelete(entityIRI);
            }

            self.deleteConcept = function() {
                var entityIRI = os.getActiveEntityIRI();
                os.deleteEntityFromHierarchy(os.listItem.conceptHierarchy, entityIRI, os.listItem.conceptIndex);
                os.listItem.flatConceptHierarchy = os.flattenHierarchy(os.listItem.conceptHierarchy, os.listItem.ontologyRecord.recordId);
                os.deleteEntityFromHierarchy(os.listItem.conceptSchemeHierarchy, entityIRI, os.listItem.conceptSchemeIndex);
                os.listItem.flatConceptSchemeHierarchy = os.flattenHierarchy(os.listItem.conceptSchemeHierarchy, os.listItem.ontologyRecord.recordId);
                self.commonDelete(entityIRI);
            }

            self.deleteConceptScheme = function() {
                var entityIRI = os.getActiveEntityIRI();
                _.remove(os.listItem.conceptSchemeHierarchy, {entityIRI});
                ur.remove(os.listItem.conceptSchemeIndex, entityIRI);
                os.listItem.flatConceptSchemeHierarchy = os.flattenHierarchy(os.listItem.conceptSchemeHierarchy, os.listItem.ontologyRecord.recordId);
                self.commonDelete(entityIRI);
            }

            self.getBlankNodeValue = function(id) {
                var result;
                if (om.isBlankNodeId(id)) {
                    if (_.get(os.listItem.selected, 'matonto.imported')) {
                        var ontologyObj = _.find(os.listItem.importedOntologies, {ontologyId: os.listItem.selected.matonto.importedIRI});
                        result = _.get(ontologyObj.blankNodes, id, id)
                    } else {
                        result = _.get(os.listItem.blankNodes, id, id);
                    }
                }
                return result;
            }

            self.isLinkable = function(id) {
                return !!os.getEntityByRecordId(os.listItem.ontologyRecord.recordId, id) && !om.isBlankNodeId(id);
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
                os.saveChanges(os.listItem.ontologyRecord.recordId, {additions: os.listItem.additions, deletions: os.listItem.deletions})
                    .then(() => os.afterSave(), $q.reject)
                    .then(() => {
                        var entityIRI = os.getActiveEntityIRI();
                        var activeKey = os.getActiveKey();
                        if (activeKey !== 'project' && activeKey !== 'individuals' && entityIRI) {
                            os.setEntityUsages(entityIRI);
                        }
                        os.listItem.isSaved = os.isCommittable(os.listItem.ontologyRecord.recordId);
                    }, errorMessage => {
                        util.createErrorToast(errorMessage);
                        os.listItem.isSaved = false;
                    });
            }

            self.updateLabel = function() {
                var newLabel = om.getEntityName(os.listItem.selected, os.listItem.ontologyRecord.type);
                if (_.has(os.listItem.index, "['" + os.listItem.selected['@id'] + "'].label") && os.listItem.index[os.listItem.selected['@id']].label !== newLabel) {
                    os.listItem.index[os.listItem.selected['@id']].label = newLabel;
                    if (os.listItem.ontologyRecord.type === 'vocabulary') {
                        os.listItem.flatConceptHierarchy = os.flattenHierarchy(os.listItem.conceptHierarchy, os.listItem.ontologyRecord.recordId);
                    } else if (om.isClass(os.listItem.selected)) {
                        os.listItem.flatClassHierarchy = os.flattenHierarchy(os.listItem.classHierarchy, os.listItem.ontologyRecord.recordId);
                        os.listItem.flatEverythingTree = os.createFlatEverythingTree(os.getOntologiesArray(), os.listItem);
                    } else if (om.isDataTypeProperty(os.listItem.selected)) {
                        os.listItem.flatDataPropertyHierarchy = os.flattenHierarchy(os.listItem.dataPropertyHierarchy, os.listItem.ontologyRecord.recordId);
                        os.listItem.flatEverythingTree = os.createFlatEverythingTree(os.getOntologiesArray(), os.listItem);
                    } else if (om.isObjectProperty(os.listItem.selected)) {
                        os.listItem.flatObjectPropertyHierarchy = os.flattenHierarchy(os.listItem.objectPropertyHierarchy, os.listItem.ontologyRecord.recordId);
                        os.listItem.flatEverythingTree = os.createFlatEverythingTree(os.getOntologiesArray(), os.listItem);
                    } else if (om.isAnnotation(os.listItem.selected)) {
                        os.listItem.flatAnnotationPropertyHierarchy = os.flattenHierarchy(os.listItem.annotationPropertyHierarchy, os.listItem.ontologyRecord.recordId);
                    }
                }
            }

            self.getLabelForIRI = function(iri) {
                return os.getEntityNameByIndex(iri, os.listItem);
            }

            self.getDropDownText = function(item) {
                return os.getEntityNameByIndex(ro.getItemIri(item), os.listItem);
            }

            self.checkIri = function(iri) {
                return _.includes(os.listItem.iriList, iri) && iri !== _.get(os.listItem.selected, '@id');
            }

            self.setSuperClasses = function(iri, classIRIs) {
                _.forEach(classIRIs, classIRI => {
                    os.addEntityToHierarchy(os.listItem.classHierarchy, iri, os.listItem.classIndex, classIRI);
                });
                os.listItem.flatClassHierarchy = os.flattenHierarchy(os.listItem.classHierarchy, os.listItem.ontologyRecord.recordId);
            }

            self.updateflatIndividualsHierarchy = function(classIRIs) {
                var paths = [];
                _.forEach(classIRIs, classIRI => {
                    paths.push(os.getPathsTo(os.listItem.classHierarchy, os.listItem.classIndex, classIRI));
                });
                var flattenedPaths = _.uniq(_.flattenDeep(paths));
                if (flattenedPaths.length) {
                    os.listItem.individualsParentPath = _.concat(os.listItem.individualsParentPath, flattenedPaths);
                    os.listItem.flatIndividualsHierarchy = os.createFlatIndividualTree(os.listItem);
                }
            }

            self.setSuperProperties = function(iri, propertyIRIs, hierarchyKey, indexKey, flatHierarchyKey) {
                _.forEach(propertyIRIs, propertyIRI => {
                    os.addEntityToHierarchy(os.listItem[hierarchyKey], iri, os.listItem[indexKey], propertyIRI);
                });
                os.listItem[flatHierarchyKey] = os.flattenHierarchy(os.listItem[hierarchyKey], os.listItem.ontologyRecord.recordId);
            }
        }
})();

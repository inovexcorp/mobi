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

            /**
             * @ngdoc method
             * @name containsDerivedConcept
             * @methodOf ontologyUtilsManager.service:ontologyUtilsManagerService
             *
             * @description
             * Determines whether the provided array of IRI strings contains a derived skos:Concept or skos:Concept.
             *
             * @param {string[]} arr An array of IRI strings
             * @return {boolean} True if the array contains a dervied skos:Concept or skos:Concept
             */
            self.containsDerivedConcept = function(arr) {
                return !!_.intersection(arr, _.concat(os.listItem.derivedConcepts, [prefixes.skos + 'Concept'])).length;
            }

            self.containsDerivedConceptScheme = function(arr) {
                return !!_.intersection(arr, _.concat(os.listItem.derivedConceptSchemes, [prefixes.skos + 'ConceptScheme'])).length;
            }

            self.addConcept = function(concept) {
                var hierarchy = _.get(os.listItem, 'concepts.hierarchy');
                hierarchy.push({'entityIRI': concept['@id']});
                os.listItem.concepts.flat = os.flattenHierarchy(hierarchy, os.listItem.ontologyRecord.recordId);
            }

            self.addConceptScheme = function(scheme) {
                var hierarchy = _.get(os.listItem, 'conceptSchemes.hierarchy');
                hierarchy.push({'entityIRI': scheme['@id']});
                os.listItem.conceptSchemes.flat = os.flattenHierarchy(hierarchy, os.listItem.ontologyRecord.recordId);
            }

            self.addIndividual = function(individual) {
                // update relevant lists
                var split = $filter('splitIRI')(individual['@id']);
                _.get(os.listItem, 'individuals.iris').push({namespace: split.begin + split.then, localName: split.end});
                var classesWithIndividuals = _.get(os.listItem, 'classesWithIndividuals', []);
                var individualsParentPath = _.get(os.listItem, 'individualsParentPath', []);
                var paths = [];
                var individuals = [];

                _.forEach(individual['@type'], (type) => {
                    var indivArr = [];
                    var existingInds = _.get(os.listItem.classesAndIndividuals, type);
                    var path = os.getPathsTo(_.get(os.listItem, 'classes.hierarchy'), _.get(os.listItem, 'classes.index'), type);

                    indivArr.push(individual['@id']);
                    os.listItem.classesAndIndividuals[type] = existingInds ? _.concat(indivArr, existingInds) : indivArr;
                    individuals.push(type);
                    paths.push(path);
                });

                var uniqueUris =  _.uniq(_.flattenDeep(paths));
                _.set(os.listItem, 'classesWithIndividuals', _.concat(classesWithIndividuals, individuals));
                _.set(os.listItem, 'individualsParentPath', _.concat(individualsParentPath, uniqueUris));
                os.listItem.individuals.flat = os.createFlatIndividualTree(os.listItem);
            }

            self.commonDelete = function(entityIRI, updateEverythingTree = false) {
                return om.getEntityUsages(os.listItem.ontologyRecord.recordId, os.listItem.ontologyRecord.branchId, os.listItem.ontologyRecord.commitId, entityIRI, 'construct')
                    .then(statements => {
                        var removedEntities = os.removeEntity(os.listItem, entityIRI);
                        _.forEach(removedEntities, entity => os.addToDeletions(os.listItem.ontologyRecord.recordId, entity));
                        _.forEach(statements, statement => os.addToDeletions(os.listItem.ontologyRecord.recordId, statement));
                        ur.remove(os.listItem.ontology, entityIRI);
                        os.unSelectItem();
                        if (updateEverythingTree) {
                            os.listItem.flatEverythingTree = os.createFlatEverythingTree(os.getOntologiesArray(), os.listItem);
                        }
                        return self.saveCurrentChanges();
                    }, errorMessage => {
                        util.createErrorToast(errorMessage);
                        return $q.reject();
                    });
            }

            self.deleteClass = function() {
                var entityIRI = os.getActiveEntityIRI();
                var split = $filter('splitIRI')(entityIRI);
                os.removeFromClassIRIs(os.listItem, {namespace:split.begin + split.then, localName: split.end});
                _.pull(os.listItem.classesWithIndividuals, entityIRI);
                os.deleteEntityFromHierarchy(os.listItem.classes.hierarchy, entityIRI, os.listItem.classes.index);
                os.listItem.classes.flat = os.flattenHierarchy(os.listItem.classes.hierarchy, os.listItem.ontologyRecord.recordId);
                delete os.listItem.classesAndIndividuals[entityIRI];
                os.listItem.classesWithIndividuals = _.keys(os.listItem.classesAndIndividuals);
                os.listItem.individualsParentPath = os.getIndividualsParentPath(os.listItem);
                os.listItem.individuals.flat = os.createFlatIndividualTree(os.listItem);
                self.commonDelete(entityIRI, true)
                    .then(() => {
                        os.setVocabularyStuff();
                    });
            }

            self.deleteObjectProperty = function() {
                var entityIRI = os.getActiveEntityIRI();
                var split = $filter('splitIRI')(entityIRI);
                _.remove(os.listItem.objectProperties.iris, {namespace: split.begin + split.then, localName: split.end});
                os.deleteEntityFromHierarchy(os.listItem.objectProperties.hierarchy, entityIRI, os.listItem.objectProperties.index);
                os.listItem.objectProperties.flat = os.flattenHierarchy(os.listItem.objectProperties.hierarchy, os.listItem.ontologyRecord.recordId);
                self.commonDelete(entityIRI, true);
            }

            self.deleteDataTypeProperty = function() {
                var entityIRI = os.getActiveEntityIRI();
                var split = $filter('splitIRI')(entityIRI);
                _.remove(os.listItem.dataProperties.iris, {namespace: split.begin + split.then, localName: split.end});
                os.deleteEntityFromHierarchy(os.listItem.dataProperties.hierarchy, entityIRI, os.listItem.dataProperties.index);
                os.listItem.dataProperties.flat = os.flattenHierarchy(os.listItem.dataProperties.hierarchy, os.listItem.ontologyRecord.recordId);
                self.commonDelete(entityIRI, true);
            }

            self.deleteAnnotationProperty = function() {
                var entityIRI = os.getActiveEntityIRI();
                var split = $filter('splitIRI')(entityIRI);
                _.remove(_.get(os.listItem, 'annotations.iris'), {namespace: split.begin + split.then, localName: split.end});
                os.deleteEntityFromHierarchy(os.listItem.annotations.hierarchy, entityIRI, os.listItem.annotations.index);
                os.listItem.annotations.flat = os.flattenHierarchy(os.listItem.annotations.hierarchy, os.listItem.ontologyRecord.recordId);
                self.commonDelete(entityIRI);
            }

            self.deleteIndividual = function() {
                var entityIRI = os.getActiveEntityIRI();
                removeIndividual(entityIRI);
                if (self.containsDerivedConcept(os.listItem.selected['@type'])) {
                    removeConcept(entityIRI);
                } else if (self.containsDerivedConceptScheme(os.listItem.selected['@type'])) {
                    removeConceptScheme(entityIRI);
                }
                self.commonDelete(entityIRI);
            }

            self.deleteConcept = function() {
                var entityIRI = os.getActiveEntityIRI();
                removeConcept(entityIRI);
                removeIndividual(entityIRI);
                self.commonDelete(entityIRI);
            }

            self.deleteConceptScheme = function() {
                var entityIRI = os.getActiveEntityIRI();
                removeConceptScheme(entityIRI);
                removeIndividual(entityIRI);
                self.commonDelete(entityIRI);
            }

            self.getBlankNodeValue = function(id) {
                var result;
                if (om.isBlankNodeId(id)) {
                    if (_.get(os.listItem.selected, 'mobi.imported')) {
                        var ontologyObj = _.find(os.listItem.importedOntologies, {ontologyId: os.listItem.selected.mobi.importedIRI});
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
                return os.saveChanges(os.listItem.ontologyRecord.recordId, {additions: os.listItem.additions, deletions: os.listItem.deletions})
                    .then(() => os.afterSave(), $q.reject)
                    .then(() => {
                        var entityIRI = os.getActiveEntityIRI();
                        var activeKey = os.getActiveKey();
                        if (activeKey !== 'project' && activeKey !== 'individuals' && entityIRI) {
                            os.setEntityUsages(entityIRI);
                        }
                        os.listItem.isSaved = os.isCommittable(os.listItem.ontologyRecord.recordId);
                        return $q.when();
                    }, errorMessage => {
                        util.createErrorToast(errorMessage);
                        os.listItem.isSaved = false;
                        return $q.reject();
                    });
            }

            self.updateLabel = function() {
                var newLabel = om.getEntityName(os.listItem.selected);
                if (_.has(os.listItem.index, "['" + os.listItem.selected['@id'] + "'].label") && os.listItem.index[os.listItem.selected['@id']].label !== newLabel) {
                    os.listItem.index[os.listItem.selected['@id']].label = newLabel;
                    if (om.isClass(os.listItem.selected)) {
                        os.listItem.classes.flat = os.flattenHierarchy(os.listItem.classes.hierarchy, os.listItem.ontologyRecord.recordId);
                        os.listItem.flatEverythingTree = os.createFlatEverythingTree(os.getOntologiesArray(), os.listItem);
                    } else if (om.isDataTypeProperty(os.listItem.selected)) {
                        os.listItem.dataProperties.flat = os.flattenHierarchy(os.listItem.dataProperties.hierarchy, os.listItem.ontologyRecord.recordId);
                        os.listItem.flatEverythingTree = os.createFlatEverythingTree(os.getOntologiesArray(), os.listItem);
                    } else if (om.isObjectProperty(os.listItem.selected)) {
                        os.listItem.objectProperties.flat = os.flattenHierarchy(os.listItem.objectProperties.hierarchy, os.listItem.ontologyRecord.recordId);
                        os.listItem.flatEverythingTree = os.createFlatEverythingTree(os.getOntologiesArray(), os.listItem);
                    } else if (om.isAnnotation(os.listItem.selected)) {
                        os.listItem.annotations.flat = os.flattenHierarchy(os.listItem.annotations.hierarchy, os.listItem.ontologyRecord.recordId);
                    } else if (om.isConcept(os.listItem.selected, os.listItem.derivedConcepts)) {
                        os.listItem.concepts.flat = os.flattenHierarchy(os.listItem.concepts.hierarchy, os.listItem.ontologyRecord.recordId);
                    } else if (om.isConceptScheme(os.listItem.selected, os.listItem.derivedConceptSchemes)) {
                        os.listItem.conceptSchemes.flat = os.flattenHierarchy(os.listItem.conceptSchemes.hierarchy, os.listItem.ontologyRecord.recordId);
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
                    os.addEntityToHierarchy(os.listItem.classes.hierarchy, iri, os.listItem.classes.index, classIRI);
                });
                os.listItem.classes.flat = os.flattenHierarchy(os.listItem.classes.hierarchy, os.listItem.ontologyRecord.recordId);
            }

            self.updateflatIndividualsHierarchy = function(classIRIs) {
                var paths = [];
                _.forEach(classIRIs, classIRI => {
                    paths.push(os.getPathsTo(os.listItem.classes.hierarchy, os.listItem.classes.index, classIRI));
                });
                var flattenedPaths = _.uniq(_.flattenDeep(paths));
                if (flattenedPaths.length) {
                    os.listItem.individualsParentPath = _.concat(os.listItem.individualsParentPath, flattenedPaths);
                    os.listItem.individuals.flat = os.createFlatIndividualTree(os.listItem);
                }
            }

            self.setSuperProperties = function(iri, propertyIRIs, key) {
                _.forEach(propertyIRIs, propertyIRI => {
                    os.addEntityToHierarchy(os.listItem[key].hierarchy, iri, os.listItem[key].index, propertyIRI);
                });
                os.listItem[key].flat = os.flattenHierarchy(os.listItem[key].hierarchy, os.listItem.ontologyRecord.recordId);
            }

            function removeConcept(entityIRI) {
                os.deleteEntityFromHierarchy(os.listItem.concepts.hierarchy, entityIRI, os.listItem.concepts.index);
                os.listItem.concepts.flat = os.flattenHierarchy(os.listItem.concepts.hierarchy, os.listItem.ontologyRecord.recordId);
                removeConceptScheme(entityIRI);
            }
            function removeConceptScheme(entityIRI) {
                os.deleteEntityFromHierarchy(os.listItem.conceptSchemes.hierarchy, entityIRI, os.listItem.conceptSchemes.index);
                os.listItem.conceptSchemes.flat = os.flattenHierarchy(os.listItem.conceptSchemes.hierarchy, os.listItem.ontologyRecord.recordId);
            }
            function removeIndividual(entityIRI) {
                var split = $filter('splitIRI')(entityIRI);
                _.remove(_.get(os.listItem, 'individuals.iris'), {namespace: split.begin + split.then, localName: split.end});
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
                os.listItem.individuals.flat = os.createFlatIndividualTree(os.listItem);
            }
        }
})();

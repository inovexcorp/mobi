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
        /**
         * @ngdoc overview
         * @name ontologyUtilsManager
         *
         * @description
         * The `ontologyUtilsManager` module only provides the `ontologyUtilsManagerService` service which
         * contains various utility methods used throughout the Ontology Editor.
         */
        .module('ontologyUtilsManager', [])
        /**
         * @ngdoc service
         * @name ontologyUtilsManager.service:ontologyUtilsManagerService
         * @requires ontologyManager.service:ontologyManagerService
         * @requires ontologyState.service:ontologyStateService
         * @requires updateRefs.service:updateRefsService
         * @requires propertyManager.service:propertyManagerService
         * @requires prefixes.service:prefixes
         * @requires util.service:utilService
         *
         * @description
         * `ontologyUtilsManagerService` is a service which contains various utility methods used throughout the Ontology
         * Editor for actions such as deleting specific types of entities and creating displays for the frontend.
         */
        .service('ontologyUtilsManagerService', ontologyUtilsManagerService);

        ontologyUtilsManagerService.$inject = ['$q', 'ontologyManagerService', 'ontologyStateService', 'updateRefsService', 'propertyManagerService', 'prefixes', 'utilService'];

        function ontologyUtilsManagerService($q, ontologyManagerService, ontologyStateService, updateRefsService, propertyManagerService, prefixes, utilService) {
            var self = this;
            var om = ontologyManagerService;
            var os = ontologyStateService;
            var ur = updateRefsService;
            var pm = propertyManagerService;
            var util = utilService;

            var broaderRelations = [
                prefixes.skos + 'broaderTransitive',
                prefixes.skos + 'broader',
                prefixes.skos + 'broadMatch'
            ];
            var narrowerRelations = [
                prefixes.skos + 'narrowerTransitive',
                prefixes.skos + 'narrower',
                prefixes.skos + 'narrowMatch'
            ];
            var conceptToScheme = [
                prefixes.skos + 'inScheme',
                prefixes.skos + 'topConceptOf'
            ];
            var schemeToConcept = [
                prefixes.skos + 'hasTopConcept'
            ];

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
            /**
             * @ngdoc method
             * @name containsDerivedSemanticRelation
             * @methodOf ontologyUtilsManager.service:ontologyUtilsManagerService
             *
             * @description
             * Determines whether the provided array of IRI objects contains a derived skos:semanticRelation or skos:semanticRelation.
             *
             * @param {string[]} arr An array of IRI objects
             * @return {boolean} True if the array contains a dervied skos:semanticRelation or skos:semanticRelation
             */
            self.containsDerivedSemanticRelation = function(arr) {
                return !!_.intersection(arr, _.concat(os.listItem.derivedSemanticRelations, [prefixes.skos + 'semanticRelation'])).length;
            }
            /**
             * @ngdoc method
             * @name containsDerivedConceptScheme
             * @methodOf ontologyUtilsManager.service:ontologyUtilsManagerService
             *
             * @description
             * Determines whether the provided array of IRI objects contains a derived skos:ConceptScheme or skos:ConceptScheme.
             *
             * @param {string[]} arr An array of IRI objects
             * @return {boolean} True if the array contains a dervied skos:ConceptScheme or skos:ConceptScheme
             */
            self.containsDerivedConceptScheme = function(arr) {
                return !!_.intersection(arr, _.concat(os.listItem.derivedConceptSchemes, [prefixes.skos + 'ConceptScheme'])).length;
            }
            /**
             * @ngdoc method
             * @name containsDerivedConceptScheme
             * @methodOf ontologyUtilsManager.service:ontologyUtilsManagerService
             *
             * @description
             * Updates the appropriate vocabulary hierarchies when a relationship is added to a skos:Concept or
             * skos:ConceptScheme and the entity is not already in the appropriate location.
             *
             * @param {string} relationshipIRI The IRI of the property added to the selected entity
             * @param {Object[]} values The JSON-LD of the values of the property that were added
             */
            self.updateVocabularyHierarchies = function(relationshipIRI, values) {
                if (isVocabPropAndEntity(relationshipIRI, broaderRelations, self.containsDerivedConcept)) {
                    commonAddToVocabHierarchy(relationshipIRI, values, os.listItem.selected['@id'], undefined, broaderRelations, narrowerRelations, 'concepts', self.containsDerivedConcept);
                } else if (isVocabPropAndEntity(relationshipIRI, narrowerRelations, self.containsDerivedConcept)) {
                    commonAddToVocabHierarchy(relationshipIRI, values, undefined, os.listItem.selected['@id'], narrowerRelations, broaderRelations, 'concepts', self.containsDerivedConcept);
                } else if (isVocabPropAndEntity(relationshipIRI, conceptToScheme, self.containsDerivedConcept)) {
                    commonAddToVocabHierarchy(relationshipIRI, values, os.listItem.selected['@id'], undefined, conceptToScheme, schemeToConcept, 'conceptSchemes', self.containsDerivedConceptScheme)
                } else if (isVocabPropAndEntity(relationshipIRI, schemeToConcept, self.containsDerivedConceptScheme)) {
                    commonAddToVocabHierarchy(relationshipIRI, values, undefined, os.listItem.selected['@id'], schemeToConcept, conceptToScheme, 'conceptSchemes', self.containsDerivedConcept)
                }
            }
            /**
             * @ngdoc method
             * @name containsDerivedConceptScheme
             * @methodOf ontologyUtilsManager.service:ontologyUtilsManagerService
             *
             * @description
             * Updates the appropriate vocabulary hierarchies when a relationship is removed from a skos:Concept or
             * skos:ConceptScheme and the entity is not already in the appropriate location.
             *
             * @param {string} relationshipIRI The IRI of the property removed from the selected entity
             * @param {Object} axiomObject The JSON-LD of the value that was removed
             */
            self.removeFromVocabularyHierarchies = function(relationshipIRI, axiomObject) {
                var targetEntity = os.getEntityByRecordId(os.listItem.ontologyRecord.recordId, axiomObject['@id'], os.listItem);
                if (isVocabPropAndEntity(relationshipIRI, broaderRelations, self.containsDerivedConcept) && shouldUpdateVocabHierarchy(targetEntity, broaderRelations, narrowerRelations, relationshipIRI, self.containsDerivedConcept)) {
                    deleteFromConceptHierarchy(os.listItem.selected['@id'], targetEntity['@id']);
                } else if (isVocabPropAndEntity(relationshipIRI, narrowerRelations, self.containsDerivedConcept) && shouldUpdateVocabHierarchy(targetEntity, narrowerRelations, broaderRelations, relationshipIRI, self.containsDerivedConcept)) {
                    deleteFromConceptHierarchy(targetEntity['@id'], os.listItem.selected['@id']);
                } else if (isVocabPropAndEntity(relationshipIRI, conceptToScheme, self.containsDerivedConcept) && shouldUpdateVocabHierarchy(targetEntity, conceptToScheme, schemeToConcept, relationshipIRI, self.containsDerivedConceptScheme)) {
                    deleteFromSchemeHierarchy(os.listItem.selected['@id'], targetEntity['@id']);
                } else if (isVocabPropAndEntity(relationshipIRI, schemeToConcept, self.containsDerivedConceptScheme) && shouldUpdateVocabHierarchy(targetEntity, schemeToConcept, conceptToScheme, relationshipIRI, self.containsDerivedConcept)) {
                    deleteFromSchemeHierarchy(targetEntity['@id'], os.listItem.selected['@id']);
                }
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
                _.get(os.listItem, 'individuals.iris')[individual['@id']] = os.listItem.ontologyId;
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
                os.removeFromClassIRIs(os.listItem, entityIRI);
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
                var types = os.listItem.selected['@type'];
                delete os.listItem.objectProperties.iris[entityIRI];
                os.deleteEntityFromHierarchy(os.listItem.objectProperties.hierarchy, entityIRI, os.listItem.objectProperties.index);
                os.listItem.objectProperties.flat = os.flattenHierarchy(os.listItem.objectProperties.hierarchy, os.listItem.ontologyRecord.recordId);
                self.commonDelete(entityIRI, true)
                    .then(() => {
                        os.setVocabularyStuff();
                    });
            }

            self.deleteDataTypeProperty = function() {
                var entityIRI = os.getActiveEntityIRI();
                delete os.listItem.dataProperties.iris[entityIRI];
                os.deleteEntityFromHierarchy(os.listItem.dataProperties.hierarchy, entityIRI, os.listItem.dataProperties.index);
                os.listItem.dataProperties.flat = os.flattenHierarchy(os.listItem.dataProperties.hierarchy, os.listItem.ontologyRecord.recordId);
                self.commonDelete(entityIRI, true);
            }

            self.deleteAnnotationProperty = function() {
                var entityIRI = os.getActiveEntityIRI();
                delete _.get(os.listItem, 'annotations.iris')[entityIRI];
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
                        os.listItem.isSaved = os.isCommittable(os.listItem);
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

            self.getDropDownText = function(iri) {
                return os.getEntityNameByIndex(iri, os.listItem);
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

            self.getSelectList = function(list, searchText, getName = self.getLabelForIRI) {
                var array = [];
                var mapped = _.map(list, item => ({
                    item,
                    name: getName(item)
                }));
                var sorted = _.sortBy(mapped, item => _.trim(item.name.toUpperCase()));
                _.forEach(sorted, item => {
                    if (array.length == 100) {
                        return;
                    } else if (_.includes(item.name.toUpperCase(), searchText.toUpperCase())) {
                        array.push(item.item);
                    }
                });
                return array;
            }

            /**
             * @ngdoc method
             * @name getRemovePropOverlayMessage
             * @methodOf ontologyUtilsManager.service:ontologyUtilsManagerService
             *
             * @description
             * Creates an HTML string of the body of a {@link confirmModal.directive:confirmModal} for confirming the
             * deletion of the specified property value on the current
             * {@link ontologyState.service:ontologyStateService selected entity}.
             *
             * @param {string} key The IRI of a property on the current entity
             * @param {number} index The index of the specific property value being deleted
             * @return {string} A string with HTML for the body of a `confirmModal`
             */
            self.getRemovePropOverlayMessage = function(key, index) {
                return '<p>Are you sure you want to remove:<br><strong>' + key + '</strong></p><p>with value:<br><strong>' + self.getPropValueDisplay(key, index) + '</strong></p><p>from:<br><strong>' + os.listItem.selected['@id'] + '</strong>?</p>';
            }
            /**
             * @ngdoc method
             * @name getPropValueDisplay
             * @methodOf ontologyUtilsManager.service:ontologyUtilsManagerService
             *
             * @description
             * Creates a display of the specified property value on the current
             * {@link ontologyState.service:ontologyStateService selected entity} based on whether it is a
             * data property value, object property value, or blank node.
             *
             * @param {string} key The IRI of a property on the current entity
             * @param {number} index The index of a specific property value
             * @return {string} A string a display of the property value
             */
            self.getPropValueDisplay = function(key, index) {
                return _.get(os.listItem.selected[key], '[' + index + ']["@value"]')
                    || _.truncate(self.getBlankNodeValue(_.get(os.listItem.selected[key], '[' + index + ']["@id"]')), {length: 150})
                    || _.get(os.listItem.selected[key], '[' + index + ']["@id"]');
            }
            /**
             * @ngdoc method
             * @name removeProperty
             * @methodOf ontologyUtilsManager.service:ontologyUtilsManagerService
             *
             * @description
             * Removes the specified property value on the current
             * {@link ontologyState.service:ontologyStateService selected entity}, updating the InProgressCommit,
             * everything hierarchy, and property hierarchy.
             *
             * @param {string} key The IRI of a property on the current entity
             * @param {number} index The index of a specific property value
             * @return {Promise} A Promise that resolves with the JSON-LD value object that was removed
             */
            self.removeProperty = function(key, index) {
                var axiomObject = os.listItem.selected[key][index];
                var json = {
                    '@id': os.listItem.selected['@id'],
                    [key]: [angular.copy(axiomObject)]
                };
                os.addToDeletions(os.listItem.ontologyRecord.recordId, json);
                if (om.isBlankNodeId(axiomObject['@id'])) {
                    var removed = os.removeEntity(os.listItem, axiomObject['@id']);
                    _.forEach(removed, entity => os.addToDeletions(os.listItem.ontologyRecord.recordId, entity));
                }
                pm.remove(os.listItem.selected, key, index);
                if (prefixes.rdfs + 'domain' === key && !om.isBlankNodeId(axiomObject['@id'])) {
                    os.listItem.flatEverythingTree = os.createFlatEverythingTree(os.getOntologiesArray(), os.listItem);
                } else if (prefixes.rdfs + 'range' === key) {
                    os.updatePropertyIcon(os.listItem.selected);
                }
                return self.saveCurrentChanges()
                    .then(() => {
                        self.updateLabel();
                        return axiomObject;
                    });
            }

            function containsProperty(entity, properties, value) {
                return _.some(properties, property => _.some(_.get(entity, property), {'@id': value}));
            }
            function isVocabPropAndEntity(relationshipIRI, relationshipArray, validateSubjectType) {
                return _.includes(relationshipArray, relationshipIRI) && validateSubjectType(os.listItem.selected['@type']);
            }
            function shouldUpdateVocabHierarchy(targetEntity, targetArray, otherArray, relationshipIRI, validateTargetType) {
                return !containsProperty(os.listItem.selected, _.without(targetArray, relationshipIRI), targetEntity['@id'])
                    && !containsProperty(targetEntity, otherArray, os.listItem.selected['@id'])
                    && validateTargetType(targetEntity['@type']);
            }
            function commonAddToVocabHierarchy(relationshipIRI, values, entityIRI, parentIRI, targetArray, otherArray, key, validateTargetType) {
                var update = false;
                _.forEach(values, value => {
                    var targetEntity = os.getEntityByRecordId(os.listItem.ontologyRecord.recordId, value['@id'], os.listItem);
                    if (shouldUpdateVocabHierarchy(targetEntity, targetArray, otherArray, relationshipIRI, validateTargetType)) {
                        os.addEntityToHierarchy(os.listItem[key].hierarchy, entityIRI || targetEntity['@id'], os.listItem[key].index, parentIRI || targetEntity['@id']);
                        update = true;
                    }
                });
                if (update) {
                    os.listItem[key].flat = os.flattenHierarchy(os.listItem[key].hierarchy, os.listItem.ontologyRecord.recordId);
                }
            }
            function deleteFromConceptHierarchy(entityIRI, parentIRI) {
                os.deleteEntityFromParentInHierarchy(os.listItem.concepts.hierarchy, entityIRI, parentIRI, os.listItem.concepts.index);
                commonDeleteFromVocabHierarchy('concepts');
            }
            function deleteFromSchemeHierarchy(entityIRI, parentIRI) {
                os.deleteEntityFromParentInHierarchy(os.listItem.conceptSchemes.hierarchy, entityIRI, parentIRI, os.listItem.conceptSchemes.index);
                _.remove(os.listItem.conceptSchemes.hierarchy, {entityIRI});
                if (_.get(os.listItem, 'editorTabStates.schemes.entityIRI') === entityIRI) {
                    _.unset(os.listItem, 'editorTabStates.schemes.entityIRI');
                }
                commonDeleteFromVocabHierarchy('conceptSchemes');
            }
            function commonDeleteFromVocabHierarchy(key) {
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
                delete _.get(os.listItem, 'individuals.iris')[entityIRI];
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

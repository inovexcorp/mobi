/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
import * as angular from 'angular';
import {
    get,
    pull,
    forEach,
    concat,
    intersection,
    set,
    uniq,
    flattenDeep,
    find,
    has,
    includes,
    map,
    trim,
    sortBy,
    truncate,
    some,
    without,
    unset
} from 'lodash';

ontologyUtilsManagerService.$inject = ['$q', 'ontologyManagerService', 'ontologyStateService', 'updateRefsService', 'propertyManagerService', 'prefixes', 'utilService'];

/**
 * @ngdoc service
 * @name ontology-editor.service:ontologyUtilsManagerService
 * @requires shared.service:ontologyManagerService
 * @requires shared.service:ontologyStateService
 * @requires shared.service:updateRefsService
 * @requires shared.service:propertyManagerService
 * @requires shared.service:prefixes
 * @requires shared.service:utilService
 *
 * @description
 * `ontologyUtilsManagerService` is a service which contains various utility methods used throughout the Ontology
 * Editor for actions such as deleting specific types of entities and creating displays for the frontend.
 */
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
     * @methodOf ontology-editor.service:ontologyUtilsManagerService
     *
     * @description
     * Determines whether the provided array of IRI strings contains a derived skos:Concept or skos:Concept.
     *
     * @param {string[]} arr An array of IRI strings
     * @return {boolean} True if the array contains a dervied skos:Concept or skos:Concept
     */
    self.containsDerivedConcept = function(arr) {
        return !!intersection(arr, concat(os.listItem.derivedConcepts, [prefixes.skos + 'Concept'])).length;
    }
    /**
     * @ngdoc method
     * @name containsDerivedSemanticRelation
     * @methodOf ontology-editor.service:ontologyUtilsManagerService
     *
     * @description
     * Determines whether the provided array of IRI objects contains a derived skos:semanticRelation or skos:semanticRelation.
     *
     * @param {string[]} arr An array of IRI objects
     * @return {boolean} True if the array contains a dervied skos:semanticRelation or skos:semanticRelation
     */
    self.containsDerivedSemanticRelation = function(arr) {
        return !!intersection(arr, concat(os.listItem.derivedSemanticRelations, [prefixes.skos + 'semanticRelation'])).length;
    }
    /**
     * @ngdoc method
     * @name containsDerivedConceptScheme
     * @methodOf ontology-editor.service:ontologyUtilsManagerService
     *
     * @description
     * Determines whether the provided array of IRI objects contains a derived skos:ConceptScheme or skos:ConceptScheme.
     *
     * @param {string[]} arr An array of IRI objects
     * @return {boolean} True if the array contains a dervied skos:ConceptScheme or skos:ConceptScheme
     */
    self.containsDerivedConceptScheme = function(arr) {
        return !!intersection(arr, concat(os.listItem.derivedConceptSchemes, [prefixes.skos + 'ConceptScheme'])).length;
    }
    /**
     * @ngdoc method
     * @name containsDerivedConceptScheme
     * @methodOf ontology-editor.service:ontologyUtilsManagerService
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
     * @methodOf ontology-editor.service:ontologyUtilsManagerService
     *
     * @description
     * Updates the appropriate vocabulary hierarchies when a relationship is removed from a skos:Concept or
     * skos:ConceptScheme and the entity is not already in the appropriate location.
     *
     * @param {string} relationshipIRI The IRI of the property removed from the selected entity
     * @param {Object} axiomObject The JSON-LD of the value that was removed
     */
    self.removeFromVocabularyHierarchies = function(relationshipIRI, axiomObject) {
        os.getEntityNoBlankNodes(axiomObject['@id'], os.listItem).then(targetEntity => {
            if (isVocabPropAndEntity(relationshipIRI, broaderRelations, self.containsDerivedConcept) && shouldUpdateVocabHierarchy(targetEntity, broaderRelations, narrowerRelations, relationshipIRI, self.containsDerivedConcept)) {
                deleteFromConceptHierarchy(os.listItem.selected['@id'], targetEntity['@id']);
            } else if (isVocabPropAndEntity(relationshipIRI, narrowerRelations, self.containsDerivedConcept) && shouldUpdateVocabHierarchy(targetEntity, narrowerRelations, broaderRelations, relationshipIRI, self.containsDerivedConcept)) {
                deleteFromConceptHierarchy(targetEntity['@id'], os.listItem.selected['@id']);
            } else if (isVocabPropAndEntity(relationshipIRI, conceptToScheme, self.containsDerivedConcept) && shouldUpdateVocabHierarchy(targetEntity, conceptToScheme, schemeToConcept, relationshipIRI, self.containsDerivedConceptScheme)) {
                deleteFromSchemeHierarchy(os.listItem.selected['@id'], targetEntity['@id']);
            } else if (isVocabPropAndEntity(relationshipIRI, schemeToConcept, self.containsDerivedConceptScheme) && shouldUpdateVocabHierarchy(targetEntity, schemeToConcept, conceptToScheme, relationshipIRI, self.containsDerivedConcept)) {
                deleteFromSchemeHierarchy(targetEntity['@id'], os.listItem.selected['@id']);
            }
        }, error => {
            console.error(error);
        });
    }

    self.addConcept = function(concept) {
        os.listItem.concepts.iris[concept['@id']] = os.listItem.ontologyId;
        os.listItem.concepts.flat = os.flattenHierarchy(os.listItem.concepts);
    }

    self.addConceptScheme = function(scheme) {
        os.listItem.conceptSchemes.iris[scheme['@id']] = os.listItem.ontologyId;
        os.listItem.conceptSchemes.flat = os.flattenHierarchy(os.listItem.conceptSchemes);
    }

    self.addIndividual = function(individual) {
        // update relevant lists
        get(os.listItem, 'individuals.iris')[individual['@id']] = os.listItem.ontologyId;
        var classesWithIndividuals = get(os.listItem, 'classesWithIndividuals', []);
        var individualsParentPath = get(os.listItem, 'individualsParentPath', []);
        var paths = [];
        var individuals = [];

        forEach(individual['@type'], (type) => {
            var indivArr = [];
            var existingInds = get(os.listItem.classesAndIndividuals, type);
            var path = os.getPathsTo(os.listItem.classes, type);

            indivArr.push(individual['@id']);
            os.listItem.classesAndIndividuals[type] = existingInds ? concat(indivArr, existingInds) : indivArr;
            individuals.push(type);
            paths.push(path);
        });

        var uniqueUris =  uniq(flattenDeep(paths));
        set(os.listItem, 'classesWithIndividuals', concat(classesWithIndividuals, individuals));
        set(os.listItem, 'individualsParentPath', concat(individualsParentPath, uniqueUris));
        os.listItem.individuals.flat = os.createFlatIndividualTree(os.listItem);
    }

    self.commonDelete = function(entityIRI, updateEverythingTree = false) {
        return om.getEntityUsages(os.listItem.ontologyRecord.recordId, os.listItem.ontologyRecord.branchId, os.listItem.ontologyRecord.commitId, entityIRI, 'construct')
            .then(statements => {
                var removedEntities = os.removeEntity(os.listItem, entityIRI);
                forEach(removedEntities, entity => os.addToDeletions(os.listItem.ontologyRecord.recordId, entity));
                forEach(statements, statement => os.addToDeletions(os.listItem.ontologyRecord.recordId, statement));
                ur.remove(os.listItem.ontology, entityIRI);
                os.unSelectItem();
                if (updateEverythingTree) {
                    os.listItem.flatEverythingTree = os.createFlatEverythingTree(os.listItem);
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
        os.checkForDomain(entityIRI);
        pull(os.listItem.classesWithIndividuals, entityIRI);
        os.deleteEntityFromHierarchy(os.listItem.classes, entityIRI);
        os.listItem.classes.flat = os.flattenHierarchy(os.listItem.classes);
        delete os.listItem.classesAndIndividuals[entityIRI];
        os.listItem.classesWithIndividuals = Object.keys(os.listItem.classesAndIndividuals);
        os.listItem.individualsParentPath = os.getIndividualsParentPath(os.listItem);
        os.listItem.individuals.flat = os.createFlatIndividualTree(os.listItem);
        self.commonDelete(entityIRI, true)
            .then(() => {
                os.setVocabularyStuff();
            });
    }

    self.deleteObjectProperty = function() {
        var entityIRI = os.getActiveEntityIRI();
        delete os.listItem.objectProperties.iris[entityIRI];
        delete os.listItem.noDomainProperties[entityIRI];
        delete os.listItem.propertyIcons[entityIRI];
        os.deleteProperty(entityIRI);
        os.deleteEntityFromHierarchy(os.listItem.objectProperties, entityIRI);
        os.listItem.objectProperties.flat = os.flattenHierarchy(os.listItem.objectProperties);
        self.commonDelete(entityIRI, true)
            .then(() => {
                os.setVocabularyStuff();
            });
    }

    self.deleteDataTypeProperty = function() {
        var entityIRI = os.getActiveEntityIRI();
        delete os.listItem.dataProperties.iris[entityIRI];
        delete os.listItem.noDomainProperties[entityIRI];
        delete os.listItem.propertyIcons[entityIRI];
        os.deleteProperty(entityIRI);
        os.deleteEntityFromHierarchy(os.listItem.dataProperties, entityIRI);
        os.listItem.dataProperties.flat = os.flattenHierarchy(os.listItem.dataProperties);
        self.commonDelete(entityIRI, true);
    }

    self.deleteAnnotationProperty = function() {
        var entityIRI = os.getActiveEntityIRI();
        delete get(os.listItem, 'annotations.iris')[entityIRI];
        os.deleteEntityFromHierarchy(os.listItem.annotations, entityIRI);
        os.listItem.annotations.flat = os.flattenHierarchy(os.listItem.annotations);
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
    /**
     * @ngdoc method
     * @name getBlankNodeValue
     * @methodOf ontology-editor.service:ontologyUtilsManagerService
     *
     * @description
     * Retrieves the Manchester Syntax value for the provided blank node id if it exists in the blankNodes map of the
     * current `listItem` in {@link shared.service:ontologyStateService}. If the value is not a blank node id, returns
     * undefined. If the Manchester Syntax string is not set, returns the blank node id back.
     *
     * @param {string} id A blank node id
     * @returns {string} The Manchester Syntax string for the provided id if it is a blank node id and exists in the
     * blankNodes map; undefined otherwise 
     */
    self.getBlankNodeValue = function(id) {
        if (om.isBlankNodeId(id)) {
            return get(os.listItem.blankNodes, id, id);
        }
        return;
    }
    /**
     * @ngdoc method
     * @name isLinkable
     * @methodOf ontology-editor.service:ontologyUtilsManagerService
     *
     * @description
     * Determines whether the provided id is "linkable", i.e. that a link could be made to take a user to that entity.
     * Id must be present in the indices of the current `listItem` in {@link shared.service:ontologyStateService} and
     * not be a blank node id.
     *
     * @param {string} id An id from the current ontology
     * @returns {boolean} True if the id exists as an entity and not a blank node; false otherwise
     */
    self.isLinkable = function(id) {
        return !!os.existsInIndices(id, os.listItem) && !om.isBlankNodeId(id);
    }

    self.getNameByNode = function(node) {
        return self.getLabelForIRI(node.entityIRI);
    }

    self.addLanguageToNewEntity = function(entity, language) {
        if (language) {
            forEach([prefixes.dcterms + 'title', prefixes.dcterms + 'description', prefixes.skos + 'prefLabel'], item => {
                if (get(entity, "['" + item + "'][0]")) {
                    set(entity[item][0], '@language', language);
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
        if (has(os.listItem.index, "['" + os.listItem.selected['@id'] + "'].label") && os.listItem.index[os.listItem.selected['@id']].label !== newLabel) {
            os.listItem.index[os.listItem.selected['@id']].label = newLabel;
        }
        if (om.isClass(os.listItem.selected)) {
            os.listItem.classes.flat = os.flattenHierarchy(os.listItem.classes);
            os.listItem.flatEverythingTree = os.createFlatEverythingTree(os.listItem);
        } else if (om.isDataTypeProperty(os.listItem.selected)) {
            os.listItem.dataProperties.flat = os.flattenHierarchy(os.listItem.dataProperties);
            os.listItem.flatEverythingTree = os.createFlatEverythingTree(os.listItem);
        } else if (om.isObjectProperty(os.listItem.selected)) {
            os.listItem.objectProperties.flat = os.flattenHierarchy(os.listItem.objectProperties);
            os.listItem.flatEverythingTree = os.createFlatEverythingTree(os.listItem);
        } else if (om.isAnnotation(os.listItem.selected)) {
            os.listItem.annotations.flat = os.flattenHierarchy(os.listItem.annotations);
        } else if (om.isConcept(os.listItem.selected, os.listItem.derivedConcepts)) {
            os.listItem.concepts.flat = os.flattenHierarchy(os.listItem.concepts);
        } else if (om.isConceptScheme(os.listItem.selected, os.listItem.derivedConceptSchemes)) {
            os.listItem.conceptSchemes.flat = os.flattenHierarchy(os.listItem.conceptSchemes);
        }
    }

    self.getLabelForIRI = function(iri) {
        return os.getEntityNameByIndex(iri, os.listItem);
    }

    self.getDropDownText = function(iri) {
        return os.getEntityNameByIndex(iri, os.listItem);
    }

    self.checkIri = function(iri) {
        return includes(os.listItem.iriList, iri) && iri !== get(os.listItem.selected, '@id');
    }

    self.setSuperClasses = function(iri, classIRIs) {
        forEach(classIRIs, classIRI => {
            os.addEntityToHierarchy(os.listItem.classes, iri, classIRI);
        });
        os.listItem.classes.flat = os.flattenHierarchy(os.listItem.classes);
    }

    self.updateflatIndividualsHierarchy = function(classIRIs) {
        var paths = [];
        forEach(classIRIs, classIRI => {
            paths.push(os.getPathsTo(os.listItem.classes, classIRI));
        });
        var flattenedPaths = uniq(flattenDeep(paths));
        if (flattenedPaths.length) {
            os.listItem.individualsParentPath = concat(os.listItem.individualsParentPath, flattenedPaths);
            os.listItem.individuals.flat = os.createFlatIndividualTree(os.listItem);
        }
    }

    self.setSuperProperties = function(iri, propertyIRIs, key) {
        forEach(propertyIRIs, propertyIRI => {
            os.addEntityToHierarchy(os.listItem[key], iri, propertyIRI);
        });
        os.listItem[key].flat = os.flattenHierarchy(os.listItem[key]);
    }

    self.getSelectList = function(list, searchText, getName = self.getLabelForIRI) {
        var array = [];
        var mapped = map(list, item => ({
            item,
            name: getName(item)
        }));
        var sorted = sortBy(mapped, item => trim(item.name.toUpperCase()));
        forEach(sorted, item => {
            if (array.length == 100) {
                return;
            } else if (includes(item.name.toUpperCase(), searchText.toUpperCase())) {
                array.push(item.item);
            }
        });
        return array;
    }

    /**
     * @ngdoc method
     * @name getRemovePropOverlayMessage
     * @methodOf ontology-editor.service:ontologyUtilsManagerService
     *
     * @description
     * Creates an HTML string of the body of a {@link shared.component:confirmModal} for confirming the
     * deletion of the specified property value on the current
     * {@link shared.service:ontologyStateService selected entity}.
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
     * @methodOf ontology-editor.service:ontologyUtilsManagerService
     *
     * @description
     * Creates a display of the specified property value on the current
     * {@link shared.service:ontologyStateService selected entity} based on whether it is a
     * data property value, object property value, or blank node.
     *
     * @param {string} key The IRI of a property on the current entity
     * @param {number} index The index of a specific property value
     * @return {string} A string a display of the property value
     */
    self.getPropValueDisplay = function(key, index) {
        return get(os.listItem.selected[key], '[' + index + ']["@value"]')
            || truncate(self.getBlankNodeValue(get(os.listItem.selected[key], '[' + index + ']["@id"]')), {length: 150})
            || get(os.listItem.selected[key], '[' + index + ']["@id"]');
    }
    /**
     * @ngdoc method
     * @name removeProperty
     * @methodOf ontology-editor.service:ontologyUtilsManagerService
     *
     * @description
     * Removes the specified property value on the current
     * {@link shared.service:ontologyStateService selected entity}, updating the InProgressCommit,
     * everything hierarchy, and property hierarchy.
     *
     * @param {string} key The IRI of a property on the current entity
     * @param {number} index The index of a specific property value
     * @return {Promise} A Promise that resolves with the JSON-LD value object that was removed
     */
    self.removeProperty = function(key, index) {
        // TODO: Remove when full RDF list is removed
        var entityFromFullList = os.getEntityByRecordId(os.listItem.ontologyRecord.recordId, os.listItem.selected['@id']);

        var axiomObject = os.listItem.selected[key][index];
        var json = {
            '@id': os.listItem.selected['@id'],
            [key]: [angular.copy(axiomObject)]
        };
        os.addToDeletions(os.listItem.ontologyRecord.recordId, json);
        if (om.isBlankNodeId(axiomObject['@id'])) {
            var removed = os.removeEntity(os.listItem, axiomObject['@id']);
            forEach(removed, entity => {
                os.listItem.selectedBlankNodes.splice(os.listItem.selectedBlankNodes.findIndex(obj => obj['@id'] === entity['@id']), 1);
                os.addToDeletions(os.listItem.ontologyRecord.recordId, entity)
            });
        }
        pm.remove(os.listItem.selected, key, index);
        
        // TODO: Remove when full RDF list is removed
        pm.remove(entityFromFullList, key, index);

        if (prefixes.rdfs + 'domain' === key && !om.isBlankNodeId(axiomObject['@id'])) {
            os.removePropertyFromEntity(json['@id'], axiomObject['@id']);
            os.listItem.flatEverythingTree = os.createFlatEverythingTree(os.listItem);
        } else if (prefixes.rdfs + 'range' === key) {
            os.updatePropertyIcon(os.listItem.selected);
            // TODO: Remove when full RDF list is removed
            os.updatePropertyIcon(entityFromFullList);

        }
        return self.saveCurrentChanges()
            .then(() => {
                if (om.entityNameProps.includes(key)) {
                    self.updateLabel();
                }
                return axiomObject;
            });
    }

    function containsProperty(entity, properties, value) {
        return some(properties, property => some(get(entity, property), {'@id': value}));
    }
    function isVocabPropAndEntity(relationshipIRI, relationshipArray, validateSubjectType) {
        return includes(relationshipArray, relationshipIRI) && validateSubjectType(os.listItem.selected['@type']);
    }
    function shouldUpdateVocabHierarchy(targetEntity, targetArray, otherArray, relationshipIRI, validateTargetType) {
        return !containsProperty(os.listItem.selected, without(targetArray, relationshipIRI), targetEntity['@id'])
            && !containsProperty(targetEntity, otherArray, os.listItem.selected['@id'])
            && validateTargetType(targetEntity['@type']);
    }
    function commonAddToVocabHierarchy(relationshipIRI, values, entityIRI, parentIRI, targetArray, otherArray, key, validateTargetType) {
        $q.all(map(values, value => os.getEntityNoBlankNodes(value['@id'], os.listItem)))
            .then(entities => {
                var update = false;
                forEach(entities, targetEntity => {
                    if (shouldUpdateVocabHierarchy(targetEntity, targetArray, otherArray, relationshipIRI, validateTargetType)) {
                        os.addEntityToHierarchy(os.listItem[key], entityIRI || targetEntity['@id'], parentIRI || targetEntity['@id']);
                        update = true;
                    }
                });
                if (update) {
                    os.listItem[key].flat = os.flattenHierarchy(os.listItem[key]);
                }
            }, error => {
                console.error(error);
            });
    }
    function deleteFromConceptHierarchy(entityIRI, parentIRI) {
        os.deleteEntityFromParentInHierarchy(os.listItem.concepts, entityIRI, parentIRI);
        os.listItem.concepts.flat = os.flattenHierarchy(os.listItem.concepts);
    }
    function deleteFromSchemeHierarchy(entityIRI, parentIRI) {
        os.deleteEntityFromParentInHierarchy(os.listItem.conceptSchemes, entityIRI, parentIRI);
        if (get(os.listItem, 'editorTabStates.schemes.entityIRI') === entityIRI) {
            unset(os.listItem, 'editorTabStates.schemes.entityIRI');
        }
        os.listItem.conceptSchemes.flat = os.flattenHierarchy(os.listItem.conceptSchemes);
    }
    function removeConcept(entityIRI) {
        delete get(os.listItem, 'concepts.iris')[entityIRI];
        os.deleteEntityFromHierarchy(os.listItem.concepts, entityIRI);
        os.listItem.concepts.flat = os.flattenHierarchy(os.listItem.concepts);
        removeConceptScheme(entityIRI);
    }
    function removeConceptScheme(entityIRI) {
        delete get(os.listItem, 'conceptSchemes.iris')[entityIRI];
        os.deleteEntityFromHierarchy(os.listItem.conceptSchemes, entityIRI);
        os.listItem.conceptSchemes.flat = os.flattenHierarchy(os.listItem.conceptSchemes);
    }
    function removeIndividual(entityIRI) {
        delete get(os.listItem, 'individuals.iris')[entityIRI];
        var indivTypes = os.listItem.selected['@type'];
        var indivAndClasses = get(os.listItem, 'classesAndIndividuals', {});

        forEach(indivTypes, type => {
            if (type !== prefixes.owl + 'NamedIndividual') {
                var parentAndIndivs = get(indivAndClasses, "['" + type + "']", []);
                if (parentAndIndivs.length) {
                    pull(parentAndIndivs, entityIRI);
                    if (!parentAndIndivs.length) {
                        delete os.listItem.classesAndIndividuals[type];
                    }
                }
            }
        });

        os.listItem.classesWithIndividuals = Object.keys(os.listItem.classesAndIndividuals);
        os.listItem.individualsParentPath = os.getIndividualsParentPath(os.listItem);
        os.listItem.individuals.flat = os.createFlatIndividualTree(os.listItem);
    }
}

export default ontologyUtilsManagerService;
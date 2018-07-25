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
         * @name ontologyState
         */
        .module('ontologyState', [])
        /**
         * @ngdoc service
         * @name ontologyState.service:ontologyStateService
         * @requires $timeout
         * @requires $q
         * @requires $filter
         * @requires $document
         * @requires ontologyManager.service:ontologyManagerService
         * @requires updateRefs.service:updateRefsService
         * @requires stateManager.service:stateManagerService
         * @requires util.service:utilService
         * @requires catalogManager.service:catalogManagerService
         * @requires propertyManager.service:propertyManagerService
         * @requires prefixes.service:prefixes
         */
        .service('ontologyStateService', ontologyStateService);

        ontologyStateService.$inject = ['$timeout', '$q', '$filter', '$document', 'ontologyManagerService', 'updateRefsService', 'stateManagerService', 'utilService', 'catalogManagerService', 'propertyManagerService', 'prefixes', 'manchesterConverterService', 'httpService'];

        function ontologyStateService($timeout, $q, $filter, $document, ontologyManagerService, updateRefsService, stateManagerService, utilService, catalogManagerService, propertyManagerService, prefixes, manchesterConverterService, httpService) {
            var self = this;
            var om = ontologyManagerService;
            var pm = propertyManagerService;
            var sm = stateManagerService;
            var cm = catalogManagerService;
            var util = utilService;
            var mc = manchesterConverterService;
            var catalogId = '';

            var ontologyEditorTabStates = {
                project: {
                    entityIRI: '',
                    active: true
                },
                overview: {
                    active: false
                },
                classes: {
                    active: false
                },
                properties: {
                    active: false
                },
                individuals: {
                    active: false
                },
                concepts: {
                    active: false
                },
                schemes: {
                    active: false
                },
                search: {
                    active: false
                },
                savedChanges: {
                    active: false
                },
                commits: {
                    active: false
                }
            };

            var ontologyListItemTemplate = {
                active: true,
                upToDate: true,
                isVocabulary: false,
                editorTabStates: angular.copy(ontologyEditorTabStates),
                ontologyRecord: {
                    title: '',
                    recordId: '',
                    branchId: '',
                    commitId: ''
                },
                ontologyId: '',
                ontology: [],
                importedOntologies: [],
                importedOntologyIds: [],
                userBranch: false,
                createdFromExists: true,
                merge: {
                    active: false,
                    target: undefined,
                    checkbox: false,
                    difference: undefined,
                    conflicts: [],
                    resolutions: {
                        additions: [],
                        deletions: []
                    }
                },
                dataPropertyRange: {},
                derivedConcepts: [],
                derivedConceptSchemes: [],
                derivedSemanticRelations: [],
                classes: {
                    iris: {},
                    hierarchy: [],
                    index: {},
                    flat: []
                },
                dataProperties: {
                    iris: {},
                    hierarchy: [],
                    index: {},
                    flat: []
                },
                objectProperties: {
                    iris: {},
                    hierarchy: [],
                    index: {},
                    flat: []
                },
                annotations: {
                    iris: {},
                    hierarchy: [],
                    index: {},
                    flat: []
                },
                individuals: {
                    iris: {},
                    flat: []
                },
                concepts: {
                    hierarchy: [],
                    index: {},
                    flat: []
                },
                conceptSchemes: {
                    hierarchy: [],
                    index: {},
                    flat: []
                },
                blankNodes: {},
                index: {},
                additions: [],
                deletions: [],
                inProgressCommit: {
                    additions: [],
                    deletions: []
                },
                branches: [],
                classesAndIndividuals: {},
                classesWithIndividuals: [],
                individualsParentPath: [],
                iriList: [],
                selected: {},
                failedImports: []
            };
            _.forEach(pm.defaultDatatypes, iri => addIri(ontologyListItemTemplate.dataPropertyRange, iri));
            _.forEach(pm.defaultAnnotations, iri => addIri(ontologyListItemTemplate.annotations.iris, iri));
            _.forEach(pm.owlAnnotations, iri => addIri(ontologyListItemTemplate.annotations.iris, iri, prefixes.owl.slice(0, -1)));

            var emptyInProgressCommit = {
                additions: [],
                deletions: []
            };

            /**
             * @ngdoc property
             * @name list
             * @propertyOf ontologyState.service:ontologyStateService
             * @type {Object[]}
             *
             * @description
             * `list` holds an array of ontology objects which contain properties associated with the ontology.
             * The structure of the ontology object is based on the templates.
             */
            self.list = [];

            self.listItem = {};

            self.vocabularySpinnerId = 'concepts-spinner';

            /**
             * @ngdoc property
             * @name uploadList
             * @propertyOf ontologyState.service:ontologyStateService
             * @type {Object[]}
             *
             * @description
             * `uploadList` holds an array of upload objects which contain properties about the uploaded files.
             * The structure of the upload object is:
             * {
             *     error: '',
             *     id: '',
             *     promise: {},
             *     title: ''
             * }
             */
            self.uploadList = [];

            /**
             * @ngdoc method
             * @name addErrorToUploadItem
             * @methodOf ontologyState.service:ontologyStateService
             *
             * @description
             * Adds the error message to the list item with the identified id.
             *
             * @param {string} id The id of the upload item.
             * @param {string} error The error message for the upload item.
             */
            self.addErrorToUploadItem = function(id, error) {
                _.set(_.find(self.uploadList, {id}), 'error', error);
            }

            /**
             * @ngdoc method
             * @name initialize
             * @methodOf ontologyState.service:ontologyStateService
             *
             * @description
             * Initializes the `catalogId` variable.
             */
            self.initialize = function() {
                catalogId = _.get(cm.localCatalog, '@id', '');
            }
            /**
             * @ngdoc method
             * @name reset
             * @methodOf ontologyState.service:ontologyStateService
             *
             * @description
             * Resets all state variables.
             */
            self.reset = function() {
                self.list = [];
                self.listItem = {};
                self.showNewTab = false;
                self.showUploadTab = false;
                self.uploadList = [];
            }
            /**
             * @ngdoc method
             * @name getOntology
             * @methodOf ontologyState.service:ontologyStateService
             *
             * @description
             * Retrieves the last visible state of the ontology for the current user in the provided RDF format. If
             * the user has not opened the ontology yet or the branch they were viewing no longer exists, retrieves
             * the latest state of the ontology.
             *
             * @param {string} recordId The record ID of the ontology you want to get from the repository.
             * @param {string} [rdfFormat='jsonld'] The format string to identify the serialization requested.
             * @returns {Promise} A promise containing the record id, branch id, commit id, inProgressCommit,
             * and JSON-LD serialization of the ontology.
             */
            self.getOntology = function(recordId, rdfFormat = 'jsonld') {
                var state = sm.getOntologyStateByRecordId(recordId);
                if (!_.isEmpty(state)) {
                    var record = _.find(state.model, {'@type': ['http://mobi.com/states/ontology-editor/state-record']});
                    var inProgressCommit = emptyInProgressCommit;
                    var branchId = util.getPropertyId(record, prefixes.ontologyState + 'currentBranch');
                    var branch = _.find(state.model, {[prefixes.ontologyState + 'branch']: [{'@id': branchId}]});
                    var commitId = util.getPropertyId(branch, prefixes.ontologyState + 'commit');
                    var upToDate = false;
                    return cm.getRecordBranch(branchId, recordId, catalogId)
                        .then(branch => {
                            upToDate = _.get(branch, "['" + prefixes.catalog + "head'][0]['@id']", '') === commitId;
                            return cm.getInProgressCommit(recordId, catalogId);
                        }, $q.reject)
                        .then(response => {
                            inProgressCommit = response;
                            return om.getOntology(recordId, branchId, commitId, rdfFormat);
                        }, errorMessage => {
                            if (errorMessage === 'InProgressCommit could not be found') {
                                return om.getOntology(recordId, branchId, commitId, rdfFormat);
                            }
                            return $q.reject();
                        })
                        .then(ontology => ({ontology, recordId, branchId, commitId, upToDate, inProgressCommit}), () =>
                            sm.deleteOntologyState(recordId, branchId, commitId)
                                .then(() => self.getLatestOntology(recordId, rdfFormat), $q.reject)
                        );
                }
                return self.getLatestOntology(recordId, rdfFormat);
            }
            /**
             * @ngdoc method
             * @name getLatestOntology
             * @methodOf ontologyState.service:ontologyStateService
             *
             * @description
             * Retrieves the latest state of an ontology, being the head commit of the master branch, and returns
             * a promise containing the ontology id, record id, branch id, commit id, inProgressCommit, and
             * serialized ontology.
             *
             * @param {string} recordId The record ID of the ontology you want to get from the repository.
             * @param {string} rdfFormat The format string to identify the serialization requested.
             * @return {Promise} A promise containing the ontology id, record id, branch id, commit id,
             *                    inProgressCommit, and JSON-LD serialization of the ontology.
             */
            self.getLatestOntology = function(recordId, rdfFormat = 'jsonld') {
                var branchId, commitId;
                return cm.getRecordMasterBranch(recordId, catalogId)
                    .then(masterBranch => {
                        branchId = _.get(masterBranch, '@id', '');
                        commitId = _.get(masterBranch, "['" + prefixes.catalog + "head'][0]['@id']", '');
                        return sm.createOntologyState(recordId, branchId, commitId);
                    }, $q.reject)
                    .then(() => om.getOntology(recordId, branchId, commitId, rdfFormat), $q.reject)
                    .then(ontology => {return {ontology, recordId, branchId, commitId, upToDate: true, inProgressCommit: emptyInProgressCommit}}, $q.reject);
            }
            /**
             * @ngdoc method
             * @name createOntology
             * @methodOf ontologyState.service:ontologyStateService
             *
             * @description
             * Uploads the provided JSON-LD as a new ontology and creates a new list item for the new ontology.
             * Returns a promise with the entityIRI, recordId, branchId, and commitId for the state of the newly
             * created ontology.
             *
             * @param {string} ontologyJson The JSON-LD representing the ontology.
             * @param {string} title The title for the OntologyRecord.
             * @param {string} description The description for the OntologyRecord.
             * @param {string} keywords The array of keywords for the OntologyRecord.
             * @returns {Promise} A promise with the entityIRI, recordId, branchId, and commitId for the state of the newly created
             * ontology.
             */
            self.createOntology = function(ontologyJson, title, description, keywords) {
                var listItem;
                return om.uploadJson(ontologyJson, title, description, keywords)
                    .then(data => {
                        listItem = setupListItem(data.ontologyId, data.recordId, data.branchId, data.commitId, [ontologyJson], emptyInProgressCommit, true, title);
                        return cm.getRecordBranch(data.branchId, data.recordId, catalogId);
                    }, $q.reject)
                    .then(branch => {
                        listItem.branches = [branch];
                        self.list.push(listItem);
                        self.listItem = listItem;
                        self.setSelected(self.getActiveEntityIRI(), false);
                        return {
                            entityIRI: ontologyJson['@id'],
                            recordId: listItem.ontologyRecord.recordId,
                            branchId: listItem.ontologyRecord.branchId,
                            commitId: listItem.ontologyRecord.commitId
                        };
                    }, $q.reject);
            }
            /**
             * @ngdoc method
             * @name uploadChanges
             * @methodOf ontologyState.service:ontologyStateService
             *
             * @description
             * Uploads the provided file as an ontology and uses it as a basis for updating the existing ontology .
             *
             * @param {File} file The updated ontology file.
             * @param {string} the ontology record ID.
             * @param {string} the ontology branch ID.
             * @param {string} the ontology commit ID.
             */
            self.uploadChanges = function(file, recordId, branchId, commitId) {
                return om.uploadChangesFile(file, recordId, branchId, commitId)
                    .then(() => cm.getInProgressCommit(recordId, catalogId), $q.reject)
                    .then(commit => {
                        var listItem = self.getListItemByRecordId(recordId);
                        return self.updateOntology(recordId, branchId, commitId, listItem.upToDate, commit);
                    }, $q.reject);
            }
            /**
             * @ngdoc method
             * @name updateOntology
             * @methodOf ontologyState.service:ontologyStateService
             *
             * @description
             * Used to update an ontology that is already open within the Ontology Editor. It will replace the existing
             * listItem with a new listItem consisting of the data associated with the record ID, branch ID, and commit
             * ID provided. Returns a promise.
             *
             * @param {string} recordId The record ID associated with the requested ontology.
             * @param {string} branchId The branch ID associated with the requested ontology.
             * @param {string} commitId The commit ID associated with the requested ontology.
             * @param {boolean} [upToDate=true] The flag indicating whether the ontology is upToDate or not.
             * @param {boolean} [inProgressCommit=emptyInProgressCommit] The Object containing the saved changes to apply.
             * @param {boolean} [clearCache=false] Boolean indicating whether or not you should clear the cache.
             * @returns {Promise} A promise indicating the success or failure of the update.
             */
            self.updateOntology = function(recordId, branchId, commitId, upToDate = true, inProgressCommit = emptyInProgressCommit, clearCache = false) {
                var listItem;
                var oldListItem = self.getListItemByRecordId(recordId);

                return om.getOntology(recordId, branchId, commitId, 'jsonld', clearCache)
                    .then(ontology => self.createOntologyListItem(om.getOntologyIRI(ontology), recordId, branchId, commitId, ontology, inProgressCommit, upToDate, oldListItem.ontologyRecord.title), $q.reject)
                    .then(response => {
                        listItem = response;
                        listItem.editorTabStates = oldListItem.editorTabStates;
                        if (listItem.ontologyId !== oldListItem.ontologyId) {
                            self.setSelected(listItem.ontologyId, true, listItem);
                            self.resetStateTabs(listItem);
                        } else {
                            listItem.selected = oldListItem.selected;
                        }
                        return sm.updateOntologyState(recordId, branchId, commitId);
                    }, $q.reject)
                    .then(() => {
                        var activeKey = self.getActiveKey(oldListItem);
                        _.assign(oldListItem, listItem);
                        self.setActivePage(activeKey, oldListItem);
                    }, $q.reject);
            }
            self.addOntologyToList = function(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, title, upToDate = true) {
                return self.createOntologyListItem(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, upToDate, title)
                    .then(listItem => {
                        self.list.push(listItem);
                        return listItem;
                    }, $q.reject);
            }
            self.createOntologyListItem = function(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit,
                upToDate = true, title) {
                var listItem = setupListItem(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, upToDate, title);
                return $q.all([
                    om.getOntologyStuff(recordId, branchId, commitId),
                    cm.getRecordBranches(recordId, catalogId)
                ]).then(response => {
                    listItem.iriList.push(listItem.ontologyId);
                    var responseIriList = _.get(response[0], 'iriList', {});
                    listItem.iriList = _.union(listItem.iriList, _.flatten(_.values(responseIriList)));
                    _.get(responseIriList, 'annotationProperties', []).forEach(iri => addIri(listItem.annotations.iris, iri, ontologyId));
                    _.forEach(_.get(responseIriList, 'classes', []), iri => self.addToClassIRIs(listItem, iri));
                    _.get(responseIriList, 'dataProperties', []).forEach(iri => addIri(listItem.dataProperties.iris, iri, ontologyId));
                    _.get(responseIriList, 'objectProperties', []).forEach(iri => addIri(listItem.objectProperties.iris, iri, ontologyId));
                    _.get(responseIriList, 'namedIndividuals', []).forEach(iri => addIri(listItem.individuals.iris, iri, ontologyId));
                    listItem.derivedConcepts = _.get(responseIriList, 'derivedConcepts', []);
                    listItem.derivedConceptSchemes = _.get(responseIriList, 'derivedConceptSchemes', []);
                    listItem.derivedSemanticRelations = _.get(responseIriList, 'derivedSemanticRelations', []);
                    _.get(responseIriList, 'datatypes', []).forEach(iri => addIri(listItem.dataPropertyRange, iri, ontologyId));
                    _.forEach(_.get(response[0], 'importedIRIs'), iriList => {
                        iriList.annotationProperties.forEach(iri => addIri(listItem.annotations.iris, iri, iriList.id));
                        iriList.classes.forEach(iri => self.addToClassIRIs(listItem, iri, iriList.id));
                        iriList.dataProperties.forEach(iri => addIri(listItem.dataProperties.iris, iri, iriList.id));
                        iriList.objectProperties.forEach(iri => addIri(listItem.objectProperties.iris, iri, iriList.id));
                        iriList.namedIndividuals.forEach(iri => addIri(listItem.individuals.iris, iri, iriList.id));
                        iriList.datatypes.forEach(iri => addIri(listItem.dataPropertyRange, iri, iriList.id));
                        listItem.iriList.push(iriList['id'])
                        listItem.iriList = _.union(listItem.iriList, _.flatten(_.values(iriList)))
                    });
                    setHierarchyInfo(listItem.classes, response[0], 'classHierarchy');
                    listItem.classes.flat = self.flattenHierarchy(listItem.classes.hierarchy, recordId, listItem);
                    setHierarchyInfo(listItem.dataProperties, response[0], 'dataPropertyHierarchy');
                    listItem.dataProperties.flat = self.flattenHierarchy(listItem.dataProperties.hierarchy, recordId, listItem);
                    setHierarchyInfo(listItem.objectProperties, response[0], 'objectPropertyHierarchy');
                    listItem.objectProperties.flat = self.flattenHierarchy(listItem.objectProperties.hierarchy, recordId, listItem);
                    setHierarchyInfo(listItem.annotations, response[0], 'annotationHierarchy');
                    listItem.annotations.flat = self.flattenHierarchy(listItem.annotations.hierarchy, recordId, listItem);
                    setHierarchyInfo(listItem.concepts, response[0], 'conceptHierarchy');
                    listItem.concepts.flat = self.flattenHierarchy(listItem.concepts.hierarchy, recordId, listItem);
                    setHierarchyInfo(listItem.conceptSchemes, response[0], 'conceptSchemeHierarchy');
                    listItem.conceptSchemes.flat = self.flattenHierarchy(listItem.conceptSchemes.hierarchy, recordId, listItem);
                    _.forEach(_.get(response[0], 'importedOntologies'), importedOntObj => {
                        addImportedOntologyToListItem(listItem, importedOntObj);
                    });
                    listItem.classesAndIndividuals = response[0].individuals;
                    listItem.classesWithIndividuals = _.keys(listItem.classesAndIndividuals);
                    listItem.individualsParentPath = self.getIndividualsParentPath(listItem);
                    listItem.individuals.flat = self.createFlatIndividualTree(listItem);
                    listItem.flatEverythingTree = self.createFlatEverythingTree(getOntologiesArrayByListItem(listItem), listItem);
                    _.concat(pm.ontologyProperties, _.keys(listItem.dataProperties.iris), _.keys(listItem.objectProperties.iris), listItem.derivedSemanticRelations, pm.conceptSchemeRelationshipList, pm.schemeRelationshipList).forEach(iri => delete listItem.annotations.iris[iri]);
                    listItem.failedImports = _.get(response[0], 'failedImports', []);
                    listItem.branches = response[1].data;
                    var branch = _.find(listItem.branches, { '@id': listItem.ontologyRecord.branchId })
                    listItem.userBranch = cm.isUserBranch(branch);
                    if (listItem.userBranch) {
                        listItem.createdFromExists = _.some(listItem.branches, {'@id': util.getPropertyId(branch, prefixes.catalog + 'createdFrom')});
                    }
                    return listItem;
                },  $q.reject);
            }

            function addIri(iriObj, iri, ontologyId) {
                if (!_.has(iriObj, "['" + iri + "']")) {
                    iriObj[iri] = ontologyId || $filter('splitIRI')(iri).begin;
                }
            }

            self.getIndividualsParentPath = function(listItem) {
                var result = [];
                _.forEach(_.keys(listItem.classesAndIndividuals), classIRI => {
                    result = _.concat(result, getClassesForIndividuals(listItem.classes.index, classIRI));
                });
                return _.uniq(result);
            }
            self.setVocabularyStuff = function(listItem = self.listItem) {
                httpService.cancel(self.vocabularySpinnerId);
                om.getVocabularyStuff(listItem.ontologyRecord.recordId, listItem.ontologyRecord.branchId, listItem.ontologyRecord.commitId, self.vocabularySpinnerId)
                    .then(response => {
                        listItem.derivedConcepts = _.get(response, 'derivedConcepts', []);
                        listItem.derivedConceptSchemes = _.get(response, 'derivedConceptSchemes', []);
                        listItem.derivedSemanticRelations = _.get(response, 'derivedSemanticRelations', []);
                        listItem.concepts.hierarchy = _.get(response, 'concepts.hierarchy', []);
                        listItem.concepts.index = _.get(response, 'concepts.index', {});
                        listItem.concepts.flat = self.flattenHierarchy(listItem.concepts.hierarchy, listItem.ontologyRecord.recordId, listItem);
                        listItem.conceptSchemes.hierarchy = _.get(response, 'conceptSchemes.hierarchy', []);
                        listItem.conceptSchemes.index = _.get(response, 'conceptSchemes.index', {});
                        listItem.conceptSchemes.flat = self.flattenHierarchy(listItem.conceptSchemes.hierarchy, listItem.ontologyRecord.recordId, listItem);
                        _.unset(listItem.editorTabStates.concepts, 'entityIRI');
                        _.unset(listItem.editorTabStates.concepts, 'usages');
                    }, util.createErrorToast);
            }
            /**
             * @ngdoc method
             * @name flattenHierarchy
             * @methodOf ontologyState.service:ontologyStateService
             *
             * @description
             * Flattens the provided hierarchy into an array that represents the hierarchical structure to be used
             * with a virtual scrolling solution.
             *
             * @param {Object} hierarchy The Object set up in a hierarchical structure.
             * @param {string} recordId The record ID associated with the provided hierarchy.
             * @param {Object} [listItem=self.listItem] The listItem associated with the provided hierarchy.
             * @returns {Object[]} An array which represents the provided hierarchy.
             */
            self.flattenHierarchy = function(hierarchy, recordId, listItem = self.listItem) {
                var result = [];
                var sortedHierarchy = orderHierarchy(hierarchy, listItem);
                _.forEach(sortedHierarchy, node => {
                    addNodeToResult(node, result, 0, [recordId]);
                });
                return result;
            }
            /**
             * @ngdoc method
             * @name createFlatEverythingTree
             * @methodOf ontologyState.service:ontologyStateService
             *
             * @description
             * Creates an array which represents the hierarchical structure of the relationship between classes
             * and properties to be used with a virtual scrolling solution.
             *
             * @param {Object[]} ontologies The array of ontologies to build the hierarchal structure for.
             * @param {Object} listItem The listItem linked to the ontology you want to add the entity to.
             * @returns {Object[]} An array which contains the class-property replationships.
             */
            self.createFlatEverythingTree = function(ontologies, listItem) {
                var result = [];
                var orderedClasses = sortByName(om.getClasses(ontologies), listItem);
                var orderedProperties = [];
                var path = [];

                _.forEach(orderedClasses, clazz => {
                    orderedProperties = sortByName(om.getClassProperties(ontologies, clazz['@id']), listItem);
                    path = [listItem.ontologyRecord.recordId, clazz['@id']];
                    result.push(_.merge({}, clazz, {
                        indent: 0,
                        hasChildren: !!orderedProperties.length,
                        path
                    }));
                    _.forEach(orderedProperties, property => {
                        result.push(_.merge({}, property, {
                            indent: 1,
                            hasChildren: false,
                            path: _.concat(path, property['@id'])
                        }));
                    });
                });
                var orderedNoDomainProperties = sortByName(om.getNoDomainProperties(ontologies), listItem);
                if (orderedNoDomainProperties.length) {
                    result.push({
                        title: 'Properties',
                        get: self.getNoDomainsOpened,
                        set: self.setNoDomainsOpened
                    });
                    _.forEach(orderedNoDomainProperties, property => {
                        result.push(_.merge({}, property, {
                            indent: 1,
                            hasChildren: false,
                            get: self.getNoDomainsOpened,
                            path: [listItem.ontologyRecord.recordId, property['@id']]
                        }));
                    });
                }
                return result;
            }
            /**
             * @ngdoc method
             * @name createFlatIndividualTree
             * @methodOf ontologyState.service:ontologyStateService
             *
             * @description
             * Creates an array which represents the hierarchical structure of the relationship between classes
             * and individuals to be used with a virtual scrolling solution.
             *
             * @param {Object} listItem The listItem linked to the ontology you want to add the entity to.
             * @returns {Object[]} An array which contains the class-individuals replationships.
             */
            self.createFlatIndividualTree = function(listItem) {
                var result = [];
                var neededClasses = _.get(listItem, 'individualsParentPath', []);
                var classesWithIndividuals = _.get(listItem, 'classesAndIndividuals', {});
                if (neededClasses.length && !_.isEmpty(classesWithIndividuals)) {
                    _.forEach(_.get(listItem, 'classes.flat', []), node => {
                        if (_.includes(neededClasses, node.entityIRI)) {
                            result.push(_.merge({}, node, {isClass: true}));
                            var sortedIndividuals = _.sortBy(_.get(classesWithIndividuals, node.entityIRI), entityIRI => _.lowerCase(self.getEntityNameByIndex(entityIRI, listItem)));
                            _.forEach(sortedIndividuals, entityIRI => {
                                addNodeToResult({entityIRI}, result, node.indent + 1, node.path);
                            });
                        }
                    });
                }
                return result;
            }
            /**
             * @ngdoc method
             * @name addEntity
             * @methodOf ontologyState.service:ontologyStateService
             *
             * @description
             * Adds the entity represented by the entityJSON to the ontology with the provided ontology ID in the
             * Mobi repository. Adds the new entity to the index.
             *
             * @param {Object} listItem The listItem linked to the ontology you want to add the entity to.
             * @param {string} entityJSON The JSON-LD representation for the entity you want to add to the ontology.
             */
            self.addEntity = function(listItem, entityJSON) {
                listItem.ontology.push(entityJSON);
                listItem.iriList.push(entityJSON['@id']);
                _.get(listItem, 'index', {})[entityJSON['@id']] = {
                    position: listItem.ontology.length - 1,
                    label: om.getEntityName(entityJSON),
                    ontologyIri: listItem.ontologyId
                }
            }
            /**
             * @ngdoc method
             * @name removeEntity
             * @methodOf ontologyState.service:ontologyStateService
             *
             * @description
             * Removes the entity with the provided IRI from the ontology with the provided ontology ID in the Mobi
             * repository along with any referenced blank nodes. Removes the entityIRI and any reference blank nodes
             * from the index.
             *
             * @param {Object} listItem The listItem linked to the ontology you want to remove the entity from.
             * @returns {Object[]} The list of JSON-LD entities that were removed.
             */
            self.removeEntity = function(listItem, entityIRI) {
                var toRemove = [];
                var toTest = [];

                // Helper method
                function addToLists(iri) {
                    var newObj = {entityIRI: iri, position: _.get(listItem.index, "['" + iri + "'].position")};
                    toRemove.push(newObj);
                    toTest.push(newObj);
                }
                addToLists(entityIRI);
                while (toTest.length) {
                    var obj = toTest.pop();
                    var entity = listItem.ontology[obj.position];
                    _.forOwn(_.omit(entity, ['@id', '@type']), (value, key) => {
                        if (om.isBlankNodeId(key)) {
                            addToLists(key);
                        }
                        _.forEach(value, valueObj => {
                            var id = _.get(valueObj, '@id');
                            if (om.isBlankNodeId(id)) {
                                addToLists(id);
                            }
                        });
                    });
                }
                var removed = _.pullAt(listItem.ontology, _.map(toRemove, 'position'));
                _.forEach(toRemove, obj => {
                    var newPosition = _.get(listItem.index, "['" + obj.entityIRI + "'].position");
                    _.remove(listItem.iriList, item => item === obj.entityIRI);
                    _.unset(listItem.index, obj.entityIRI);
                    _.forOwn(listItem.index, (value, key) => {
                        if (value.position > newPosition) {
                            listItem.index[key].position = value.position - 1;
                        }
                    });
                });
                return removed;
            }
            /**
             * @ngdoc method
             * @name getListItemByRecordId
             * @methodOf ontologyState.service:ontologyStateService
             *
             * @description
             * Gets the associated object from the {@link ontologyState.service:ontologyStateService#list list} that
             * contains the requested record ID. Returns the list item.
             *
             * @param {string} recordId The record ID of the requested ontology.
             * @returns {Object} The associated Object from the
             * {@link ontologyState.service:ontologyStateService#list list}.
             */
            self.getListItemByRecordId = function(recordId) {
                return _.find(self.list, {ontologyRecord: {recordId}});
            }
            /**
             * @ngdoc method
             * @name getOntologyByRecordId
             * @methodOf ontologyState.service:ontologyStateService
             *
             * @description
             * Gets the ontology from the {@link ontologyState.service:ontologyStateService#list list} using the
             * requested recordId ID. Returns the JSON-LD of the ontology.
             *
             * @param {string} recordId The record ID of the requested ontology.
             * @returns {Object[]} The JSON-LD of the requested ontology.
             */
            self.getOntologyByRecordId = function(recordId) {
                return _.get(self.getListItemByRecordId(recordId), 'ontology', []);
            }
            /**
             * @ngdoc method
             * @name getEntityByRecordId
             * @methodOf ontologyState.service:ontologyStateService
             *
             * @description
             * Gets entity with the provided IRI from the ontology linked to the provided recordId in the Mobi
             * repository. Returns the entity Object.
             *
             * @param {string} recordId The recordId linked to the ontology you want to check.
             * @param {string} entityIRI The IRI of the entity that you want.
             * @returns {Object} An Object which represents the requested entity.
             */
            self.getEntityByRecordId = function(recordId, entityIRI, listItem) {
                if (!_.isEmpty(listItem)) {
                    return getEntityFromListItem(listItem, entityIRI);
                }
                return getEntityFromListItem(self.getListItemByRecordId(recordId), entityIRI);
            }
            /**
             * @ngdoc method
             * @name getEntityNameByIndex
             * @methodOf ontologyState.service:ontologyStateService
             *
             * @description
             * Gets the entity's name using the provided entityIRI and listItem to find the entity's label in the index.
             * If that entityIRI is not in the index, retrieves the beautiful IRI of the entity IRI.
             *
             * @param {Object} entity The entity you want the name of.
             * @returns {string} The beautified IRI string.
             */
            self.getEntityNameByIndex = function(entityIRI, listItem) {
                var indices = getIndices(listItem);
                var entity = _.result(_.find(indices, index => {
                    var entity = _.get(index, entityIRI);
                     return (entity !== null && _.has(entity, 'label'));
                }), entityIRI);
                return !entity ? utilService.getBeautifulIRI(entityIRI) : entity.label;
            }
            /**
             * @ngdoc method
             * @name saveChanges
             * @methodOf ontologyState.service:ontologyStateService
             *
             * @description
             * Saves all changes to the ontology with the specified record id by updating the in progress commit.
             *
             * @param {string} recordId The record ID of the requested ontology.
             * @param {Object} differenceObj The object containing statements that represent changes made.
             * @param {Object[]} differenceObj.additions The statements that were added.
             * @param {Object[]} differenceObj.deletions The statements that were deleted.
             * @returns {Promise} A promise with the ontology ID.
             */
            self.saveChanges = function(recordId, differenceObj) {
                return cm.getInProgressCommit(recordId, catalogId)
                    .then($q.when, errorMessage => {
                        if (errorMessage === 'InProgressCommit could not be found') {
                            return cm.createInProgressCommit(recordId, catalogId);
                        } else {
                            return $q.reject(errorMessage);
                        }
                    })
                    .then(() => cm.updateInProgressCommit(recordId, catalogId, differenceObj), $q.reject);
            }
            self.addToAdditions = function(recordId, json) {
                addToInProgress(recordId, json, 'additions');
            }
            self.addToDeletions = function(recordId, json) {
                addToInProgress(recordId, json, 'deletions');
            }
            /**
             * @ngdoc method
             * @name openOntology
             * @methodOf ontologyState.service:ontologyStateService
             *
             * @description
             * Used to open an ontology from the Mobi repository. It calls
             * {@link ontologyState.service:ontologyStateService#getOntology getOntology} to get the specified
             * ontology from the Mobi repository. Returns a promise.
             *
             * @param {string} recordId The record ID of the requested ontology.
             * @param {string} recordTitle The title of the requested ontology.
             * @returns {Promise} A promise with the ontology ID or error message.
             */
            self.openOntology = function(recordId, recordTitle) {
                var ontologyId;
                return self.getOntology(recordId)
                    .then(response => {
                        ontologyId = om.getOntologyIRI(response.ontology);
                        return self.addOntologyToList(ontologyId, recordId, response.branchId, response.commitId, response.ontology, response.inProgressCommit, recordTitle, response.upToDate);
                    }, $q.reject)
                    .then(response => {
                        self.listItem = response;
                        self.setSelected(self.getActiveEntityIRI(), false);
                        return ontologyId;
                    }, $q.reject);
            }
            /**
             * @ngdoc method
             * @name closeOntology
             * @methodOf ontologyState.service:ontologyStateService
             *
             * @description
             * Used to close an ontology from the Mobi application. It removes the ontology list item from the
             * {@link ontologyState.service:ontologyStateService#list list}.
             *
             * @param {string} recordId The record ID of the requested ontology.
             */
            self.closeOntology = function(recordId) {
                if (_.get(self.listItem, 'ontologyRecord.recordId') == recordId) {
                   self.listItem = {};
                }
                _.remove(self.list, { ontologyRecord: { recordId }});
            }
            self.removeBranch = function(recordId, branchId) {
                sm.deleteOntologyBranch(recordId, branchId);
                _.remove(self.getListItemByRecordId(recordId).branches, {'@id': branchId});
            }
            self.afterSave = function() {
                return cm.getInProgressCommit(self.listItem.ontologyRecord.recordId, catalogId)
                    .then(inProgressCommit => {
                        self.listItem.inProgressCommit = inProgressCommit;

                        self.listItem.additions = [];
                        self.listItem.deletions = [];

                        _.forOwn(self.listItem.editorTabStates, (value, key) => {
                            _.unset(value, 'usages');
                        });

                        if (_.isEmpty(sm.getOntologyStateByRecordId(self.listItem.ontologyRecord.recordId))) {
                            return sm.createOntologyState(self.listItem.ontologyRecord.recordId, self.listItem.ontologyRecord.branchId, self.listItem.ontologyRecord.commitId);
                        } else {
                            return sm.updateOntologyState(self.listItem.ontologyRecord.recordId, self.listItem.ontologyRecord.branchId, self.listItem.ontologyRecord.commitId);
                        }
                    }, $q.reject);
            }
            self.clearInProgressCommit = function() {
                _.set(self.listItem, 'inProgressCommit.additions', []);
                _.set(self.listItem, 'inProgressCommit.deletions', []);
            }
            self.setOpened = function(pathString, isOpened) {
                _.set(self.listItem.editorTabStates, getOpenPath(pathString, 'isOpened'), isOpened);
            }
            self.getOpened = function(pathString) {
                return _.get(self.listItem.editorTabStates, getOpenPath(pathString, 'isOpened'), false);
            }
            self.setNoDomainsOpened = function(recordId, isOpened) {
                _.set(self.listItem.editorTabStates, getOpenPath(recordId, 'noDomainsOpened'), isOpened);
            }
            self.getNoDomainsOpened = function(recordId) {
                return _.get(self.listItem.editorTabStates, getOpenPath(recordId, 'noDomainsOpened'), false);
            }
            self.setDataPropertiesOpened = function(recordId, isOpened) {
                _.set(self.listItem.editorTabStates, getOpenPath(recordId, 'dataPropertiesOpened'), isOpened);
            }
            self.getDataPropertiesOpened = function(recordId) {
                return _.get(self.listItem.editorTabStates, getOpenPath(recordId, 'dataPropertiesOpened'), false);
            }
            self.setObjectPropertiesOpened = function(recordId, isOpened) {
                _.set(self.listItem.editorTabStates, getOpenPath(recordId, 'objectPropertiesOpened'), isOpened);
            }
            self.getObjectPropertiesOpened = function(recordId) {
                return _.get(self.listItem.editorTabStates, getOpenPath(recordId, 'objectPropertiesOpened'), false);
            }
            self.setAnnotationPropertiesOpened = function(recordId, isOpened) {
                _.set(self.listItem.editorTabStates, getOpenPath(recordId, 'annotationPropertiesOpened'), isOpened);
            }
            self.getAnnotationPropertiesOpened = function(recordId) {
                return _.get(self.listItem.editorTabStates, getOpenPath(recordId, 'annotationPropertiesOpened'), false);
            }
            self.onEdit = function(iriBegin, iriThen, iriEnd) {
                var newIRI = iriBegin + iriThen + iriEnd;
                var oldEntity = $filter('removeMobi')(self.listItem.selected);
                self.getActivePage().entityIRI = newIRI;
                if (_.some(self.listItem.additions, oldEntity)) {
                    _.remove(self.listItem.additions, oldEntity);
                    updateRefsService.update(self.listItem, self.listItem.selected['@id'], newIRI);
                } else {
                    updateRefsService.update(self.listItem, self.listItem.selected['@id'], newIRI);
                    self.addToDeletions(self.listItem.ontologyRecord.recordId, oldEntity);
                }
                if (self.getActiveKey() !== 'project') {
                    self.setCommonIriParts(iriBegin, iriThen);
                }
                self.addToAdditions(self.listItem.ontologyRecord.recordId, $filter('removeMobi')(self.listItem.selected));
                return om.getEntityUsages(self.listItem.ontologyRecord.recordId, self.listItem.ontologyRecord.branchId, self.listItem.ontologyRecord.commitId, oldEntity['@id'], 'construct')
                    .then(statements => {
                        _.forEach(statements, statement => self.addToDeletions(self.listItem.ontologyRecord.recordId, statement));
                        updateRefsService.update(statements, oldEntity['@id'], newIRI);
                        _.forEach(statements, statement => self.addToAdditions(self.listItem.ontologyRecord.recordId, statement));
                    }, errorMessage => util.createErrorToast('Associated entities were not updated due to an internal error.'));
            }
            self.setCommonIriParts = function(iriBegin, iriThen) {
                _.set(self.listItem, 'iriBegin', iriBegin);
                _.set(self.listItem, 'iriThen', iriThen);
            }
            self.setSelected = function(entityIRI, getUsages = true, listItem = self.listItem) {
                listItem.selected = self.getEntityByRecordId(listItem.ontologyRecord.recordId, entityIRI, listItem);
                if (getUsages && !_.has(self.getActivePage(), 'usages') && listItem.selected) {
                    self.setEntityUsages(entityIRI);
                }
            }
            self.setEntityUsages = function(entityIRI) {
                var page = self.getActivePage();
                var id = 'usages-' + self.getActiveKey() + '-' + self.listItem.ontologyRecord.recordId;
                httpService.cancel(id);
                om.getEntityUsages(self.listItem.ontologyRecord.recordId, self.listItem.ontologyRecord.branchId, self.listItem.ontologyRecord.commitId, entityIRI, 'select', id)
                    .then(bindings => _.set(page, 'usages', bindings),
                        response => _.set(page, 'usages', []));
            }

            self.resetStateTabs = function(listItem = self.listItem) {
                _.forOwn(listItem.editorTabStates, (value, key) => {
                    if (key !== 'project') {
                        _.unset(value, 'entityIRI');
                    } else {
                        value.entityIRI = om.getOntologyIRI(listItem.ontology);
                        value.preview = '';
                    }
                    _.unset(value, 'usages');
                });
                if (self.getActiveKey() !== 'project') {
                    listItem.selected = undefined;
                } else {
                    listItem.selected = self.getEntityByRecordId(listItem.ontologyRecord.recordId, listItem.editorTabStates.project.entityIRI);
                }
            }
            self.getActiveKey = function(listItem = self.listItem) {
                return _.findKey(listItem.editorTabStates, 'active') || 'project';
            }
            self.getActivePage = function(listItem = self.listItem) {
                return listItem.editorTabStates[self.getActiveKey(listItem)];
            }
            self.setActivePage = function(key, listItem = self.listItem) {
                if (_.has(listItem.editorTabStates, key)) {
                    self.getActivePage(listItem).active = false;
                    listItem.editorTabStates[key].active = true;
                }
            }
            self.getActiveEntityIRI = function() {
                return _.get(self.getActivePage(), 'entityIRI');
            }
            self.selectItem = function(entityIRI, getUsages = true) {
                if (entityIRI && entityIRI !== self.getActiveEntityIRI()) {
                    _.set(self.getActivePage(), 'entityIRI', entityIRI);
                    if (getUsages) {
                        self.setEntityUsages(entityIRI);
                    }
                }
                self.setSelected(entityIRI, false);
            }
            self.unSelectItem = function() {
                var activePage = self.getActivePage();
                _.unset(activePage, 'entityIRI');
                _.unset(activePage, 'usages');
                self.listItem.selected = undefined;
            }
            self.hasChanges = function(listItem) {
                return !!_.get(listItem, 'additions', []).length || !!_.get(listItem, 'deletions', []).length;
            }
            self.isCommittable = function(listItem) {
                return !!_.get(listItem, 'inProgressCommit.additions', []).length || !!_.get(listItem, 'inProgressCommit.deletions', []).length;
            }
            self.addEntityToHierarchy = function(hierarchy, entityIRI, indexObject, parentIRI) {
                var hierarchyItem = {entityIRI};
                var pathsToEntity = self.getPathsTo(hierarchy, indexObject, entityIRI);
                if (pathsToEntity.length) {
                    if (pathsToEntity[0].length > 1) {
                        var path = pathsToEntity[0];
                        hierarchyItem = _.find(hierarchy, {entityIRI: path.shift()});
                        while (path.length > 0) {
                            hierarchyItem = _.find(hierarchyItem.subEntities, {entityIRI: path.shift()});
                        }
                    } else if (_.some(hierarchy, {entityIRI})) {
                        hierarchyItem = _.remove(hierarchy, hierarchyItem)[0];
                    }
                }
                if (parentIRI && self.getPathsTo(hierarchy, indexObject, parentIRI).length) {
                    _.forEach(getEntities(hierarchy, parentIRI, indexObject), parent =>
                        parent.subEntities = _.union(_.get(parent, 'subEntities', []), [hierarchyItem]));
                    indexObject[entityIRI] = _.union(_.get(indexObject, entityIRI, []), [parentIRI]);
                } else {
                    hierarchy.push(hierarchyItem);
                }
            }
            self.deleteEntityFromParentInHierarchy = function(hierarchy, entityIRI, parentIRI, indexObject) {
                var deletedEntity;
                _.forEach(getEntities(hierarchy, parentIRI, indexObject), parent => {
                    if (_.has(parent, 'subEntities')) {
                        deletedEntity = _.remove(parent.subEntities, {entityIRI})[0];
                        if (!parent.subEntities.length) {
                            _.unset(parent, 'subEntities');
                        }
                    }
                });
                if (_.has(indexObject, entityIRI)) {
                    _.remove(indexObject[entityIRI], item => item === parentIRI);
                    if (!indexObject[entityIRI].length) {
                        _.unset(indexObject, entityIRI);
                        hierarchy.push(deletedEntity);
                    }
                }
            }
            self.deleteEntityFromHierarchy = function(hierarchy, entityIRI, indexObject) {
                var deletedEntity;
                var paths = self.getPathsTo(hierarchy, indexObject, entityIRI);
                _.forEach(paths, path => {
                    if (path.length === 1) {
                        deletedEntity = _.remove(hierarchy, {entityIRI: path.shift()})[0];
                    } else if (path.length > 1) {
                        var current = _.find(hierarchy, {entityIRI: path.shift()});
                        while (path.length > 1) {
                            current = _.find(current.subEntities, {entityIRI: path.shift()});
                        }
                        deletedEntity = _.remove(current.subEntities, {entityIRI: path.shift()})[0];
                        if (!current.subEntities.length) {
                            _.unset(current, 'subEntities');
                        }
                    }
                });
                _.unset(indexObject, entityIRI);
                updateRefsService.remove(indexObject, entityIRI);
                _.forEach(_.get(deletedEntity, 'subEntities', []), hierarchyItem => {
                    var paths = self.getPathsTo(hierarchy, indexObject, hierarchyItem.entityIRI);
                    if (paths.length === 0) {
                        hierarchy.push(hierarchyItem);
                        _.unset(indexObject, hierarchyItem.entityIRI);
                    }
                });
            }
            self.getPathsTo = function(hierarchy, indexObject, entityIRI) {
                var result = [];
                if (_.has(indexObject, entityIRI)) {
                    _.forEach(indexObject[entityIRI], parentIRI => {
                        var paths = self.getPathsTo(hierarchy, indexObject, parentIRI);
                        _.forEach(paths, path => {
                            path.push(entityIRI);
                            result.push(path);
                        });
                    });
                } else if (_.some(hierarchy, {entityIRI})) {
                    result.push([entityIRI]);
                }
                return result;
            }
            self.areParentsOpen = function(node, get = self.getOpened) {
                var pathString = _.first(node.path);
                var pathCopy = _.tail(_.initial(node.path));
                return _.every(pathCopy, pathPart => {
                    pathString += '.' + pathPart;
                    return get(pathString);
                });
            }
            self.joinPath = function(path) {
                return _.join(path, '.');
            }
            self.goTo = function(iri) {
                var entity = self.getEntityByRecordId(self.listItem.ontologyRecord.recordId, iri);
                if (om.isOntology(entity)) {
                    commonGoTo('project', iri);
                } else if (om.isClass(entity)) {
                    commonGoTo('classes', iri, self.listItem.classes.flat);
                } else if (om.isDataTypeProperty(entity)) {
                    self.setDataPropertiesOpened(self.listItem.ontologyRecord.recordId, true);
                    commonGoTo('properties', iri, self.listItem.dataProperties.flat);
                } else if (om.isObjectProperty(entity)) {
                    self.setObjectPropertiesOpened(self.listItem.ontologyRecord.recordId, true);
                    commonGoTo('properties', iri, self.listItem.objectProperties.flat);
                } else if (om.isAnnotation(entity)) {
                    self.setAnnotationPropertiesOpened(self.listItem.ontologyRecord.recordId, true);
                    commonGoTo('properties', iri, self.listItem.annotations.flat);
                } else if (om.isConcept(entity, self.listItem.derivedConcepts)) {
                    commonGoTo('concepts', iri, self.listItem.concepts.flat);
                } else if (om.isConceptScheme(entity, self.listItem.derivedConceptSchemes)) {
                    commonGoTo('schemes', iri, self.listItem.conceptSchemes.flat);
                } else if (om.isIndividual(entity)) {
                    commonGoTo('individuals', iri, self.listItem.individuals.flat);
                }
            }
            self.openAt = function(flatHierarchy, entityIRI) {
                var path = _.get(_.find(flatHierarchy, {entityIRI}), 'path', []);
                if (path.length) {
                    var pathString = _.head(path);
                    _.forEach(_.tail(_.initial(path)), pathPart => {
                        pathString += '.' + pathPart;
                        self.setOpened(pathString, true);
                    });
                }
            }
            self.getDefaultPrefix = function() {
                return _.replace(_.get(self.listItem, 'iriBegin', self.listItem.ontologyId), '#', '/') + _.get(self.listItem, 'iriThen', '#');
            }
            self.getOntologiesArray = function() {
                return getOntologiesArrayByListItem(self.listItem);
            }
            self.updatePropertyIcon = function(entity) {
                if (om.isProperty(entity)) {
                    setPropertyIcon(entity);
                }
            }
            self.hasInProgressCommit = function(listItem = self.listItem) {
                return listItem.inProgressCommit !== undefined
                        && ((listItem.inProgressCommit.additions !== undefined && listItem.inProgressCommit.additions.length > 0)
                        || (listItem.inProgressCommit.deletions !== undefined && listItem.inProgressCommit.deletions.length > 0));
            }
            self.addToClassIRIs = function(listItem, iri, ontologyId) {
                if (!existenceCheck(listItem.classes.iris, iri)) {
                    if (iri === prefixes.skos + 'Concept' || iri === prefixes.skos + 'ConceptScheme') {
                        listItem.isVocabulary = true;
                    }
                    listItem.classes.iris[iri] = ontologyId || listItem.ontologyId;
                }
            }
            self.removeFromClassIRIs = function(listItem, iri) {
                var conceptCheck = iri === prefixes.skos + 'Concept' && !existenceCheck(listItem.classes.iris, prefixes.skos + 'ConceptScheme');
                var schemeCheck = iri === prefixes.skos + 'ConceptScheme' && !existenceCheck(listItem.classes.iris, prefixes.skos + 'Concept');
                if (conceptCheck || schemeCheck) {
                    listItem.isVocabulary = false;
                }
                delete listItem.classes.iris[iri];
            }

            /* Private helper functions */
            function existenceCheck(iriObj, iri) {
                return _.has(iriObj, "['" + iri + "']");
            }
            function getOntologiesArrayByListItem(listItem) {
                return _.concat([listItem.ontology], _.map(listItem.importedOntologies, 'ontology'));
            }
            function getIndices(listItem) {
                return _.concat([_.get(listItem, 'index')], _.map(_.get(listItem, 'importedOntologies'), 'index'));
            }
            function getEntities(hierarchy, entityIRI, indexObject) {
                var results = [];
                var pathsToEntity = self.getPathsTo(hierarchy, indexObject, entityIRI);
                _.forEach(pathsToEntity, path => {
                    var entity = _.find(hierarchy, {entityIRI: path.shift()});
                    while (path.length > 0) {
                        entity = _.find(entity.subEntities, {entityIRI: path.shift()});
                    }
                    results.push(entity);
                });
                return results;
            }
            function commonGoTo(key, iri, flatHierarchy) {
                self.setActivePage(key);
                self.selectItem(iri);
                if (flatHierarchy) {
                    self.openAt(flatHierarchy, iri);
                }
            }
            function getOpenPath() {
                return self.getActiveKey() + '.' + _.join(_.map([...arguments], encodeURIComponent), '.');
            }
            function setupListItem(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, upToDate, title) {
                var listItem = angular.copy(ontologyListItemTemplate);
                var blankNodes = {};
                var index = {};
                _.forEach(ontology, (entity, i) => {
                    if (_.has(entity, '@id')) {
                        index[entity['@id']] = {
                            position: i,
                            label: om.getEntityName(entity),
                            ontologyIri: ontologyId
                        }
                    } else {
                        _.set(entity, 'mobi.anonymous', ontologyId + ' (Anonymous Ontology)');
                    }
                    if (om.isProperty(entity)) {
                        setPropertyIcon(entity);
                    } else if (om.isBlankNode(entity)) {
                        blankNodes[_.get(entity, '@id')] = undefined;
                    } else if (om.isIndividual(entity)) {
                        findValuesMissingDatatypes(entity);
                    }
                });
                _.forEach(blankNodes, (value, id) => {
                    blankNodes[id] = mc.jsonldToManchester(id, ontology, index);
                });
                listItem.ontologyId = ontologyId;
                listItem.editorTabStates.project.entityIRI = ontologyId;
                listItem.ontologyRecord.title = title;
                listItem.ontologyRecord.recordId = recordId;
                listItem.ontologyRecord.branchId = branchId;
                listItem.ontologyRecord.commitId = commitId;
                listItem.ontology = ontology;
                listItem.blankNodes = blankNodes;
                listItem.index = index;
                listItem.inProgressCommit = inProgressCommit;
                listItem.upToDate = upToDate;
                return listItem;
            }
            function findValuesMissingDatatypes(object) {
                if (_.has(object, '@value')) {
                    if (!_.has(object, '@type') && !_.has(object, '@language')) {
                        object['@type'] = prefixes.xsd + "string";
                    }
                } else if (_.isObject(object)) {
                    _.forEach(_.keys(object), key => {
                        findValuesMissingDatatypes(object[key]);
                    });
                }
            }
            function addOntologyIdToArray(arr, ontologyId) {
                return _.forEach(arr, item => _.set(item, 'ontologyId', ontologyId));
            }
            function setPropertyIcon(entity) {
                _.set(entity, 'mobi.icon', getIcon(entity));
            }
            function getIcon(property) {
                var range = _.get(property, prefixes.rdfs + 'range');
                var icon = 'fa-square-o';
                if (range) {
                    if (range.length === 1) {
                        switch(range[0]['@id']) {
                            case prefixes.xsd + 'string':
                            case prefixes.rdf + 'langString':
                                icon = 'fa-font';
                                break;
                            case prefixes.xsd + 'decimal':
                            case prefixes.xsd + 'double':
                            case prefixes.xsd + 'float':
                            case prefixes.xsd + 'int':
                            case prefixes.xsd + 'integer':
                            case prefixes.xsd + 'long':
                            case prefixes.xsd + 'nonNegativeInteger':
                                icon = 'fa-calculator';
                                break;
                            case prefixes.xsd + 'language':
                                icon = 'fa-language';
                                break;
                            case prefixes.xsd + 'anyURI':
                                icon = 'fa-external-link';
                                break;
                            case prefixes.xsd + 'dateTime':
                                icon = 'fa-clock-o';
                                break;
                            case prefixes.xsd + 'boolean':
                            case prefixes.xsd + 'byte':
                                icon = 'fa-signal';
                                break;
                            case prefixes.rdfs + 'Literal':
                                icon = 'fa-cube';
                                break;
                            default:
                                icon = 'fa-link';
                                break;
                        }
                    } else {
                        icon = 'fa-cubes';
                    }
                }
                return icon;
            }
            function getEntityFromListItem(listItem, entityIRI) {
                if  (!entityIRI || !listItem) {
                    return;
                }
                var ontology = _.get(listItem, 'ontology');
                var ontologyId = _.get(listItem, 'ontologyId');
                var importedOntologyListItems = _.get(listItem, 'importedOntologies', []);
                var importedOntologyIds = _.get(listItem, 'importedOntologyIds');
                var indices = getIndices(listItem);
                var entities = [];
                _.forEach(indices, index => {
                    var entity = _.get(index, entityIRI);
                    if (entity && _.has(entity, 'position') && _.has(entity, 'ontologyIri')) {
                        if (entity.ontologyIri === ontologyId) {
                            entities.push(ontology[entity.position]);
                        } else {
                            entities.push(importedOntologyListItems[_.indexOf(importedOntologyIds, entity.ontologyIri)].ontology[entity.position]);
                        }
                    }
                });
                var combinedEntity = _.merge.apply({}, entities);
                if (_.isEmpty(combinedEntity)) {
                    return;
                } else {
                    return combinedEntity;
                }
            }
            function addToInProgress(recordId, json, prop) {
                var listItem = self.getListItemByRecordId(recordId);
                var entity = _.find(listItem[prop], {'@id': json['@id']});
                var filteredJson = $filter('removeMobi')(json);
                if (entity) {
                    _.mergeWith(entity, filteredJson, util.mergingArrays);
                } else  {
                    listItem[prop].push(filteredJson);
                }
            }
            function orderHierarchy(hierarchy, listItem) {
                return _.sortBy(hierarchy, node => {
                    if (_.has(node, 'subEntities')) {
                        node.subEntities = orderHierarchy(node.subEntities, listItem);
                    }
                    return _.lowerCase(self.getEntityNameByIndex(node.entityIRI, listItem));
                });
            }
            function addNodeToResult(node, result, indent, path) {
                var newPath = _.concat(path, node.entityIRI);
                var item = {
                    hasChildren: _.has(node, 'subEntities'),
                    entityIRI: node.entityIRI,
                    indent,
                    path: newPath
                };
                result.push(item);
                _.forEach(_.get(node, 'subEntities', []), subNode => {
                    addNodeToResult(subNode, result, indent + 1, newPath);
                });
            }
            function sortByName(array, listItem) {
                return _.sortBy(array, entity => _.lowerCase(self.getEntityNameByIndex(entity['@id'], listItem)));
            }
            function addImportedOntologyToListItem(listItem, importedOntObj) {
                var index = {};
                var blankNodes = {};
                _.forEach(importedOntObj.ontology, (entity, i) => {
                    if (_.has(entity, '@id')) {
                        index[entity['@id']] = {
                            position: i,
                            label: om.getEntityName(entity),
                            ontologyIri: importedOntObj.id
                        }
                        if (om.isBlankNode(entity)) {
                            blankNodes[entity['@id']] =  undefined;
                        }
                    }
                    self.updatePropertyIcon(entity);
                    _.set(entity, 'mobi.imported', true);
                    _.set(entity, 'mobi.importedIRI', importedOntObj.ontologyId);
                });
                _.forEach(blankNodes, (value, id) => {
                    blankNodes[id] = mc.jsonldToManchester(id, importedOntObj.ontology, index);
                });
                var importedOntologyListItem = {
                    id: importedOntObj.id,
                    ontologyId: importedOntObj.ontologyId,
                    ontology: importedOntObj.ontology,
                    index,
                    blankNodes
                };
                listItem.importedOntologyIds.push(importedOntObj.id);
                listItem.importedOntologies.push(importedOntologyListItem);
            }
        }
        function getClassesForIndividuals(index, iri) {
            var result = [iri];
            if (_.has(index, iri)) {
                var indexCopy = angular.copy(index);
                var parentIRIs = _.get(indexCopy, iri);
                _.unset(indexCopy, iri);
                _.forEach(parentIRIs, parentIRI => {
                    result = _.concat(result, getClassesForIndividuals(indexCopy, parentIRI));
                });
            }
            return result;
        }
        function setHierarchyInfo(obj, response, key) {
            var hierarchyInfo = _.get(response, key, {hierarchy: [], index: {}});
            obj.hierarchy = hierarchyInfo.hierarchy;
            obj.index = hierarchyInfo.index;
        }
})();

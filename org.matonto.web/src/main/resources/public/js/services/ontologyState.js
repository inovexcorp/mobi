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
         * @requires ontologyManager.service:ontologyManagerService
         * @requires updateRefs.service:updateRefsService
         * @requires stateManager.service:stateManagerService
         * @requires util.service:utilService
         * @requires catalogManager.service:catalogManagerService
         * @requires propertyManager.service:propertyManagerService
         * @requires prefixes.service:prefixes
         */
        .service('ontologyStateService', ontologyStateService);

        ontologyStateService.$inject = ['$timeout', '$q', '$filter', 'ontologyManagerService', 'updateRefsService', 'stateManagerService', 'utilService', 'catalogManagerService', 'propertyManagerService', 'prefixes', 'manchesterConverterService', 'httpService'];

        function ontologyStateService($timeout, $q, $filter, ontologyManagerService, updateRefsService, stateManagerService, utilService, catalogManagerService, propertyManagerService, prefixes, manchesterConverterService, httpService) {
            var self = this;
            var om = ontologyManagerService;
            var sm = stateManagerService;
            var cm = catalogManagerService;
            var util = utilService;
            var mc = manchesterConverterService;
            var catalogId = '';

            var ontologyListItemTemplate = {
                ontology: [],
                ontologyId: '',
                annotations: angular.copy(propertyManagerService.defaultAnnotations),
                dataPropertyRange: om.defaultDatatypes,
                subClasses: [],
                subDataProperties: [],
                subObjectProperties: [],
                individuals: [],
                classHierarchy: [],
                classIndex: {},
                dataPropertyHierarchy: [],
                dataPropertyIndex: {},
                objectPropertyHierarchy: [],
                objectPropertyIndex: {},
                classesWithIndividuals: [],
                classesWithIndividualsIndex: {},
                blankNodes: {},
                index: {},
                additions: [],
                deletions: [],
                inProgressCommit: {
                    additions: [],
                    deletions: []
                },
                branches: [],
                upToDate: true,
                isSaved: false
            };
            var vocabularyListItemTemplate = {
                ontology: [],
                ontologyId: '',
                annotations: angular.copy(_.union(propertyManagerService.defaultAnnotations,
                    propertyManagerService.skosAnnotations)),
                conceptHierarchy: [],
                conceptIndex: {},
                index: {},
                additions: [],
                deletions: [],
                inProgressCommit: {
                    additions: [],
                    deletions: []
                },
                branches: [],
                upToDate: true,
                isSaved: false
            };
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
             * The structure of the ontology object is:
             * ```
             * {
             *      ontologyId: '',
             *      ontology: [],
             *      annotations: [],
             *      subDataProperties: [],
             *      subObjectProperties: [],
             *      dataPropertyRange: [],
             *      classHierarchy: [],
             *      individuals: [],
             *      classesWithIndividuals: [],
             *      subClasses: [],
             *      blankNodes: {},
             *      index: {}
             * }
             * ```
             */
            self.list = [];

            self.states = [];
            self.newState = {active: true};
            self.state = self.newState;
            self.selected = {};
            self.listItem = {};

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
            self.reset = function() {
                self.list = [];
                self.states = [];
                self.selected = {};
                self.state = self.newState;
                self.state.active = true;
                self.listItem = {};
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
             * @returns {Promise} A promise containing the ontology id, record id, branch id, commit id,
             *                    inProgressCommit, and JSON-LD serialization of the ontology.
             */
            self.getOntology = function(recordId, rdfFormat = 'jsonld') {
                var state = sm.getOntologyStateByRecordId(recordId);
                var deferred = $q.defer();
                if (!_.isEmpty(state)) {
                    var inProgressCommit = emptyInProgressCommit;
                    var branchId = _.get(state, "model[0]['" + prefixes.ontologyState + "branch'][0]['@id']");
                    var commitId = _.get(state, "model[0]['" + prefixes.ontologyState + "commit'][0]['@id']");
                    cm.getInProgressCommit(recordId, catalogId)
                        .then(response => {
                            inProgressCommit = response;
                            return om.getOntology(recordId, branchId, commitId, rdfFormat);
                        }, errorMessage => {
                            if (errorMessage === 'User has no InProgressCommit') {
                                return om.getOntology(recordId, branchId, commitId, rdfFormat);
                            }
                            return $q.reject();
                        })
                        .then(ontology => deferred.resolve({ontology, recordId, branchId, commitId, inProgressCommit}), () => {
                            sm.deleteOntologyState(recordId, branchId, commitId)
                                .then(() => self.getLatestOntology(recordId, rdfFormat), $q.reject)
                                .then(deferred.resolve, deferred.reject);
                        });
                } else {
                    self.getLatestOntology(recordId, rdfFormat).then(deferred.resolve, deferred.reject);
                }
                return deferred.promise;
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
                        return cm.getBranchHeadCommit(branchId, recordId, catalogId);
                    }, $q.reject)
                    .then(headCommit => {
                        commitId = _.get(headCommit, "commit['@id']", '');
                        return sm.createOntologyState(recordId, branchId, commitId);
                    }, $q.reject)
                    .then(() => om.getOntology(recordId, branchId, commitId, rdfFormat), $q.reject)
                    .then(ontology => {return {ontology, recordId, branchId, commitId, inProgressCommit: emptyInProgressCommit}}, $q.reject);
            }
            /**
             * @ngdoc method
             * @name createOntology
             * @methodOf ontologyState.service:ontologyStateService
             *
             * @description
             * Uploads the provided JSON-LD as a new ontology and creates a new list item for the new ontology.
             * Returns a promise with the entityIRI and ontologyId for the state of the newly created ontology.
             *
             * @param {string} ontologyJson The JSON-LD representing the ontology.
             * @param {string} title The title for the OntologyRecord.
             * @param {string} description The description for the OntologyRecord.
             * @param {string} keywords The keywords for the OntologyRecord.
             * @param {string} type The type (either "ontology" or "vocabulary") for the document being created.
             * @returns {Promise} A promise with the entityIRI and ontologyId for the state of the newly created
             * ontology.
             */
            self.createOntology = function(ontologyJson, title, description, keywords, type = 'ontology') {
                var listItem;
                return om.uploadJson(ontologyJson, title, description, keywords)
                    .then(data => {
                        listItem = setupListItem(data.ontologyId, data.recordId, data.branchId, data.commitId, [ontologyJson], emptyInProgressCommit, type);
                        return cm.getRecordBranch(data.branchId, data.recordId, catalogId);
                    }, $q.reject)
                    .then(branch => {
                        listItem.branches = [branch];
                        self.list.push(listItem);
                        return {
                            entityIRI: ontologyJson['@id'],
                            recordId: listItem.recordId,
                            branchId: listItem.branchId,
                            commitId: listItem.commitId
                        };
                    }, $q.reject);
            }
            /**
             * @ngdoc method
             * @name uploadThenGet
             * @methodOf ontologyState.service:ontologyStateService
             *
             * @description
             * Uploads the provided file as an ontology and creates a new list item for the new ontology. Returns a
             * promise with the record id of the new OntologyRecord.
             *
             * @param {File} file The ontology file.
             * @param {string} title The record title.
             * @param {string} description The record description.
             * @param {string} keywords The record list of keywords separated by commas.
             * @param {string} type The type identifier for the file uploaded.
             * @returns {Promise} A promise with the ontology record ID or error message.
             */
            self.uploadThenGet = function(file, title, description, keywords, type = 'ontology') {
                var recordId, ontologyId;
                return om.uploadFile(file, title, description, keywords)
                    .then(data => {
                        recordId = data.recordId;
                        ontologyId = data.ontologyId;
                        return self.getOntology(recordId);
                    }, $q.reject)
                    .then(response => {
                        if (type === 'ontology') {
                            return self.addOntologyToList(ontologyId, recordId, response.branchId, response.commitId, response.ontology, response.inProgressCommit);
                        } else if (type === 'vocabulary') {
                            return self.addVocabularyToList(ontologyId, recordId, response.branchId, response.commitId, response.ontology, response.inProgressCommit);
                        }
                    }, $q.reject)
                    .then(() => recordId, $q.reject);
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
             * @param {string} [type='ontology'] The type of listItem that needs to be updated.
             * @param {boolean} [upToDate=true] The flag indicating whether the ontology is upToDate or not.
             * @param {boolean} [inProgressCommit=emptyInProgressCommit] The Object containing the saved changes to apply.
             * @returns {Promise} A promise indicating the success or failure of the update.
             */
            self.updateOntology = function(recordId, branchId, commitId, type = 'ontology', upToDate = true, inProgressCommit = emptyInProgressCommit) {
                var listItem;
                return om.getOntology(recordId, branchId, commitId)
                    .then(ontology => {
                        var ontologyId = self.getListItemByRecordId(recordId).ontologyId;
                        if (type === 'ontology') {
                            return self.createOntologyListItem(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, upToDate);
                        } else if (type === 'vocabulary') {
                            return self.createVocabularyListItem(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, upToDate);
                        }
                    }, $q.reject)
                    .then(response => {
                        listItem = response;
                        return sm.updateOntologyState(recordId, branchId, commitId)
                    }, $q.reject)
                    .then(() => updateListItem(recordId, listItem), $q.reject);
            }
            self.addOntologyToList = function(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, upToDate = true) {
                return self.createOntologyListItem(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, upToDate)
                    .then(listItem => self.list.push(listItem), $q.reject);
            }
            self.addVocabularyToList = function(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, upToDate = true) {
                return self.createVocabularyListItem(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, upToDate)
                    .then(listItem => self.list.push(listItem), $q.reject);
            }
            self.createOntologyListItem = function(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit,
                upToDate = true) {
                var deferred = $q.defer();
                var listItem = setupListItem(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, 'ontology');
                $q.all([
                    om.getIris(recordId, branchId, commitId),
                    om.getImportedIris(recordId, branchId, commitId),
                    om.getClassHierarchies(recordId, branchId, commitId),
                    om.getClassesWithIndividuals(recordId, branchId, commitId),
                    om.getDataPropertyHierarchies(recordId, branchId, commitId),
                    om.getObjectPropertyHierarchies(recordId, branchId, commitId),
                    cm.getRecordBranches(recordId, catalogId)
                ]).then(response => {
                    listItem.annotations = _.unionWith(
                        _.get(response[0], 'annotationProperties'),
                        propertyManagerService.defaultAnnotations,
                        _.isMatch
                    );
                    listItem.subClasses = _.get(response[0], 'classes');
                    listItem.subDataProperties = _.get(response[0], 'dataProperties');
                    listItem.subObjectProperties = _.get(response[0], 'objectProperties');
                    listItem.individuals = _.get(response[0], 'namedIndividuals');
                    listItem.dataPropertyRange = _.unionWith(
                        _.get(response[0], 'datatypes'),
                        om.defaultDatatypes,
                        _.isMatch
                    );
                    _.forEach(response[1], iriList => {
                        listItem.annotations = _.unionWith(
                            addOntologyIdToArray(iriList.annotationProperties, iriList.id),
                            listItem.annotations,
                            compareListItems
                        );
                        listItem.subClasses = _.unionWith(
                            addOntologyIdToArray(iriList.classes, iriList.id),
                            listItem.subClasses,
                            compareListItems
                        );
                        listItem.subDataProperties = _.unionWith(
                            addOntologyIdToArray(iriList.dataProperties, iriList.id),
                            listItem.subDataProperties,
                            compareListItems
                        );
                        listItem.subObjectProperties = _.unionWith(
                            addOntologyIdToArray(iriList.objectProperties, iriList.id),
                            listItem.subObjectProperties,
                            compareListItems
                        );
                        listItem.individuals = _.unionWith(
                            addOntologyIdToArray(iriList.individuals, iriList.id),
                            listItem.individuals,
                            compareListItems
                        );
                        listItem.dataPropertyRange = _.unionWith(
                            addOntologyIdToArray(iriList.datatypes, iriList.id),
                            listItem.dataPropertyRange,
                            compareListItems
                        );
                    });
                    listItem.classHierarchy = response[2].hierarchy;
                    listItem.classIndex = response[2].index;
                    listItem.classesWithIndividuals = response[3].hierarchy;
                    listItem.classesWithIndividualsIndex = response[3].index;
                    listItem.dataPropertyHierarchy = response[4].hierarchy;
                    listItem.dataPropertyIndex = response[4].index;
                    listItem.objectPropertyHierarchy = response[5].hierarchy;
                    listItem.objectPropertyIndex = response[5].index;
                    listItem.branches = response[6].data;
                    listItem.upToDate = upToDate;
                    _.pullAllWith(
                        listItem.annotations,
                        _.concat(om.ontologyProperties, listItem.subDataProperties, listItem.subObjectProperties),
                        compareListItems
                    );
                    deferred.resolve(listItem);
                }, error => _.has(error, 'statusText') ? util.onError(response, deferred) : deferred.reject(error));
                return deferred.promise;
            }
            self.createVocabularyListItem = function(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, upToDate = true) {
                var deferred = $q.defer();
                var listItem = setupListItem(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, 'vocabulary');
                $q.all([
                    om.getIris(recordId, branchId, commitId),
                    om.getImportedIris(recordId, branchId, commitId),
                    om.getConceptHierarchies(recordId, branchId, commitId),
                    cm.getRecordBranches(recordId, catalogId)
                ]).then(response => {
                    listItem.subDataProperties = _.get(response[0], 'dataProperties');
                    listItem.subObjectProperties = _.get(response[0], 'objectProperties');
                    listItem.annotations = _.unionWith(
                        _.get(response[0], 'annotationProperties'),
                        propertyManagerService.defaultAnnotations,
                        propertyManagerService.skosAnnotations,
                        _.isMatch
                    );
                    listItem.dataPropertyRange = _.unionWith(
                        _.get(response[0], 'datatypes'),
                        om.defaultDatatypes,
                        _.isMatch
                    );
                    _.forEach(response[1], iriList => {
                        listItem.annotations = _.unionWith(
                            addOntologyIdToArray(iriList.annotationProperties, iriList.id),
                            listItem.annotations,
                            compareListItems
                        );
                        listItem.subDataProperties = _.unionWith(
                            addOntologyIdToArray(iriList.dataProperties, iriList.id),
                            listItem.subDataProperties,
                            compareListItems
                        );
                        listItem.subObjectProperties = _.unionWith(
                            addOntologyIdToArray(iriList.objectProperties, iriList.id),
                            listItem.subObjectProperties,
                            compareListItems
                        );
                    });
                    listItem.conceptHierarchy = response[2].hierarchy;
                    listItem.conceptIndex = response[2].index;
                    listItem.branches = response[3].data;
                    listItem.upToDate = upToDate;
                    _.pullAllWith(
                        listItem.annotations,
                        _.concat(om.ontologyProperties, listItem.subDataProperties, listItem.subObjectProperties,
                            angular.copy(om.conceptRelationshipList), angular.copy(om.schemeRelationshipList)),
                        compareListItems
                    );
                    deferred.resolve(listItem);
                }, error => _.has(error, 'statusText') ? util.onError(response, deferred) : deferred.reject(error));
                return deferred.promise;
            }
            /**
             * @ngdoc method
             * @name addEntity
             * @methodOf ontologyState.service:ontologyStateService
             *
             * @description
             * Adds the entity represented by the entityJSON to the ontology with the provided ontology ID in the
             * MatOnto repository. Adds the new entity to the index.
             *
             * @param {Object[]} listItem The listItem linked to the ontology you want to add the entity to.
             * @param {string} entityJSON The JSON-LD representation for the entity you want to add to the ontology.
             */
            self.addEntity = function(listItem, entityJSON) {
                listItem.ontology.push(entityJSON);
                _.get(listItem, 'index', {})[entityJSON['@id']] = {
                    position: listItem.ontology.length - 1,
                    label: om.getEntityName(entityJSON, listItem.type)
                }
            }
            /**
             * @ngdoc method
             * @name removeEntity
             * @methodOf ontologyState.service:ontologyStateService
             *
             * @description
             * Removes the entity with the provided IRI from the ontology with the provided ontology ID in the MatOnto
             * repository. Removes the entityIRI from the index. Returns the entity Object.
             *
             * @param {Object[]} listItem The listItem linked to the ontology you want to remove the entity from.
             * @returns {Object} An Object which represents the requested entity.
             */
            self.removeEntity = function(listItem, entityIRI) {
                var entityPosition = _.get(listItem.index, entityIRI + '.position');
                _.unset(listItem.index, entityIRI);
                _.forOwn(listItem.index, (value, key) => {
                    if (value.position > entityPosition) {
                        listItem.index[key].position = value.position - 1;
                    }
                });
                return _.remove(listItem.ontology, {matonto:{originalIRI: entityIRI}})[0];
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
                return _.find(self.list, {recordId});
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
             * Gets entity with the provided IRI from the ontology linked to the provided recordId in the MatOnto
             * repository. Returns the entity Object.
             *
             * @param {string} recordId The recordId linked to the ontology you want to check.
             * @param {string} entityIRI The IRI of the entity that you want.
             * @returns {Object} An Object which represents the requested entity.
             */
            self.getEntityByRecordId = function(recordId, entityIRI) {
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
                return _.get(listItem, "index['" + entityIRI + "'].label", utilService.getBeautifulIRI(entityIRI));
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
                        if (errorMessage === 'User has no InProgressCommit') {
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
             * Used to open an ontology from the MatOnto repository. It calls
             * {@link ontologyState.service:ontologyStateService#getOntology getOntology} to get the specified
             * ontology from the MatOnto repository. Returns a promise.
             *
             * @param {string} recordId The record ID of the requested ontology.
             * @returns {Promise} A promise with the ontology ID or error message.
             */
            self.openOntology = function(recordId, type = 'ontology') {
                var branchId, commitId, ontology, inProgressCommit, ontologyId;
                return self.getOntology(recordId)
                    .then(response => {
                        branchId = response.branchId;
                        commitId = response.commitId;
                        ontology = response.ontology;
                        inProgressCommit = response.inProgressCommit;
                        return cm.getBranchHeadCommit(branchId, recordId, catalogId);
                    }, $q.reject)
                    .then(headCommit => {
                        var headId = _.get(headCommit, "commit['@id']", '');
                        var upToDate = headId === commitId;
                        ontologyId = om.getOntologyIRI(ontology);
                        if (type === 'ontology') {
                            return self.addOntologyToList(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, upToDate);
                        } else if (type === 'vocabulary') {
                            return self.addVocabularyToList(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, upToDate);
                        }
                    }, $q.reject)
                    .then(() => ontologyId, $q.reject);
            }
            /**
             * @ngdoc method
             * @name closeOntology
             * @methodOf ontologyState.service:ontologyStateService
             *
             * @description
             * Used to close an ontology from the MatOnto application. It removes the ontology list item from the
             * {@link ontologyState.service:ontologyStateService#list list}.
             *
             * @param {string} recordId The record ID of the requested ontology.
             */
            self.closeOntology = function(recordId) {
                _.remove(self.list, {recordId});
            }
            self.removeBranch = function(recordId, branchId) {
                _.remove(self.getListItemByRecordId(recordId).branches, {'@id': branchId});
            }
            self.afterSave = function() {
                return cm.getInProgressCommit(self.listItem.recordId, catalogId)
                    .then(inProgressCommit => {
                        self.listItem.inProgressCommit = inProgressCommit;

                        self.listItem.additions = [];
                        self.listItem.deletions = [];

                        _.forOwn(self.state, (value, key) => {
                            _.unset(value, 'usages');
                        });

                        if (_.isEmpty(sm.getOntologyStateByRecordId(self.listItem.recordId))) {
                            return sm.createOntologyState(self.listItem.recordId, self.listItem.branchId, self.listItem.commitId);
                        } else {
                            return sm.updateOntologyState(self.listItem.recordId, self.listItem.branchId, self.listItem.commitId);
                        }
                    }, $q.reject);
            }
            self.clearInProgressCommit = function() {
                _.set(self.listItem, 'inProgressCommit.additions', []);
                _.set(self.listItem, 'inProgressCommit.deletions', []);
            }
            self.setOpened = function(pathString, isOpened) {
                _.set(self.state, getOpenPath(pathString, 'isOpened'), isOpened);
            }
            self.getOpened = function(pathString) {
                return _.get(self.state, getOpenPath(pathString, 'isOpened'), false);
            }
            self.setNoDomainsOpened = function(recordId, isOpened) {
                _.set(self.state, getOpenPath(recordId, 'noDomainsOpened'), isOpened);
            }
            self.getNoDomainsOpened = function(recordId) {
                return _.get(self.state, getOpenPath(recordId, 'noDomainsOpened'), false);
            }
            self.setIndividualsOpened = function(recordId, classIRI, isOpened) {
                _.set(self.state, getOpenPath(recordId, classIRI, 'individualsOpened'), isOpened);
            }
            self.getIndividualsOpened = function(recordId, classIRI) {
                return _.get(self.state, getOpenPath(recordId, classIRI, 'individualsOpened'), false);
            }
            self.setDataPropertiesOpened = function(recordId, isOpened) {
                _.set(self.state, getOpenPath(recordId, 'dataPropertiesOpened'), isOpened);
            }
            self.getDataPropertiesOpened = function(recordId) {
                return _.get(self.state, getOpenPath(recordId, 'dataPropertiesOpened'), false);
            }
            self.setObjectPropertiesOpened = function(recordId, isOpened) {
                _.set(self.state, getOpenPath(recordId, 'objectPropertiesOpened'), isOpened);
            }
            self.getObjectPropertiesOpened = function(recordId) {
                return _.get(self.state, getOpenPath(recordId, 'objectPropertiesOpened'), false);
            }
            self.setAnnotationPropertiesOpened = function(recordId, isOpened) {
                _.set(self.state, getOpenPath(recordId, 'annotationPropertiesOpened'), isOpened);
            }
            self.getAnnotationPropertiesOpened = function(recordId) {
                return _.get(self.state, getOpenPath(recordId, 'annotationPropertiesOpened'), false);
            }
            self.onEdit = function(iriBegin, iriThen, iriEnd) {
                var newIRI = iriBegin + iriThen + iriEnd;
                var oldEntity = $filter('removeMatonto')(self.selected);
                self.getActivePage().entityIRI = newIRI;
                if (_.some(self.listItem.additions, oldEntity)) {
                    _.remove(self.listItem.additions, oldEntity);
                    updateRefsService.update(self.listItem, self.selected['@id'], newIRI);
                } else {
                    updateRefsService.update(self.listItem, self.selected['@id'], newIRI);
                    self.addToDeletions(self.listItem.recordId, oldEntity);
                }
                if (self.getActiveKey() !== 'project') {
                    self.setCommonIriParts(iriBegin, iriThen);
                }
                self.addToAdditions(self.listItem.recordId, $filter('removeMatonto')(self.selected));
                return om.getEntityUsages(self.listItem.recordId, self.listItem.branchId, self.listItem.commitId, oldEntity['@id'], 'construct')
                    .then(statements => {
                        _.forEach(statements, statement => self.addToDeletions(self.listItem.recordId, statement));
                        updateRefsService.update(statements, oldEntity['@id'], newIRI);
                        _.forEach(statements, statement => self.addToAdditions(self.listItem.recordId, statement));
                    }, errorMessage => util.createErrorToast('Associated entities were not updated due to an internal error.'));
            }
            self.setCommonIriParts = function(iriBegin, iriThen) {
                _.set(self.listItem, 'iriBegin', iriBegin);
                _.set(self.listItem, 'iriThen', iriThen);
            }
            self.setSelected = function(entityIRI, getUsages = true) {
                self.selected = self.getEntityByRecordId(self.listItem.recordId, entityIRI);
                if (getUsages && !_.has(self.getActivePage(), 'usages') && self.selected) {
                    self.setEntityUsages(entityIRI);
                }
            }
            self.setEntityUsages = function(entityIRI) {
                var page = self.getActivePage();
                var id = 'usages-' + self.getActiveKey() + '-' + self.listItem.recordId;
                httpService.cancel(id, false);
                om.getEntityUsages(self.listItem.recordId, self.listItem.branchId, self.listItem.commitId, entityIRI, 'select', id)
                    .then(bindings => _.set(page, 'usages', bindings),
                        response => _.set(page, 'usages', []));
            }
            self.addState = function(recordId, entityIRI, type) {
                var tabs = {};
                var newState = {
                    recordId,
                    active: false,
                    type
                }
                if (type === 'ontology') {
                    tabs = {
                        project: {
                            active: true,
                            entityIRI: entityIRI
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
                        search: {
                            active: false
                        }
                    }
                } else if (type === 'vocabulary') {
                    tabs = {
                        project: {
                            active: true,
                            entityIRI: entityIRI
                        },
                        concepts: {
                            active: false
                        },
                        search: {
                            active: false
                        }
                    }
                }
                _.merge(newState, tabs);
                self.states.push(newState);
            }
            self.setState = function(recordId, getUsages = false) {
                self.state.active = false;
                if (!recordId) {
                    self.state = self.newState;
                } else {
                    self.state = _.find(self.states, {recordId});
                    self.listItem = self.getListItemByRecordId(recordId);
                    self.setSelected(self.getActiveEntityIRI(), self.getActiveKey() === 'project' ? false : getUsages);
                }
                self.state.active = true;
            }
            self.getState = function(recordId) {
                return recordId ? _.find(self.states, {recordId}) : self.newState;
            }
            self.deleteState = function(recordId) {
                if (self.state.recordId === recordId) {
                    self.state = self.newState;
                    self.state.active = true;
                    self.selected = undefined;
                }
                _.remove(self.states, {recordId});
            }
            self.resetStateTabs = function() {
                _.forOwn(self.state, (value, key) => {
                    if (key !== 'project') {
                        _.unset(value, 'entityIRI');
                    }
                    _.unset(value, 'usages');
                });
                if (self.getActiveKey() !== 'project') {
                    self.selected = undefined;
                }
            }
            self.getActiveKey = function() {
                return _.findKey(self.state, ['active', true]) || 'project';
            }
            self.getActivePage = function() {
                return self.state[self.getActiveKey()];
            }
            self.setActivePage = function(key) {
                if (_.has(self.state, key)) {
                    self.getActivePage().active = false;
                    self.state[key].active = true;
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
                self.selected = undefined;
            }
            self.hasChanges = function(recordId) {
                var listItem = self.getListItemByRecordId(recordId);
                return !!_.get(listItem, 'additions', []).length || !!_.get(listItem, 'deletions', []).length;
            }
            self.isCommittable = function(recordId) {
                var listItem = self.getListItemByRecordId(recordId);
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
            self.goTo = function(iri) {
                var entity = self.getEntityByRecordId(self.listItem.recordId, iri);
                if (self.state.type === 'vocabulary') {
                    commonGoTo('concepts', iri, 'conceptIndex', 'conceptHierarchy');
                } else if (om.isClass(entity)) {
                    commonGoTo('classes', iri, 'classIndex', 'classHierarchy');
                } else if (om.isDataTypeProperty(entity)) {
                    commonGoTo('properties', iri, 'dataPropertyIndex', 'dataPropertyHierarchy');
                    self.setDataPropertiesOpened(self.listItem.recordId, true);
                } else if (om.isObjectProperty(entity)) {
                    commonGoTo('properties', iri, 'objectPropertyIndex', 'objectPropertyHierarchy');
                    self.setObjectPropertiesOpened(self.listItem.recordId, true);
                } else if (om.isAnnotation(entity)) {
                    commonGoTo('properties', iri);
                    self.setAnnotationPropertiesOpened(self.listItem.recordId, true);
                } else if (om.isIndividual(entity)) {
                    commonGoTo('individuals', iri);
                } else if (om.isOntology(entity)) {
                    commonGoTo('project', iri);
                }
            }
            self.openAt = function(pathsArray) {
                var selectedPath = _.find(pathsArray, path => {
                    var pathString = self.listItem.recordId;
                    return _.every(_.initial(path), pathPart => {
                        pathString += '.' + pathPart;
                        return self.getOpened(pathString);
                    });
                });
                if (!selectedPath) {
                    selectedPath = _.head(pathsArray);
                    var pathString = self.listItem.recordId;
                    _.forEach(_.initial(selectedPath), pathPart => {
                        pathString += '.' + pathPart;
                        self.setOpened(pathString, true);
                    });
                }
                $timeout(function() {
                    var $element = document.querySelectorAll('[data-path-to="' + self.listItem.recordId + '.'
                        + _.join(selectedPath, '.') + '"]');
                    var $hierarchyBlock = document.querySelectorAll('[class*=hierarchy-block] .block-content');
                    if ($element.length && $hierarchyBlock.length) {
                        $hierarchyBlock[0].scrollTop = $element[0].offsetTop;
                    }
                });
            }
            self.getDefaultPrefix = function() {
                return _.replace(_.get(self.listItem, 'iriBegin', self.listItem.ontologyId), '#', '/') + _.get(self.listItem, 'iriThen', '#');
            }

            /* Private helper functions */
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
            function commonGoTo(key, iri, index, hierarchy) {
                self.setActivePage(key);
                self.selectItem(iri);
                if (index) {
                    self.openAt(self.getPathsTo(self.listItem[hierarchy], self.listItem[index], iri));
                }
            }
            function getOpenPath() {
                return _.join(_.map([...arguments], encodeURIComponent), '.');
            }
            function setupListItem(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, type) {
                var listItem = (type === 'ontology') ? angular.copy(ontologyListItemTemplate) : angular.copy(vocabularyListItemTemplate);
                var blankNodes = {};
                var index = {};
                _.forEach(ontology, (entity, i) => {
                    if (_.has(entity, '@id')) {
                        _.set(entity, 'matonto.originalIRI', entity['@id']);
                        index[entity['@id']] = {
                            position: i,
                            label: om.getEntityName(entity, type)
                        }
                    } else {
                        _.set(entity, 'matonto.anonymous', ontologyId + ' (Anonymous Ontology)');
                    }
                    if (om.isProperty(entity)) {
                        _.set(entity, 'matonto.icon', getIcon(entity));
                    } else if (om.isBlankNode(entity)) {
                        let id = _.get(entity, '@id');
                        _.set(blankNodes, id, mc.jsonldToManchester(id, ontology, true));
                    }
                });
                listItem.ontologyId = ontologyId;
                listItem.recordId = recordId;
                listItem.branchId = branchId;
                listItem.commitId = commitId;
                listItem.ontology = ontology;
                listItem.blankNodes = blankNodes;
                listItem.index = index;
                listItem.inProgressCommit = inProgressCommit;
                return listItem;
            }
            function updateListItem(recordId, newListItem) {
                var oldListItem = self.getListItemByRecordId(recordId);
                _.assign(oldListItem, newListItem);
            }
            function addOntologyIdToArray(arr, ontologyId) {
                return _.forEach(arr, item => _.set(item, 'ontologyId', ontologyId));
            }
            function getIcon(property) {
                var range = _.get(property, prefixes.rdfs + 'range');
                var icon = 'fa-square-o';
                if (range) {
                    if (range.length === 1) {
                        switch(range[0]['@id']) {
                            case prefixes.xsd + 'string':
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
                var index = _.get(listItem, 'index');
                var ontology = _.get(listItem, 'ontology');
                if (_.has(index, entityIRI + '.position')) {
                    return ontology[index[entityIRI].position];
                } else {
                    return om.getEntity(ontology, entityIRI);
                }
            }
            function addToInProgress(recordId, json, prop) {
                var listItem = self.getListItemByRecordId(recordId);
                var entity = _.find(listItem[prop], {'@id': json['@id']});
                var filteredJson = $filter('removeMatonto')(json);
                if (entity) {
                    _.mergeWith(entity, filteredJson, util.mergingArrays);
                } else  {
                    listItem[prop].push(filteredJson);
                }
            }
            function compareListItems(obj1, obj2) {
                return _.isEqual(_.get(obj1, 'localName'), _.get(obj2, 'localName'))
                    && _.isEqual(_.get(obj1, 'namespace'), _.get(obj2, 'namespace'));
            }
        }
})();

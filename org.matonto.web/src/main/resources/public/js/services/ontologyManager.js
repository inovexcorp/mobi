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
         * @name ontologyManager
         *
         * @description
         * The `ontologyManager` module only provides the `ontologyManagerService` service which
         * provides access to the MatOnto ontology REST endpoints and utility functions for
         * manipulating ontologies
         */
        .module('ontologyManager', [])
        /**
         * @ngdoc service
         * @name ontologyManager.service:ontologyManagerService
         * @requires $window
         * @requires $http
         * @requires $q
         * @requires $timeout
         * @requires $filter
         * @requires prefixes.service:prefixes
         * @requires propertyManager.service:propertyManagerService
         * @requires catalogManager.service:catalogManagerService
         * @requires util.service:utilService
         * @requires stateManager.service:stateManagerService
         *
         * @description
         * `ontologyManagerService` is a service that provides access to the MatOnto ontology REST
         * endpoints and utility functions for editing/creating ontologies and accessing
         * various entities within the ontology.
         */
        .service('ontologyManagerService', ontologyManagerService);

        ontologyManagerService.$inject = ['$window', '$http', '$q', '$timeout', '$filter', 'prefixes',
            'propertyManagerService', 'catalogManagerService', 'utilService', 'stateManagerService'];

        function ontologyManagerService($window, $http, $q, $timeout, $filter, prefixes,
            propertyManagerService, catalogManagerService, utilService, stateManagerService) {
            var self = this;
            var prefix = '/matontorest/ontologies';
            var defaultDatatypes = _.map(['anyURI', 'boolean', 'byte', 'dateTime', 'decimal', 'double', 'float', 'int',
                'integer', 'language', 'long', 'string'], function(item) {
                return {
                    'namespace': prefixes.xsd,
                    'localName': item
                }
            });
            var ontologyListItemTemplate = {
                ontology: [],
                ontologyId: '',
                annotations: angular.copy(propertyManagerService.defaultAnnotations),
                dataPropertyRange: defaultDatatypes,
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
                upToDate: true
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
                upToDate: true
            };
            var emptyInProgressCommit = {
                additions: [],
                deletions: []
            };
            var cm = catalogManagerService;
            var sm = stateManagerService;
            var util = utilService;
            var catalogId = '';

            /**
             * @ngdoc property
             * @name ontologyRecords
             * @propertyOf ontologyManager.service:ontologyManagerService
             * @type {Object[]}
             *
             * @description
             * 'ontologyRecords' holds an array of ontology record objects which contain properties for the metadata
             * associated with that record.
             */
            self.ontologyRecords = [];
            /**
             * @ngdoc property
             * @name list
             * @propertyOf ontologyManager.service:ontologyManagerService
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
            /**
             * @ngdoc property
             * @name propertyTypes
             * @propertyOf ontologyManager.service:ontologyManagerService
             * @type {string[]}
             *
             * @description
             * `propertyTypes` holds an array of the property types available to be added to the property entities
             * within the ontology.
             */
            self.propertyTypes = [
                prefixes.owl + 'DatatypeProperty',
                prefixes.owl + 'ObjectProperty'
            ];
            /**
             * @ngdoc property
             * @name ontologyProperties
             * @propertyOf ontologyManager.service:ontologyManagerService
             * @type {Object[]}
             *
             * @description
             * `ontologyProperties` holds an array of the property types available to be added to the ontology entity
             * within the ontology.
             */
            self.ontologyProperties = _.map(['priorVersion', 'backwardCompatibleWith', 'incompatibleWith'], item => {
                return {
                    'namespace': prefixes.owl,
                    'localName': item
                }
            });
            /**
             * @ngdoc property
             * @name conceptRelationshipList
             * @propertyOf ontologyManager.service:ontologyManagerService
             * @type {Object[]}
             *
             * @description
             * `conceptRelationshipList` holds an array of the relationships that skos:Concepts can have with other
             * entities.
             */
            var conceptListRelationships = _.map(['broaderTransitive', 'broader', 'broadMatch', 'narrowerTransitive',
                'narrower', 'narrowMatch', 'related', 'relatedMatch', 'semanticRelation', 'mappingRelation',
                'closeMatch', 'exactMatch'], item => {
                    return {
                        namespace: prefixes.skos,
                        localName: item,
                        values: 'conceptList'
                    }
                });
            self.conceptRelationshipList = _.concat(
                conceptListRelationships,
                [{
                    namespace: prefixes.skos,
                    localName: 'inScheme',
                    values: 'schemeList'
                }]
            );
            /**
             * @ngdoc property
             * @name schemeRelationshipList
             * @propertyOf ontologyManager.service:ontologyManagerService
             * @type {Object[]}
             *
             * @description
             * `schemeRelationshipList` holds an array of the relationships that skos:ConceptSchemes can have with other
             * entities.
             */
            self.schemeRelationshipList = [{
                namespace: prefixes.skos,
                localName: 'hasTopConcept',
                values: 'conceptList'
            }];
            /**
             * @ngdoc method
             * @name reset
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Resets all state variables.
             */
            self.reset = function() {
                self.ontologyRecords = [];
                self.list = [];
            }
            /**
             * @ngdoc method
             * @name initialize
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Initializes the `catalogId` variable.
             */
            self.initialize = function() {
                catalogId = _.get(cm.localCatalog, '@id', '');
            }
            /**
             * @ngdoc method
             * @name getAllOntologyRecords
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets a list of all the OntologyRecords in the catalog by utilizing the `catalogManager`. Returns a
             * promise with an array of the OntologyRecords.
             *
             * @param {Object} sortingOption An object describing the order for the OntologyRecords.
             * @returns {Promise} A promise with an array of the OntologyRecords.
             */
            self.getAllOntologyRecords = function(sortingOption) {
                var deferred = $q.defer();
                getAllRecords(sortingOption)
                    .then(response => deferred.resolve(response.data), deferred.reject);
                return deferred.promise;
            }
            /**
             * @ngdoc method
             * @name uploadFile
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the POST /matontorest/ontologies endpoint which uploads an ontology to the MatOnto repository
             * with the file provided. This creates a new OntologyRecord associated with this ontology. Returns a
             * promise indicating whether the ontology was persisted.
             *
             * @param {File} file The ontology file.
             * @param {string} title The record title.
             * @param {string} description The record description.
             * @param {string} keywords The record list of keywords separated by commas.
             * @returns {Promise} A promise indicating whether the ontology was persisted.
             */
            self.uploadFile = function(file, title, description, keywords) {
                var fd = new FormData(),
                    config = {
                        transformRequest: angular.identity,
                        headers: {
                            'Content-Type': undefined
                        }
                    };
                fd.append('file', file);
                fd.append('title', title);
                if (description) {
                    fd.append('description', description);
                }
                if (keywords) {
                    fd.append('keywords', keywords);
                }
                return $http.post(prefix, fd, config);
            }
            /**
             * @ngdoc method
             * @name getOntology
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the GET /matontorest/ontologies/{recordId} endpoint which gets an ontology from the MatOnto
             * repository with the JSON-LD ontology string provided. Returns a promise which includes the serialized
             * ontology.
             *
             * @param {string} recordId The record ID of the ontology you want to get from the repository.
             * @param {string} [rdfFormat='jsonld'] The format string to identify the serialization requested.
             * @returns {Promise} A promise containing the ontology id, record id, branch id, commit id,
             *                    inProgressCommit, and JSON-LD serialization of the ontology.
             */
            self.getOntology = function(recordId, rdfFormat = 'jsonld') {
                var branchId, commitId;
                var state = sm.getOntologyStateByRecordId(recordId);
                var deferred = $q.defer();
                var getLatest = function() {
                    cm.getRecordMasterBranch(recordId, catalogId)
                        .then(masterBranch => {
                            branchId = _.get(masterBranch, '@id', '');
                            return cm.getBranchHeadCommit(branchId, recordId, catalogId);
                        }, $q.reject)
                        .then(headCommit => {
                            commitId = _.get(headCommit, "commit['@id']", '');
                            return sm.createOntologyState(recordId, branchId, commitId);
                        }, $q.reject)
                        .then(() => cm.getResource(commitId, branchId, recordId, catalogId, false, rdfFormat), $q.reject)
                        .then(ontology => resolve(ontology, emptyInProgressCommit), deferred.reject);
                }
                if (!_.isEmpty(state)) {
                    var inProgressCommit = emptyInProgressCommit;
                    branchId = _.get(state, "model[0]['" + prefixes.ontologyState + "branch'][0]['@id']");
                    commitId = _.get(state, "model[0]['" + prefixes.ontologyState + "commit'][0]['@id']");
                    cm.getInProgressCommit(recordId, catalogId)
                        .then(response => {
                            inProgressCommit = response;
                            return cm.getResource(commitId, branchId, recordId, catalogId, true, rdfFormat)
                        }, errorMessage => {
                            if (errorMessage === 'User has no InProgressCommit') {
                                return cm.getResource(commitId, branchId, recordId, catalogId, false, rdfFormat);
                            }
                            return $q.reject();
                        })
                        .then(ontology => resolve(ontology, inProgressCommit), () => sm.deleteOntologyState(recordId, branchId, commitId).then(getLatest, deferred.reject));
                } else {
                    getLatest();
                }
                var resolve = function(ontology, inProgressCommit) {
                    deferred.resolve({ontology, recordId, branchId, commitId, inProgressCommit});
                }
                return deferred.promise;
            }
            /**
             * @ngdoc method
             * @name uploadThenGet
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the POST /matontorest/ontologies endpoint which uploads an ontology to the MatOnto repository
             * with the file provided and then calls
             * {@link ontologyManager.service:ontologyManagerService#getOntology getOntology} to get the ontology they
             * just uploaded. Returns a promise.
             *
             * @param {File} file The ontology file.
             * @param {string} title The record title.
             * @param {string} description The record description.
             * @param {string} keywords The record list of keywords separated by commas.
             * @param {string} type The type identifier for the file uploaded.
             * @returns {Promise} A promise with the ontology ID or error message.
             */
            self.uploadThenGet = function(file, title, description, keywords, type = 'ontology') {
                var deferred = $q.defer();
                var onUploadSuccess = function(ontologyId, recordId) {
                    self.getOntology(recordId)
                        .then(response => {
                            if (type === 'ontology') {
                                self.addOntologyToList(ontologyId, recordId, response.branchId, response.commitId,
                                    response.ontology, response.inProgressCommit)
                                        .then(() => deferred.resolve(recordId), deferred.reject);
                            } else if (type === 'vocabulary') {
                                self.addVocabularyToList(ontologyId, recordId, response.branchId, response.commitId,
                                    response.ontology, response.inProgressCommit)
                                        .then(() => deferred.resolve(recordId), deferred.reject);
                            }
                        }, deferred.reject);
                };
                self.uploadFile(file, title, description, keywords)
                    .then(response => onUploadSuccess(response.data.ontologyId, response.data.recordId),
                        deferred.reject);
                return deferred.promise;
            }
            /**
             * @ngdoc method
             * @name updateOntology
             * @methodOf ontologyManager.service:ontologyManagerService
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
             * @returns {Promise} A promise indicating the success or failure of the update.
             */
            self.updateOntology = function(recordId, branchId, commitId, type = 'ontology', upToDate = true) {
                var listItem;
                var deferred = $q.defer();
                cm.getResource(commitId, branchId, recordId, catalogId, false)
                    .then(ontology => {
                        var ontologyId = self.getListItemByRecordId(recordId).ontologyId;
                        if (type === 'ontology') {
                            return self.createOntologyListItem(ontologyId, recordId, branchId, commitId, ontology, emptyInProgressCommit, upToDate);
                        } else if (type === 'vocabulary') {
                            return self.createVocabularyListItem(ontologyId, recordId, branchId, commitId, ontology, emptyInProgressCommit, upToDate);
                        }
                    }, $q.reject)
                    .then(response => {
                        listItem = response;
                        return sm.updateOntologyState(recordId, branchId, commitId)
                    }, $q.reject)
                    .then(() => {
                        updateListItem(recordId, listItem);
                        deferred.resolve();
                    }, deferred.reject);
                return deferred.promise;
            }
            /**
             * @ngdoc method
             * @name openOntology
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Used to open an ontology from the MatOnto repository. It calls
             * {@link ontologyManager.service:ontologyManagerService#getOntology getOntology} to get the specified
             * ontology from the MatOnto repository. Returns a promise.
             *
             * @param {string} recordId The record ID of the requested ontology.
             * @returns {Promise} A promise with the ontology ID or error message.
             */
            self.openOntology = function(recordId, type = 'ontology') {
                var branchId, commitId, ontology, inProgressCommit, ontologyId;
                var deferred = $q.defer();
                self.getOntology(recordId)
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
                        ontologyId = self.getOntologyIRI(ontology);
                        if (type === 'ontology') {
                            return self.addOntologyToList(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, upToDate);
                        } else if (type === 'vocabulary') {
                            return self.addVocabularyToList(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, upToDate);
                        }
                    }, $q.reject)
                    .then(() => deferred.resolve(ontologyId), deferred.reject);
                return deferred.promise;
            }
            /**
             * @ngdoc method
             * @name closeOntology
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Used to close an ontology from the MatOnto application. It removes the ontology list item from the
             * {@link ontologyManager.service:ontologyManagerService#list list}.
             *
             * @param {string} recordId The record ID of the requested ontology.
             */
            self.closeOntology = function(recordId) {
                _.remove(self.list, {recordId});
            }
            self.removeBranch = function(recordId, branchId) {
                _.remove(self.getListItemByRecordId(recordId).branches, {'@id': branchId});
            }
            /**
             * @ngdoc method
             * @name getPreview
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Used to get the string representation of the requested serialization of the ontology. It calls
             * {@link ontologyManager.service:ontologyManagerService#getOntology getOntology} to get the specified
             * ontology from the MatOnto repository. Returns a promise with the string representation of the ontology.
             *
             * @param {string} recordId The record ID of the requested ontology.
             * @param {string} [rdfFormat='jsonld'] The format string to identify the serialization requested.
             * @returns {Promise} A promise with the string representation of the ontology.
             */
            self.getPreview = function(recordId, rdfFormat = 'jsonld') {
                var deferred = $q.defer();
                self.getOntology(recordId, rdfFormat)
                    .then(response => deferred.resolve((rdfFormat === 'jsonld') ? $filter('json')(response.ontology)
                            : response.ontology), deferred.reject);
                return deferred.promise;
            }
            /**
             * @ngdoc method
             * @name saveChanges
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Saves all changes to the ontology with the specified ontology ID. It calls the POST
             * /matontorest/ontology/{recordId} for each of the unsaved entities. Returns a promise with the new
             * ontology ID.
             *
             * @param {string} recordId The record ID of the requested ontology.
             * @param {Object[]} unsavedEntities The array of ontology entities with unsaved changes.
             * @returns {Promise} A promise with the ontology ID.
             */
            self.saveChanges = function(recordId, differenceObj) {
                var deferred = $q.defer();
                var onSuccess = function() {
                    cm.updateInProgressCommit(recordId, catalogId, differenceObj)
                        .then(deferred.resolve, deferred.reject);
                }
                cm.getInProgressCommit(recordId, catalogId)
                    .then(onSuccess, errorMessage => {
                        if (errorMessage === 'User has no InProgressCommit') {
                            cm.createInProgressCommit(recordId, catalogId)
                                .then(onSuccess, deferred.reject);
                        } else {
                            deferred.reject(errorMessage);
                        }
                    });
                return deferred.promise;
            }
            self.addToAdditions = function(recordId, json) {
                addToInProgress(recordId, json, 'additions');
            }
            self.addToDeletions = function(recordId, json) {
                addToInProgress(recordId, json, 'deletions');
            }
            /**
             * @ngdoc method
             * @name getListItemByRecordId
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the associated object from the {@link ontologyManager.service:ontologyManagerService#list list} that
             * contains the requested record ID. Returns the list item.
             *
             * @param {string} recordId The record ID of the requested ontology.
             * @returns {Object} The associated Object from the
             * {@link ontologyManager.service:ontologyManagerService#list list}.
             */
            self.getListItemByRecordId = function(recordId) {
                return _.find(self.list, {recordId});
            }
            /**
             * @ngdoc method
             * @name getOntologyByRecordId
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the ontology from the {@link ontologyManager.service:ontologyManagerService#list list} using the
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
             * @name isOntology
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks if the provided entity is an owl:Ontology entity. Returns a boolean.
             *
             * @param {Object} entity The entity you want to check.
             * @returns {boolean} Returns true if it is an owl:Ontology entity, otherwise returns false.
             */
            self.isOntology = function(entity) {
                return _.includes(_.get(entity, '@type', []), prefixes.owl + 'Ontology');
            }
            /**
             * @ngdoc method
             * @name hasOntologyEntity
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks if the provided ontology contains an ontology entity. Returns a boolean.
             *
             * @param {Object[]} ontology The ontology to search through.
             * @returns {boolean} Returns true if it finds an entity with @type owl:Ontology entity, otherwise returns
             * false.
             */
            self.hasOntologyEntity = function(ontology) {
                return _.some(ontology, entity => self.isOntology(entity));
            }
            /**
             * @ngdoc method
             * @name getOntologyEntity
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the ontology entity from the provided ontology. Returns an Object.
             *
             * @param {Object[]} ontology The ontology to search through.
             * @returns {Object} Returns the ontology entity.
             */
            self.getOntologyEntity = function(ontology) {
                return _.find(ontology, entity => self.isOntology(entity));
            }
            /**
             * @ngdoc method
             * @name getOntologyIRI
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the ontology entity IRI from the provided ontology. Returns a string representing the ontology IRI.
             *
             * @param {Object[]} ontology The ontology to search through.
             * @returns {Object} Returns the ontology entity IRI.
             */
            self.getOntologyIRI = function(ontology) {
                var entity = self.getOntologyEntity(ontology);
                return _.get(entity, '@id', _.get(entity, 'matonto.originalIRI', _.get(entity, 'matonto.anonymous', '')));
            }
            /**
             * @ngdoc method
             * @name createOntology
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the POST /matontorest/ontologies endpoint which uploads an ontology to the MatOnto repository
             * with the JSON-LD ontology string provided. Creates a new OntologyRecord for the associated ontology.
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
                var deferred = $q.defer();
                var config = {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    params: {title}
                };
                if (description) {
                    config.params.description = description;
                }
                if (keywords) {
                    config.params.keywords = keywords;
                }
                $http.post(prefix, ontologyJson, config)
                    .then(response => {
                        var listItem = {};
                        if (type === 'ontology') {
                            listItem = setupListItem(response.data.ontologyId, response.data.recordId,
                                response.data.branchId, response.data.commitId, [ontologyJson], emptyInProgressCommit,
                                ontologyListItemTemplate);
                        } else if (type === 'vocabulary') {
                            listItem = setupListItem(response.data.ontologyId, response.data.recordId,
                                response.data.branchId, response.data.commitId, [ontologyJson], emptyInProgressCommit,
                                vocabularyListItemTemplate);
                        }
                        cm.getRecordBranch(response.data.branchId, response.data.recordId, catalogId)
                            .then(branch => {
                                listItem.branches = [branch];
                                self.list.push(listItem);
                                deferred.resolve({
                                    entityIRI: ontologyJson['@id'],
                                    recordId: response.data.recordId,
                                    branchId: response.data.branchId,
                                    commitId: response.data.commitId
                                });
                            }, deferred.reject);
                    }, response => util.onError(response, deferred));
                return deferred.promise;
            }
            /**
             * @ngdoc method
             * @name isClass
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks if the provided entity is an owl:Class entity. Returns a boolean.
             *
             * @param {Object} entity The entity you want to check.
             * @returns {boolean} Returns true if it is an owl:Class entity, otherwise returns false.
             */
            self.isClass = function(entity) {
                return _.includes(_.get(entity, '@type', []), prefixes.owl + 'Class');
            }
            /**
             * @ngdoc method
             * @name hasClasses
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks if the provided ontology contains any owl:Class entities. Returns a boolean.
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {boolean} Returns true if there are any owl:Class entities in the ontology, otherwise returns
             * false.
             */
            self.hasClasses = function(ontology) {
                return _.some(ontology, entity => self.isClass(entity) && !self.isBlankNode(entity));
            }
            /**
             * @ngdoc method
             * @name getClasses
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the list of all owl:Class entities within the provided ontology that are not blank nodes. Returns
             * an Object[].
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {Object[]} An array of all owl:Class entities within the ontology.
             */
            self.getClasses = function(ontology) {
                return _.filter(ontology, entity => self.isClass(entity) && !self.isBlankNode(entity));
            }
            /**
             * @ngdoc method
             * @name getClassIRIs
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the list of all owl:Class entity IRIs within the provided ontology that are not blank nodes. Returns
             * an string[].
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {string[]} An array of all owl:Class entity IRI strings within the ontology.
             */
            self.getClassIRIs = function(ontology) {
                return _.map(self.getClasses(ontology), 'matonto.originalIRI');
            }
            /**
             * @ngdoc method
             * @name hasClassProperties
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks to see if the class within the provided ontology has an properties associated it via the
             * rdfs:domain axiom. Returns a boolean indicating the existence of those properties.
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @param {string} classIRI The class IRI of the class you want to check about.
             * @returns {boolean} Returns true if it does have properties, otherwise returns false.
             */
            self.hasClassProperties = function(ontology, classIRI) {
                return _.some(ontology, {[prefixes.rdfs + 'domain']: [{'@id': classIRI}]});
            }
            /**
             * @ngdoc method
             * @name getClassProperties
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the properties associated with the class within the provided ontology by the rdfs:domain axiom.
             * Returns an array of all the properties associated with the provided class IRI.
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @param {string} classIRI The class IRI of the class you want to check about.
             * @returns {Object[]} Returns an array of all the properties associated with the provided class IRI.
             */
            self.getClassProperties = function(ontology, classIRI) {
                return _.filter(ontology, {[prefixes.rdfs + 'domain']: [{'@id': classIRI}]});
            }
            /**
             * @ngdoc method
             * @name getClassProperties
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the property IRIs associated with the class within the provided ontology by the rdfs:domain axiom.
             * Returns an array of all the property IRIs associated with the provided class IRI.
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @param {string} classIRI The class IRI of the class you want to check about.
             * @returns {string[]} Returns an array of all the property IRIs associated with the provided class IRI.
             */
            self.getClassPropertyIRIs = function(ontology, classIRI) {
                return _.map(self.getClassProperties(ontology, classIRI), 'matonto.originalIRI');
            }
            /**
             * @ngdoc method
             * @name isObjectProperty
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks if the provided entity is an owl:ObjectProperty entity. Returns a boolean.
             *
             * @param {Object} entity The entity you want to check.
             * @returns {boolean} Returns true if it is an owl:ObjectProperty entity, otherwise returns false.
             */
            self.isObjectProperty = function(entity) {
                return _.includes(_.get(entity, '@type', []), prefixes.owl + 'ObjectProperty');
            }
            /**
             * @ngdoc method
             * @name isDataTypeProperty
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks if the provided entity is an owl:DatatypeProperty entity. Returns a boolean.
             *
             * @param {Object} entity The entity you want to check.
             * @returns {boolean} Returns true if it is an owl:DatatypeProperty entity, otherwise returns false.
             */
            self.isDataTypeProperty = function(entity) {
                var types = _.get(entity, '@type', []);
                return _.includes(types, prefixes.owl + 'DatatypeProperty')
                    || _.includes(types, prefixes.owl + 'DataTypeProperty');
            }
            /**
             * @ngdoc method
             * @name isProperty
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks if the provided entity is an owl:DatatypeProperty or owl:ObjectProperty entity. Returns a boolean.
             *
             * @param {Object} entity The entity you want to check.
             * @returns {boolean} Returns true if it is an owl:DatatypeProperty or owl:ObjectProperty entity, otherwise
             * returns false.
             */
            self.isProperty = function(entity) {
                return self.isObjectProperty(entity) || self.isDataTypeProperty(entity);
            }
            /**
             * @ngdoc method
             * @name hasNoDomainProperties
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks if the provided ontology has any property that is not associated with a class by the rdfs:domain
             * axiom. Return a boolean indicating if any such properties exist.
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {boolean} Returns true if it contains properties without an rdfs:domain set, otherwise returns
             * false.
             */
            self.hasNoDomainProperties = function(ontology) {
                return _.some(ontology, entity => self.isProperty(entity) && !_.has(entity, prefixes.rdfs + 'domain'));
            }
            /**
             * @ngdoc method
             * @name getNoDomainProperties
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the list of properties that are not associated with a class by the rdfs:domain axiom. Returns an
             * array of the properties not associated with a class.
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {Object[]} Returns an array of properties not associated with a class.
             */
            self.getNoDomainProperties = function(ontology) {
                return _.filter(ontology, entity => self.isProperty(entity) && !_.has(entity, prefixes.rdfs + 'domain'));
            }
            /**
             * @ngdoc method
             * @name getNoDomainPropertyIRIs
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the list of property IRIs that are not associated with a class by the rdfs:domain axiom. Returns an
             * array of the property IRIs not associated with a class.
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {string[]} Returns an array of property IRIs not associated with a class.
             */
            self.getNoDomainPropertyIRIs = function(ontology) {
                return _.map(self.getNoDomainProperties(ontology), 'matonto.originalIRI');
            }
            /**
             * @ngdoc method
             * @name hasObjectProperties
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks if the provided ontology contains any owl:ObjectProperty entities. Returns a boolean.
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {boolean} Returns true if there are any owl:ObjectProperty entities in the ontology, otherwise
             * returns false.
             */
            self.hasObjectProperties = function(ontology) {
                return _.some(ontology, entity => self.isObjectProperty(entity) && !self.isBlankNode(entity));
            }
            /**
             * @ngdoc method
             * @name getObjectProperties
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the list of all owl:ObjectProperty entities within the provided ontology that are not blank nodes.
             * Returns an Object[].
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {Object[]} An array of all owl:ObjectProperty entities within the ontology.
             */
            self.getObjectProperties = function(ontology) {
                return _.filter(ontology, entity => self.isObjectProperty(entity) && !self.isBlankNode(entity));
            }
            /**
             * @ngdoc method
             * @name getObjectPropertyIRIs
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the list of all owl:ObjectProperty entity IRIs within the provided ontology that are not blank
             * nodes. Returns an string[].
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {string[]} An array of all owl:ObjectProperty entity IRI strings within the ontology.
             */
            self.getObjectPropertyIRIs = function(ontology) {
                return _.map(self.getObjectProperties(ontology), 'matonto.originalIRI');
            }
            /**
             * @ngdoc method
             * @name hasDataTypeProperties
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks if the provided ontology contains any owl:DatatypeProperty entities. Returns a boolean.
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {boolean} Returns true if there are any owl:DatatypeProperty entities in the ontology, otherwise
             * returns false.
             */
            self.hasDataTypeProperties = function(ontology) {
                return _.some(ontology, entity =>  self.isDataTypeProperty(entity));
            }
            /**
             * @ngdoc method
             * @name getDataTypeProperties
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the list of all owl:DatatypeProperty entities within the provided ontology that are not blank nodes.
             * Returns an Object[].
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {Object[]} An array of all owl:DatatypeProperty entities within the ontology.
             */
            self.getDataTypeProperties = function(ontology) {
                return _.filter(ontology, entity => self.isDataTypeProperty(entity) && !self.isBlankNode(entity));
            }
            /**
             * @ngdoc method
             * @name getDataTypePropertyIRIs
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the list of all owl:DatatypeProperty entity IRIs within the provided ontology that are not blank
             * nodes. Returns an string[].
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {string[]} An array of all owl:DatatypeProperty entity IRI strings within the ontology.
             */
            self.getDataTypePropertyIRIs = function(ontology) {
                return _.map(self.getDataTypeProperties(ontology), 'matonto.originalIRI');
            }
            /**
             * @ngdoc method
             * @name isAnnotation
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks if the provided entity is an owl:AnnotationProperty entity. Returns a boolean.
             *
             * @param {Object} entity The entity you want to check.
             * @returns {boolean} Returns true if it is an owl:AnnotationProperty entity, otherwise returns false.
             */
            self.isAnnotation = function(entity) {
                return _.includes(_.get(entity, '@type', []), prefixes.owl + 'AnnotationProperty');
            }
            /**
             * @ngdoc method
             * @name hasAnnotations
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks if the provided ontology contains any owl:AnnotationProperty entities. Returns a boolean.
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {boolean} Returns true if there are any owl:AnnotationProperty entities in the ontology,
             * otherwise returns false.
             */
            self.hasAnnotations = function(ontology) {
                return _.some(ontology, entity => self.isAnnotation(entity) && !self.isBlankNode(entity));
            }
            /**
             * @ngdoc method
             * @name getAnnotations
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the list of all owl:AnnotationProperty entities within the provided ontology. Returns an Object[].
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {Object[]} An array of all owl:AnnotationProperty entities within the ontology.
             */
            self.getAnnotations = function(ontology) {
                return _.filter(ontology, entity => self.isAnnotation(entity) && !self.isBlankNode(entity));
            }
            /**
             * @ngdoc method
             * @name getAnnotationIRIs
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the list of all owl:AnnotationProperty entity IRIs within the provided ontology that are not blank
             * nodes. Returns an string[].
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {string[]} An array of all owl:AnnotationProperty entity IRI strings within the ontology.
             */
            self.getAnnotationIRIs = function(ontology) {
                return _.map(self.getAnnotations(ontology), 'matonto.originalIRI');
            }
            /**
             * @ngdoc method
             * @name isIndividual
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks if the provided entity is an owl:NamedIndividual entity. Returns a boolean.
             *
             * @param {Object} entity The entity you want to check.
             * @returns {boolean} Returns true if it is an owl:NamedIndividual entity, otherwise returns false.
             */
            self.isIndividual = function(entity) {
                return _.includes(_.get(entity, '@type', []), prefixes.owl + 'NamedIndividual');
            }
            /**
             * @ngdoc method
             * @name hasIndividuals
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks to see if the ontology has individuals. Returns a boolean indicating the existence of those
             * individuals.
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {boolean} Returns true if it does have individuals, otherwise returns false.
             */
            self.hasIndividuals = function(ontology) {
                return _.some(ontology, entity => self.isIndividual(entity));
            }
            /**
             * @ngdoc method
             * @name getIndividuals
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the list of all owl:NamedIndividual entities within the provided ontology. Returns an Object[].
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {Object[]} An array of all owl:NamedIndividual entities within the ontology.
             */
            self.getIndividuals = function(ontology) {
                return _.filter(ontology, entity => self.isIndividual(entity));
            }
            /**
             * @ngdoc method
             * @name hasNoTypeIndividuals
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks to see if the ontology has individuals with no other type. Returns a boolean indicating the
             * existence of those individuals.
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {boolean} Returns true if it does have individuals with no other type, otherwise returns false.
             */
            self.hasNoTypeIndividuals = function(ontology) {
                return _.some(ontology, entity => self.isIndividual(entity) && entity['@type'].length === 1);
            }
            /**
             * @ngdoc method
             * @name getNoTypeIndividuals
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the list of all owl:NamedIndividual entities within the provided ontology that have no other type.
             * Returns an Object[].
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {Object[]} An array of all owl:NamedIndividual entities with no other type within the ontology.
             */
            self.getNoTypeIndividuals = function(ontology) {
                return _.filter(ontology, entity => self.isIndividual(entity) && entity['@type'].length === 1);
            }
            /**
             * @ngdoc method
             * @name hasClassIndividuals
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks to see if the class within the provided ontology has individuals with that type. Returns a
             * boolean indicating the existence of those individuals.
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @param {string} classIRI The class IRI of the class you want to check about.
             * @returns {boolean} Returns true if it does have individuals, otherwise returns false.
             */
            self.hasClassIndividuals = function(ontology, classIRI) {
                return _.some(self.getIndividuals(ontology), {'@type': [classIRI]});
            }
            /**
             * @ngdoc method
             * @name getClassIndividuals
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the individuals associated with the class within the provided ontology by the type. Returns an
             * array of all the properties associated with the provided class IRI.
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @param {string} classIRI The class IRI of the class you want to check about.
             * @returns {Object[]} Returns an array of all the individuals associated with the provided class IRI.
             */
            self.getClassIndividuals = function(ontology, classIRI) {
                return _.filter(self.getIndividuals(ontology), {'@type': [classIRI]});
            }
            /**
             * @ngdoc method
             * @name isRestriction
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks if the provided entity is an owl:Restriction. Returns a boolean.
             *
             * @param {Object} entity The entity you want to check.
             * @returns {boolean} Returns true if it is an owl:Restriction entity, otherwise returns false.
             */
            self.isRestriction = function(entity) {
                return _.includes(_.get(entity, '@type', []), prefixes.owl + 'Restriction');
            }
            /**
             * @ngdoc method
             * @name getRestrictions
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the list of all owl:Restriction entities within the provided ontology. Returns an Object[].
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {Object[]} An array of all owl:Restriction entities within the ontology.
             */
            self.getRestrictions = function(ontology) {
                return _.filter(ontology, entity => self.isRestriction(entity));
            }
            /**
             * @ngdoc method
             * @name isBlankNode
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks if the provided entity is blank node. Returns a boolean.
             *
             * @param {Object} entity The entity you want to check.
             * @returns {boolean} Returns true if it is a blank node entity, otherwise returns false.
             */
            self.isBlankNode = function(entity) {
                return _.includes(_.get(entity, '@id', ''), '_:b');
            }
            /**
             * @ngdoc method
             * @name getBlankNodes
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the list of all entities within the provided ontology that are blank nodes. Returns an Object[].
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {Object[]} An array of all owl:Restriction entities within the ontology.
             */
            self.getBlankNodes = function(ontology) {
                return _.filter(ontology, entity => self.isBlankNode(entity));
            }
            /**
             * @ngdoc method
             * @name getEntity
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets entity with the provided IRI from the provided ontology in the MatOnto repository. Returns the
             * entity Object.
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @param {string} entityIRI The IRI of the entity that you want.
             * @returns {Object} An Object which represents the requested entity.
             */
            self.getEntity = function(ontology, entityIRI) {
                return _.find(ontology, {matonto:{originalIRI: entityIRI}}) || _.find(ontology, {'@id': entityIRI});
            }
            /**
             * @ngdoc method
             * @name getEntityByRecordId
             * @methodOf ontologyManager.service:ontologyManagerService
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
             * @name removeEntity
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Removes the entity with the provided IRI from the ontology with the provided ontology ID in the MatOnto
             * repository. Removes the entityIRI from the index. Returns the entity Object.
             *
             * @param {Object[]} listItem The listItem linked to the ontology you want to remove the entity from.
             * @returns {Object} An Object which represents the requested entity.
             */
            self.removeEntity = function(listItem, entityIRI) {
                var entityIndex = _.get(listItem.index, entityIRI);
                _.unset(listItem.index, entityIRI);
                _.forOwn(listItem.index, (value, key) => {
                    if (value > entityIndex) {
                        listItem.index[key] = value - 1;
                    }
                });
                return _.remove(listItem.ontology, {matonto:{originalIRI: entityIRI}})[0];
            }
            /**
             * @ngdoc method
             * @name addEntity
             * @methodOf ontologyManager.service:ontologyManagerService
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
                _.set(_.get(listItem, 'index', {}), entityJSON['@id'], listItem.ontology.length - 1);
            }
            /**
             * @ngdoc method
             * @name getEntityName
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the provided entity's name. This name is either the `rdfs:label`, `dcterms:title`, or `dc:title`.
             * If none of those annotations exist, it returns the beautified `@id`. Returns a string for the entity
             * name.
             *
             * @param {Object} entity The entity you want the name of.
             * @returns {string} The beautified IRI string.
             */
            self.getEntityName = function(entity, type = 'ontology') {
                var result = utilService.getPropertyValue(entity, prefixes.rdfs + 'label')
                    || utilService.getDctermsValue(entity, 'title')
                    || utilService.getPropertyValue(entity, prefixes.dc + 'title');
                if (!result) {
                    if (_.has(entity, '@id')) {
                        result = utilService.getBeautifulIRI(entity['@id']);
                    } else {
                        result = _.get(entity, 'matonto.anonymous', '');
                    }
                }
                if (type === 'vocabulary') {
                    result = utilService.getPropertyValue(entity, prefixes.skos + 'prefLabel')
                        || utilService.getPropertyValue(entity, prefixes.skos + 'altLabel') || result;
                }
                return result;
            }
            /**
             * @ngdoc method
             * @name getEntityDescription
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the provided entity's description. This description is either the `rdfs:comment`,
             * `dcterms:description`, or `dc:description`. If none of those annotations exist, it returns undefined.
             *
             * @param {Object} entity The entity you want the description of.
             * @returns {string} The entity's description text.
             */
            self.getEntityDescription = function(entity) {
                return utilService.getPropertyValue(entity, prefixes.rdfs + 'comment')
                    || utilService.getDctermsValue(entity, 'description')
                    || utilService.getPropertyValue(entity, prefixes.dc + 'description');
            }
            /**
             * @ngdoc method
             * @name getImportedOntologies
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the GET /matontorest/ontologies/{recordId}/imported-ontologies endpoint which gets the list of
             * all ontologies imported by the ontology with the requested ontology ID.
             *
             * @param {string} recordId The record ID of the ontology you want to get from the repository.
             * @param {string} [rdfFormat='jsonld'] The format string to identify the serialization requested.
             * @returns {Promise} A promise containing the list of ontologies that are imported by the requested
             * ontology.
             */
            self.getImportedOntologies = function(recordId, branchId, commitId, rdfFormat = 'jsonld') {
                var deferred = $q.defer();
                var config = {params: {rdfFormat, branchId, commitId}};
                $http.get(prefix + '/' + encodeURIComponent(recordId) + '/imported-ontologies', config)
                    .then(response => {
                        if (_.get(response, 'status') === 200) {
                            deferred.resolve(response.data);
                        } else if (_.get(response, 'status') === 204) {
                            deferred.resolve([]);
                        } else {
                            util.onError(response, deferred);
                        }
                    }, response => util.onError(response, deferred));
                return deferred.promise;
            }
            /**
             * @ngdoc method
             * @name getEntityUsages
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the GET /matontorest/ontologies/{recordId}/entity-usages/{entityIRI} endpoint which gets the
             * JSON SPARQL query results for all statements which have the provided entityIRI as an object.
             *
             * @param {string} recordId The record ID of the ontology you want to get from the repository.
             * @param {string} entityIRI The entity IRI of the entity you want the usages for from the repository.
             * @param {string} queryType The type of query you want to perform (either 'select' or 'construct').
             * @returns {Promise} A promise containing the JSON SPARQL query results bindings.
             */
            self.getEntityUsages = function(recordId, branchId, commitId, entityIRI, queryType = 'select') {
                var deferred = $q.defer();
                var config = {params: {branchId, commitId, queryType}};
                $http.get(prefix + '/' + encodeURIComponent(recordId) + '/entity-usages/' + encodeURIComponent(entityIRI), config)
                    .then(response => {
                        if (queryType === 'construct') {
                            deferred.resolve(response.data);
                        } else {
                            deferred.resolve(response.data.results.bindings);
                        }
                    }, response => util.onError(response, deferred));
                return deferred.promise;
            }
            /**
             * @ngdoc method
             * @name isConcept
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks if the provided entity is an skos:Concept entity. Returns a boolean.
             *
             * @param {Object} entity The entity you want to check.
             * @returns {boolean} Returns true if it is an skos:Concept entity, otherwise returns false.
             */
            self.isConcept = function(entity) {
                return _.includes(_.get(entity, '@type', []), prefixes.skos + 'Concept');
            }
            /**
             * @ngdoc method
             * @name hasConcepts
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks if the provided ontology contains any skos:Concept entities. Returns a boolean.
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {boolean} Returns true if there are any skos:Concept entities in the ontology, otherwise returns
             * false.
             */
            self.hasConcepts = function(ontology) {
                return _.some(ontology, entity => self.isConcept(entity) && !self.isBlankNode(entity));
            }
            /**
             * @ngdoc method
             * @name getConcepts
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the list of all skos:Concept entities within the provided ontology that are not blank nodes. Returns
             * an Object[].
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {Object[]} An array of all skos:Concept entities within the ontology.
             */
            self.getConcepts = function(ontology) {
                return _.filter(ontology, entity => self.isConcept(entity) && !self.isBlankNode(entity));
            }
            /**
             * @ngdoc method
             * @name getConceptIRIs
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the list of all skos:Concept entity IRIs within the provided ontology that are not blank nodes.
             * Returns an string[].
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {string[]} An array of all skos:Concept entity IRI strings within the ontology.
             */
            self.getConceptIRIs = function(ontology) {
                return _.map(self.getConcepts(ontology), 'matonto.originalIRI');
            }
            /**
             * @ngdoc method
             * @name isConceptScheme
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks if the provided entity is an skos:ConceptScheme entity. Returns a boolean.
             *
             * @param {Object} entity The entity you want to check.
             * @returns {boolean} Returns true if it is an skos:ConceptScheme entity, otherwise returns false.
             */
            self.isConceptScheme = function(entity) {
                return _.includes(_.get(entity, '@type', []), prefixes.skos + 'ConceptScheme');
            }
            /**
             * @ngdoc method
             * @name hasConceptSchemes
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks if the provided ontology contains any skos:ConceptScheme entities. Returns a boolean.
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {boolean} Returns true if there are any skos:ConceptScheme entities in the ontology, otherwise
             * returns false.
             */
            self.hasConceptSchemes = function(ontology) {
                return _.some(ontology, entity => self.isConceptScheme(entity) && !self.isBlankNode(entity));
            }
            /**
             * @ngdoc method
             * @name getConceptSchemes
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the list of all skos:ConceptScheme entities within the provided ontology that are not blank nodes.
             * Returns an Object[].
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {Object[]} An array of all skos:ConceptScheme entities within the ontology.
             */
            self.getConceptSchemes = function(ontology) {
                return _.filter(ontology, entity => self.isConceptScheme(entity) && !self.isBlankNode(entity));
            }
            /**
             * @ngdoc method
             * @name getConceptSchemeIRIs
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the list of all skos:ConceptScheme entity IRIs within the provided ontology that are not blank nodes.
             * Returns an string[].
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {string[]} An array of all skos:ConceptScheme entity IRI strings within the ontology.
             */
            self.getConceptSchemeIRIs = function(ontology) {
                return _.map(self.getConceptSchemes(ontology), 'matonto.originalIRI');
            }
            /**
             * @ngdoc method
             * @name getSearchResults
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the search results for literals that contain the requested search text.
             *
             * @param {string} recordId The record ID of the ontology you want to get from the repository.
             * @param {string} searchText The text that you are searching for in the ontology entity literal values.
             * @returns {Promise} A promise containing the SPARQL query results.
             */
            self.getSearchResults = function(recordId, branchId, commitId, searchText) {
                var defaultErrorMessage = 'An error has occurred with your search.';
                var deferred = $q.defer();
                var config = {params: {searchText, branchId, commitId}};
                $http.get(prefix + '/' + encodeURIComponent(recordId) + '/search-results', config)
                    .then(response => {
                        if(_.get(response, 'status') === 200) {
                            deferred.resolve(response.data);
                        } else if (_.get(response, 'status') === 204) {
                            deferred.resolve([]);
                        } else {
                            deferred.reject(defaultErrorMessage);
                        }
                    }, response => util.onError(response, deferred, defaultErrorMessage));
                return deferred.promise;
            }

            self.createOntologyListItem = function(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit,
                upToDate = true) {
                var deferred = $q.defer();
                var listItem = setupListItem(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit,
                    ontologyListItemTemplate);
                var config = {params: {branchId, commitId}};
                $q.all([
                    $http.get(prefix + '/' + encodeURIComponent(recordId) + '/iris', config),
                    $http.get(prefix + '/' + encodeURIComponent(recordId) + '/imported-iris', config),
                    $http.get(prefix + '/' + encodeURIComponent(recordId) + '/class-hierarchies', config),
                    $http.get(prefix + '/' + encodeURIComponent(recordId) + '/classes-with-individuals', config),
                    $http.get(prefix + '/' + encodeURIComponent(recordId) + '/data-property-hierarchies', config),
                    $http.get(prefix + '/' + encodeURIComponent(recordId) + '/object-property-hierarchies', config),
                    cm.getRecordBranches(recordId, catalogId)
                ]).then(response => {
                    listItem.annotations = _.unionWith(
                        _.get(response[0], 'data.annotationProperties'),
                        propertyManagerService.defaultAnnotations,
                        _.isMatch
                    );
                    listItem.subClasses = _.get(response[0], 'data.classes');
                    listItem.subDataProperties = _.get(response[0], 'data.dataProperties');
                    listItem.subObjectProperties = _.get(response[0], 'data.objectProperties');
                    listItem.individuals = _.get(response[0], 'data.namedIndividuals');
                    listItem.dataPropertyRange = _.unionWith(
                        _.get(response[0], 'data.datatypes'),
                        defaultDatatypes,
                        _.isMatch
                    );
                    if (_.get(response[1], 'status') === 200) {
                        _.forEach(response[1].data, iriList => {
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
                    }
                    listItem.classHierarchy = response[2].data.hierarchy;
                    listItem.classIndex = response[2].data.index;
                    listItem.classesWithIndividuals = response[3].data.hierarchy;
                    listItem.classesWithIndividualsIndex = response[3].data.index;
                    listItem.dataPropertyHierarchy = response[4].data.hierarchy;
                    listItem.dataPropertyIndex = response[4].data.index;
                    listItem.objectPropertyHierarchy = response[5].data.hierarchy;
                    listItem.objectPropertyIndex = response[5].data.index;
                    listItem.branches = response[6].data;
                    listItem.upToDate = upToDate;
                    _.pullAllWith(
                        listItem.annotations,
                        _.concat(self.ontologyProperties, listItem.subDataProperties, listItem.subObjectProperties),
                        compareListItems
                    );
                    deferred.resolve(listItem);
                }, response => util.onError(response, deferred));
                return deferred.promise;
            }
            self.addOntologyToList = function(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit,
                upToDate = true) {
                var deferred = $q.defer();
                self.createOntologyListItem(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, upToDate)
                    .then(listItem => {
                        self.list.push(listItem);
                        deferred.resolve();
                    }, deferred.reject);
                return deferred.promise;
            }
            self.createVocabularyListItem = function(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit,
                upToDate = true) {
                var deferred = $q.defer();
                var listItem = setupListItem(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit,
                    vocabularyListItemTemplate);
                var config = {params: {branchId, commitId}};
                $q.all([
                    $http.get(prefix + '/' + encodeURIComponent(recordId) + '/iris', config),
                    $http.get(prefix + '/' + encodeURIComponent(recordId) + '/imported-iris', config),
                    $http.get(prefix + '/' + encodeURIComponent(recordId) + '/concept-hierarchies', config),
                    cm.getRecordBranches(recordId, catalogId)
                ]).then(response => {
                    listItem.subDataProperties = _.get(response[0], 'data.dataProperties');
                    listItem.subObjectProperties = _.get(response[0], 'data.objectProperties');
                    listItem.annotations = _.unionWith(
                        _.get(response[0], 'data.annotationProperties'),
                        propertyManagerService.defaultAnnotations,
                        propertyManagerService.skosAnnotations,
                        _.isMatch
                    );
                    listItem.dataPropertyRange = _.unionWith(
                        _.get(response[0], 'data.datatypes'),
                        defaultDatatypes,
                        _.isMatch
                    );
                    if (_.get(response[1], 'status') === 200) {
                        _.forEach(response[1].data, iriList => {
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
                    }
                    listItem.conceptHierarchy = response[2].data.hierarchy;
                    listItem.conceptIndex = response[2].data.index;
                    listItem.branches = response[3].data;
                    listItem.upToDate = upToDate;
                    _.pullAllWith(
                        listItem.annotations,
                        _.concat(self.ontologyProperties, listItem.subDataProperties, listItem.subObjectProperties,
                            angular.copy(self.conceptRelationshipList), angular.copy(self.schemeRelationshipList)),
                        compareListItems
                    );
                    deferred.resolve(listItem);
                }, response => util.onError(response, deferred));
                return deferred.promise;
            }
            self.addVocabularyToList = function(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit,
                upToDate = true) {
                var deferred = $q.defer();
                self.createVocabularyListItem(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, upToDate)
                    .then(listItem => {
                        self.list.push(listItem);
                        deferred.resolve();
                    }, deferred.reject);
                return deferred.promise;
            }

            /* Private helper functions */
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
            function addOntologyIdToArray(arr, ontologyId) {
                return _.forEach(arr, item => _.set(item, 'ontologyId', ontologyId));
            }
            function compareListItems(obj1, obj2) {
                return _.isEqual(_.get(obj1, 'localName'), _.get(obj2, 'localName'))
                    && _.isEqual(_.get(obj1, 'namespace'), _.get(obj2, 'namespace'));
            }
            function getReadableRestrictionText(restrictionId, restriction) {
                var readableText = restrictionId;
                var keys = _.keys(restriction);
                _.pull(keys, prefixes.owl + 'onProperty', prefixes.owl + 'onClass', '@id', '@type', 'matonto');
                if (keys.length === 1 && _.isArray(restriction[keys[0]]) && restriction[keys[0]].length === 1) {
                    var detailedKey = keys[0];
                    var detailedValue = restriction[detailedKey][0];
                    var onValue = _.get(restriction, prefixes.owl + 'onProperty',
                        _.get(restriction, prefixes.owl + 'onClass'));
                    if (onValue && _.isArray(onValue) && onValue.length === 1) {
                        var onId = _.get(onValue[0], '@id');
                        readableText = $filter('splitIRI')(onId).end + ' ' + $filter('splitIRI')(detailedKey).end + ' ';
                        if (_.has(detailedValue, '@id')) {
                            readableText += $filter('splitIRI')(detailedValue['@id']).end;
                        } else if (_.has(detailedValue, '@value') && _.has(detailedValue, '@type')) {
                            readableText += detailedValue['@value'] + ' '
                                + $filter('splitIRI')(detailedValue['@type']).end;
                        }
                    }
                }
                return readableText;
            }
            function getReadableBlankNodeText(blankNodeId, blankNode) {
                var readableText = blankNodeId;
                var list = [];
                var joiningWord;
                if (_.has(blankNode, prefixes.owl + 'unionOf')) {
                    list = _.get(blankNode[prefixes.owl + 'unionOf'], "[0]['@list']", []);
                    joiningWord = ' or ';
                } else if (_.has(blankNode, prefixes.owl + 'intersectionOf')) {
                    list = _.get(blankNode[prefixes.owl + 'intersectionOf'], "[0]['@list']", []);
                    joiningWord = ' and ';
                }
                if (list.length) {
                    readableText = _.join(_.map(list, item => {
                        return $filter('splitIRI')(_.get(item, '@id')).end;
                    }), joiningWord);
                }
                return readableText;
            }
            function setupListItem(ontologyId, recordId, branchId, commitId, ontology, inProgressCommit, template) {
                var listItem = angular.copy(template);
                var blankNodes = {};
                var index = {};
                _.forEach(ontology, (entity, i) => {
                    if (_.has(entity, '@id')) {
                        _.set(entity, 'matonto.originalIRI', entity['@id']);
                        index[entity['@id']] = i;
                    } else {
                        _.set(entity, 'matonto.anonymous', ontologyId + ' (Anonymous Ontology)');
                    }
                    if (self.isProperty(entity)) {
                        _.set(entity, 'matonto.icon', getIcon(entity));
                    } else if (self.isRestriction(entity)) {
                        let id = _.get(entity, '@id');
                        _.set(blankNodes, id, getReadableRestrictionText(id, entity));
                    } else if (self.isBlankNode(entity)) {
                        let id = _.get(entity, '@id');
                        _.set(blankNodes, id, getReadableBlankNodeText(id, entity));
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
            function getAllRecords(sortingOption = _.find(cm.sortOptions, {label: 'Title (desc)'})) {
                var ontologyRecordType = prefixes.catalog + 'OntologyRecord';
                var paginatedConfig = {
                    pageIndex: 0,
                    limit: 100,
                    sortOption: sortingOption,
                    recordType: ontologyRecordType
                }
                return cm.getRecords(catalogId, paginatedConfig);
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
            function getEntityFromListItem(listItem, entityIRI) {
                var index = _.get(listItem, 'index');
                var ontology = _.get(listItem, 'ontology');
                if (_.has(index, entityIRI)) {
                    return ontology[_.get(index, entityIRI)];
                } else {
                    return self.getEntity(ontology, entityIRI);
                }
            }
        }
})();

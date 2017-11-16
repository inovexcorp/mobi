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
         * @name ontologyManager
         *
         * @description
         * The `ontologyManager` module only provides the `ontologyManagerService` service which
         * provides access to the Mobi ontology REST endpoints and utility functions for
         * manipulating ontologies
         */
        .module('ontologyManager', [])
        /**
         * @ngdoc service
         * @name ontologyManager.service:ontologyManagerService
         * @requires $http
         * @requires $q
         * @requires prefixes.service:prefixes
         * @requires catalogManager.service:catalogManagerService
         * @requires util.service:utilService
         * @requires $httpParamSerializer
         * @requires httpService
         *
         * @description
         * `ontologyManagerService` is a service that provides access to the Mobi ontology REST
         * endpoints and utility functions for editing/creating ontologies and accessing
         * various entities within the ontology.
         */
        .service('ontologyManagerService', ontologyManagerService);

        ontologyManagerService.$inject = ['$http', '$q', '$window', 'prefixes', 'catalogManagerService', 'utilService', '$httpParamSerializer', 'httpService', 'REST_PREFIX'];

        function ontologyManagerService($http, $q, $window, prefixes, catalogManagerService, utilService, $httpParamSerializer, httpService, REST_PREFIX) {
            var self = this;
            var prefix = REST_PREFIX + 'ontologies';
            var cm = catalogManagerService;
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
            var xsdDatatypes = _.map(['anyURI', 'boolean', 'byte', 'dateTime', 'decimal', 'double', 'float', 'int', 'integer', 'language', 'long', 'string'], item => {
                return {
                    'namespace': prefixes.xsd,
                    'localName': item
                }
            });
            var rdfDatatypes = _.map(['langString'], item => {
                return {
                    namespace: prefixes.rdf,
                    localName: item
                }
            });
            self.defaultDatatypes = _.concat(xsdDatatypes, rdfDatatypes);
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
                'narrower', 'narrowMatch', 'related', 'relatedMatch', 'mappingRelation', 'closeMatch', 'exactMatch'], item => ({
                    namespace: prefixes.skos,
                    localName: item,
                    values: 'conceptList'
                }));
            self.conceptRelationshipList = _.concat(
                conceptListRelationships,
                [{
                    namespace: prefixes.skos,
                    localName: 'topConceptOf',
                    values: 'schemeList'
                },
                {
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
             * @param {Object} sortOption An object describing the order for the OntologyRecords.
             * @returns {Promise} A promise with an array of the OntologyRecords.
             */
            self.getAllOntologyRecords = function(sortOption = _.find(cm.sortOptions, {label: 'Title (asc)'}), id = '') {
                var ontologyRecordType = prefixes.ontologyEditor + 'OntologyRecord';
                var paginatedConfig = {
                    pageIndex: 0,
                    limit: 100,
                    recordType: ontologyRecordType,
                    sortOption
                };
                return cm.getRecords(catalogId, paginatedConfig, id).then(response => response.data, $q.reject);
            }
            /**
             * @ngdoc method
             * @name uploadFile
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the POST /mobirest/ontologies endpoint which uploads an ontology to the Mobi repository
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
                return $http.post(prefix, fd, config)
                    .then(response => response.data, util.rejectError);
            }
            /**
             * @ngdoc method
             * @name uploadFile
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the PUT /mobirest/ontologies/{recordId} endpoint which will return a new in-progress commit
             * object to be applied to the ontology.
             *
             * @param {File} file The updated ontology file.
             * @param {string} the ontology record ID.
             * @param {string} the ontology branch ID.
             * @param {string} the ontology commit ID.
             * @returns {Promise} A promise with the new in-progress commit to be applied or error message.
             */
            self.uploadChangesFile = function(file, recordId, branchId, commitId) {
                    var fd = new FormData(),
                    config = {
                        transformRequest: angular.identity,
                        headers: {
                            'Content-Type': undefined,
                            'Accept': 'application/json'
                        },
                        params: {
                            branchId,
                            commitId
                        }
                    };
                fd.append('file', file);

                return $http.put(prefix + '/' + encodeURIComponent(recordId), fd, config)
                    .then(response => response.data, util.rejectError);
            }
            /**
             * @ngdoc method
             * @name uploadJson
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the POST /mobirest/ontologies endpoint which uploads an ontology to the Mobi repository
             * with the JSON-LD ontology string provided. Creates a new OntologyRecord for the associated ontology.
             * Returns a promise with the entityIRI and ontologyId for the state of the newly created ontology.
             *
             * @param {string} ontologyJson The JSON-LD representing the ontology.
             * @param {string} title The title for the OntologyRecord.
             * @param {string} description The description for the OntologyRecord.
             * @param {string} keywords The keywords for the OntologyRecord.
             * @param {string} type The type (either "ontology" or "vocabulary") for the document being created.
             * @returns {Promise} A promise with the ontologyId, recordId, branchId, and commitId for the state of the newly created
             * ontology.
             */
            self.uploadJson = function(ontologyJson, title, description, keywords) {
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
                    .then(response => deferred.resolve(response.data), response => util.onError(response, deferred));
                return deferred.promise;
            }
            /**
             * @ngdoc method
             * @name getOntology
             * @methodOf catalogManager.service:catalogManagerService
             *
             * @description
             * Calls the GET /mobirest/ontologies/{recordId} endpoint which retrieves an ontology in the provided
             * RDF format.
             *
             * @param {string} recordId The id of the Record the Branch should be part of
             * @param {string} branchId The id of the Branch with the specified Commit
             * @param {string} commitId The id of the Commit to retrieve the ontology from
             * @param {string} [rdfFormat='jsonld'] The RDF format to return the ontology in
             * @param {boolean} [clearCache=false] Boolean indicating whether or not you should clear the cache
             * @param {boolen} [preview=false] Boolean indicating whether or not this ontology is inteded to be
             * previewed, not edited
             * @return {Promise} A promise with the ontology at the specified commit in the specified RDF format
             */
            self.getOntology = function(recordId, branchId, commitId, rdfFormat = 'jsonld', clearCache = false, preview = false) {
                var config = {
                    headers: {
                        'Accept': 'text/plain'
                    },
                    params: {
                        branchId,
                        commitId,
                        rdfFormat,
                        clearCache,
                        skolemize: !preview
                    }
                };
                return $http.get(prefix + '/' + encodeURIComponent(recordId), config)
                    .then(response => response.data, util.rejectError);
            }
            /**
             * @ngdoc method
             * @name getOntology
             * @methodOf catalogManager.service:catalogManagerService
             *
             * @description
             * Calls the DELETE /mobirest/ontologies/{recordId} endpoint which deletes the ontology unless the
             * branchId is provided. In which case just the branch is removed.
             *
             * @param {string} recordId The id of the Record to be deleted if no branchId is provided.
             * @param {string} branchId The id of the Branch that should be removed.
             * @return {Promise} HTTP OK unless there was an error.
             */
            self.deleteOntology = function(recordId, branchId) {
                var deferred = $q.defer();
                var config = {};

                if (branchId) {
                    config.params = { branchId };
                }

                $http.delete(prefix + '/' + encodeURIComponent(recordId), config)
                    .then(response => deferred.resolve(), error => util.onError(error, deferred));
                return deferred.promise;
            }
            /**
             * @ngdoc method
             * @name downloadOntology
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the GET /mobirest/ontologies/{recordId} endpoint using the `window.location` variable which will
             * start a download of the ontology starting at the identified Commit.
             *
             * @param {string} recordId The id of the Record the Branch should be part of
             * @param {string} branchId The id of the Branch with the specified Commit
             * @param {string} commitId The id of the Commit to retrieve the ontology from
             * @param {string} [rdfFormat='jsonld'] The RDF format to return the ontology in
             * @param {string} [fileName='ontology'] The name given to the downloaded file
             */
            self.downloadOntology = function(recordId, branchId, commitId, rdfFormat = 'jsonld', fileName = 'ontology') {
                var params = $httpParamSerializer({
                    branchId,
                    commitId,
                    rdfFormat,
                    fileName
                });
                $window.location = prefix + '/' + encodeURIComponent(recordId) + '?' + params;
            }
            /**
             * @ngdoc method
             * @name getVocabularyStuff
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the GET /mobirest/ontologies/{recordId}/vocabulary-stuff endpoint and retrieves an object with keys
             * for the lists of derived skos:Concept and skos:ConceptScheme, concept hierarchy, and concept scheme
             * hierarchy.
             *
             * @param {string} recordId The id of the Record the Branch should be part of
             * @param {string} branchId The id of the Branch with the specified Commit
             * @param {string} commitId The id of the Commit to retrieve the ontology from
             * @param {string} id The identifier for this request
             * @return {Promise} A Promise with an object containing keys "derivedConcepts", "derivedConceptSchemes",
             * "concepts.hierarchy", "concepts.index", "conceptSchemes.hierarchy", and "conceptSchemes.index".
             */
            self.getVocabularyStuff = function(recordId, branchId, commitId, id = '') {
                var config = { params: { branchId, commitId } };
                var url = prefix + '/' + encodeURIComponent(recordId) + '/vocabulary-stuff';
                var promise = id ? httpService.get(url, config, id) : $http.get(url, config);
                return promise.then(response => response.data, util.rejectError);
            }
            /**
             * @ngdoc method
             * @name getOntologyStuff
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the GET /mobirest/ontologies/{recordId}/ontology-stuff endpoint and retrieves an object with keys
             * corresponding to the listItem strcuture.
             *
             * @param {string} recordId The id of the Record the Branch should be part of
             * @param {string} branchId The id of the Branch with the specified Commit
             * @param {string} commitId The id of the Commit to retrieve the ontology from
             * @param {string} id The identifier for this request
             * @return {Promise} A Promise with an object containing listItem keys.
             */
            self.getOntologyStuff = function(recordId, branchId, commitId, id = '') {
                var config = { params: { branchId, commitId } };
                var url = prefix + '/' + encodeURIComponent(recordId) + '/ontology-stuff';
                var promise = id ? httpService.get(url, config, id) : $http.get(url, config);
                return promise.then(response => response.data, util.rejectError);
            }
            /**
             * @ngdoc method
             * @name getIris
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the GET /mobirest/ontologies/{recordId}/iris endpoint and retrieves an object with all the IRIs
             * defined in the ontology for various entity types.
             *
             * @param {string} recordId The id of the Record the Branch should be part of
             * @param {string} branchId The id of the Branch with the specified Commit
             * @param {string} commitId The id of the Commit to retrieve the ontology from
             * @return {Promise} A promise with an object containing keys for various entities in the ontology and values
             * of arrays of IRI strings
             */
            self.getIris = function(recordId, branchId, commitId) {
                var config = { params: { branchId, commitId } };
                return $http.get(prefix + '/' + encodeURIComponent(recordId) + '/iris', config)
                    .then(response => response.data, util.rejectError);
            }
            /**
             * @ngdoc method
             * @name getImportedIris
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the GET /mobirest/ontologies/{recordId}/imported-iris endpoint and retrieves an array of objects
             * with IRIs for various entity types for each imported ontology of the identified ontology.
             *
             * @param {string} recordId The id of the Record the Branch should be part of
             * @param {string} branchId The id of the Branch with the specified Commit
             * @param {string} commitId The id of the Commit to retrieve the ontology from
             * @return {Promise} A promise with an array of objects containing keys for various entities in an imported
             * ontology and values of arrays of IRI strings
             */
            self.getImportedIris = function(recordId, branchId, commitId) {
                var config = { params: { branchId, commitId } };
                return $http.get(prefix + '/' + encodeURIComponent(recordId) + '/imported-iris', config)
                    .then(response => _.get(response, 'status') === 200 ? response.data : [], util.rejectError);
            }
            /**
             * @ngdoc method
             * @name getClassHierarchies
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the GET /mobirest/ontologies/{recordId}/class-hierarchies endpoint and retrieves an object with the
             * hierarchy of classes in the ontology organized by the subClassOf property and with an index of each IRI and
             * its parent IRIs.
             *
             * @param {string} recordId The id of the Record the Branch should be part of
             * @param {string} branchId The id of the Branch with the specified Commit
             * @param {string} commitId The id of the Commit to retrieve the ontology from
             * @return {Promise} A promise with an object containing the class hierarchy and an index of IRIs to parent IRIs
             */
            self.getClassHierarchies = function(recordId, branchId, commitId) {
                var config = { params: { branchId, commitId } };
                return $http.get(prefix + '/' + encodeURIComponent(recordId) + '/class-hierarchies', config)
                    .then(response => response.data, util.rejectError);
            }
            /**
             * @ngdoc method
             * @name getOntologyClasses
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the GET /mobirest/ontologies/{recordId}/classes endpoint and retrieves an array of the classes
             * within the ontology.
             *
             * @param {string} recordId The id of the Record the Branch should be part of
             * @param {string} branchId The id of the Branch with the specified Commit
             * @param {string} commitId The id of the Commit to retrieve the ontology from
             * @return {Promise} A promise with an array containing a list of classes
             */
            self.getOntologyClasses = function(recordId, branchId, commitId) {
                var config = { params: { branchId, commitId } };
                return $http.get(prefix + '/' + encodeURIComponent(recordId) + '/classes', config)
                    .then(response => $q.when(response.data), util.rejectError);
            }
            /**
             * @ngdoc method
             * @name getDataProperties
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the GET /mobirest/ontologies/{recordId}/data-properties endpoint and retrieves an array of data properties
             * within the ontology.
             *
             * @param {string} recordId The id of the Record the Branch should be part of
             * @param {string} branchId The id of the Branch with the specified Commit
             * @param {string} commitId The id of the Commit to retrieve the ontology from
             * @return {Promise} A promise with an array containing a list of data properties.
             */
            self.getDataProperties = function(recordId, branchId, commitId) {
                var config = { params: { branchId, commitId } };
                return $http.get(prefix + '/' + encodeURIComponent(recordId) + '/data-properties', config)
                    .then(response => response.data, util.rejectError);
            }
            /**
             * @ngdoc method
             * @name getObjProperties
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the GET /mobirest/ontologies/{recordId}/object-properties endpoint and retrieves an array of object properties
             * within the ontology.
             *
             * @param {string} recordId The id of the Record the Branch should be part of
             * @param {string} branchId The id of the Branch with the specified Commit
             * @param {string} commitId The id of the Commit to retrieve the ontology from
             * @return {Promise} A promise with an array containing a list of object properties.
             */
            self.getObjProperties = function(recordId, branchId, commitId) {
                var config = { params: { branchId, commitId } };
                return $http.get(prefix + '/' + encodeURIComponent(recordId) + '/object-properties', config)
                    .then(response => response.data, util.rejectError);
            }
            /**
             * @ngdoc method
             * @name getClassesWithIndividuals
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the GET /mobirest/ontologies/{recordId}/classes-with-individuals endpoint and retrieves an object
             * with the hierarchy of classes with individuals in the ontology organized by the subClassOf property and with
             * an index of each IRI and its parent IRIs.
             *
             * @param {string} recordId The id of the Record the Branch should be part of
             * @param {string} branchId The id of the Branch with the specified Commit
             * @param {string} commitId The id of the Commit to retrieve the ontology from
             * @return {Promise} A promise with an object containing the hierarchy of classes with individuals and an index
             * of IRIs to parent IRIs
             */
            self.getClassesWithIndividuals = function(recordId, branchId, commitId) {
                var deferred = $q.defer();
                var config = { params: { branchId, commitId } };
                $http.get(prefix + '/' + encodeURIComponent(recordId) + '/classes-with-individuals', config)
                    .then(response => deferred.resolve(response.data), response => util.onError(response, deferred));
                return deferred.promise;
            }
            /**
             * @ngdoc method
             * @name getDataPropertyHierarchies
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the GET /mobirest/ontologies/{recordId}/data-property-hierarchies endpoint and retrieves an object
             * with the hierarchy of data properties in the ontology organized by the subPropertyOf property and with an
             * index of each IRI and its parent IRIs.
             *
             * @param {string} recordId The id of the Record the Branch should be part of
             * @param {string} branchId The id of the Branch with the specified Commit
             * @param {string} commitId The id of the Commit to retrieve the ontology from
             * @return {Promise} A promise with an object containing the data property hierarchy and an index of IRIs to
             * parent IRIs
             */
            self.getDataPropertyHierarchies = function(recordId, branchId, commitId) {
                var deferred = $q.defer();
                var config = { params: { branchId, commitId } };
                $http.get(prefix + '/' + encodeURIComponent(recordId) + '/data-property-hierarchies', config)
                    .then(response => deferred.resolve(response.data), response => util.onError(response, deferred));
                return deferred.promise;
            }
            /**
             * @ngdoc method
             * @name getObjectPropertyHierarchies
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the GET /mobirest/ontologies/{recordId}/object-property-hierarchies endpoint and retrieves an object
             * with the hierarchy of object properties in the ontology organized by the subPropertyOf property and with an
             * index of each IRI and its parent IRIs.
             *
             * @param {string} recordId The id of the Record the Branch should be part of
             * @param {string} branchId The id of the Branch with the specified Commit
             * @param {string} commitId The id of the Commit to retrieve the ontology from
             * @return {Promise} A promise with an object containing the object property hierarchy and an index of IRIs to
             * parent IRIs
             */
            self.getObjectPropertyHierarchies = function(recordId, branchId, commitId) {
                var deferred = $q.defer();
                var config = { params: { branchId, commitId } };
                $http.get(prefix + '/' + encodeURIComponent(recordId) + '/object-property-hierarchies', config)
                    .then(response => deferred.resolve(response.data), response => util.onError(response, deferred));
                return deferred.promise;
            }
            /**
             * @ngdoc method
             * @name getAnnotationPropertyHierarchies
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the GET /mobirest/ontologies/{recordId}/annotation-property-hierarchies endpoint and retrieves an object
             * with the hierarchy of annotation properties in the ontology organized by the subPropertyOf property and
             * with an index of each IRI and its parent IRIs.
             *
             * @param {string} recordId The id of the Record the Branch should be part of
             * @param {string} branchId The id of the Branch with the specified Commit
             * @param {string} commitId The id of the Commit to retrieve the ontology from
             * @return {Promise} A promise with an object containing the annotation property hierarchy and an index of
             * IRIs to parent IRIs
             */
            self.getAnnotationPropertyHierarchies = function(recordId, branchId, commitId) {
                var deferred = $q.defer();
                var config = { params: { branchId, commitId } };
                $http.get(prefix + '/' + encodeURIComponent(recordId) + '/annotation-property-hierarchies', config)
                    .then(response => deferred.resolve(response.data), response => util.onError(response, deferred));
                return deferred.promise;
            }
            /**
             * @ngdoc method
             * @name getConceptHierarchies
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the GET /mobirest/ontologies/{recordId}/concept-hierarchies endpoint and retrieves an object
             * with the hierarchy of concepts in the ontology organized by the broader and narrower properties and with
             * an index of each IRI and its parent IRIs.
             *
             * @param {string} recordId The id of the Record the Branch should be part of
             * @param {string} branchId The id of the Branch with the specified Commit
             * @param {string} commitId The id of the Commit to retrieve the ontology from
             * @return {Promise} A promise with an object containing the concept hierarchy and an index of IRIs to
             * parent IRIs
             */
            self.getConceptHierarchies = function(recordId, branchId, commitId) {
                var deferred = $q.defer();
                var config = { params: { branchId, commitId } };
                $http.get(prefix + '/' + encodeURIComponent(recordId) + '/concept-hierarchies', config)
                    .then(response => deferred.resolve(response.data), response => util.onError(response, deferred));
                return deferred.promise;
            }
            /**
             * @ngdoc method
             * @name getConceptSchemeHierarchies
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the GET /mobirest/ontologies/{recordId}/concept-scheme-hierarchies endpoint and retrieves an object
             * with the hierarchy of concept schemes and concepts in the ontology organized by the inScheme, hasTopConcept,
             * and topConceptOf properties and with an index of each IRI and its parent IRIs.
             *
             * @param {string} recordId The id of the Record the Branch should be part of
             * @param {string} branchId The id of the Branch with the specified Commit
             * @param {string} commitId The id of the Commit to retrieve the ontology from
             * @return {Promise} A promise with an object containing the concept hierarchy and an index of IRIs to
             * parent IRIs
             */
            self.getConceptSchemeHierarchies = function(recordId, branchId, commitId) {
                var deferred = $q.defer();
                var config = { params: { branchId, commitId } };
                $http.get(prefix + '/' + encodeURIComponent(recordId) + '/concept-scheme-hierarchies', config)
                    .then(response => deferred.resolve(response.data), response => util.onError(response, deferred));
                return deferred.promise;
            }
            /**
             * @ngdoc method
             * @name getImportedOntologies
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the GET /mobirest/ontologies/{recordId}/imported-ontologies endpoint which gets the list of
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
             * Calls the GET /mobirest/ontologies/{recordId}/entity-usages/{entityIRI} endpoint which gets the
             * JSON SPARQL query results for all statements which have the provided entityIRI as an object.
             *
             * @param {string} recordId The record ID of the ontology you want to get from the repository.
             * @param {string} entityIRI The entity IRI of the entity you want the usages for from the repository.
             * @param {string} queryType The type of query you want to perform (either 'select' or 'construct').
             * @param {string} id The identifier for this request
             * @returns {Promise} A promise containing the JSON SPARQL query results bindings.
             */
            self.getEntityUsages = function(recordId, branchId, commitId, entityIRI, queryType = 'select', id = '') {
                var deferred = $q.defer();
                var config = {params: {branchId, commitId, queryType}};
                var url = prefix + '/' + encodeURIComponent(recordId) + '/entity-usages/' + encodeURIComponent(entityIRI);
                var promise = id ? httpService.get(url, config, id) : $http.get(url, config);
                promise.then(response => {
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
             * @name getSearchResults
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the search results for literals that contain the requested search text.
             *
             * @param {string} recordId The record ID of the ontology you want to get from the repository.
             * @param {string} branchId The branch ID of the ontology you want to get from the repository.
             * @param {string} commitId The commit ID of the ontology you want to get from the repository.
             * @param {string} searchText The text that you are searching for in the ontology entity literal values.
             * @param {string} id The id to link this REST call to.
             * @returns {Promise} A promise containing the SPARQL query results.
             */
            self.getSearchResults = function(recordId, branchId, commitId, searchText, id) {
                var defaultErrorMessage = 'An error has occurred with your search.';
                var deferred = $q.defer();
                var config = {params: {searchText, branchId, commitId}};

                httpService.get(prefix + '/' + encodeURIComponent(recordId) + '/search-results', config, id)
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
            /**
             * @ngdoc method
             * @name getFailedImports
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets a list of imported ontology IRIs that failed to resolve.
             *
             * @param {string} recordId The record ID of the ontology you want to get from the repository.
             * @param {string} branchId The branch ID of the ontology you want to get from the repository.
             * @param {string} commitId The commit ID of the ontology you want to get from the repository.
             * @return {Promise} A promise containing the list of imported ontology IRIs that failed to resolve.
             */
            self.getFailedImports = function(recordId, branchId, commitId) {
                var config = { params: { branchId, commitId } };
                return $http.get(prefix + '/' + encodeURIComponent(recordId) + '/failed-imports', config)
                    .then(response => response.data, util.rejectError);
            }
            /**
             * @ngdoc method
             * @name isDeprecated
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks if the provided entity is deprecated by looking for the owl:deprecated annotation.
             *
             * @param {Object} entity The entity you want to check.
             * @return {boolean} Returns true if the owl:deprecated value is "true" or "1", otherwise returns false.
             */
            self.isDeprecated = function(entity) {
                var deprecated = util.getPropertyValue(entity, prefixes.owl + 'deprecated');
                return deprecated === 'true' || deprecated === '1';
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
                return _.get(entity, '@id', _.get(entity, 'mobi.anonymous', ''));
            }
            /**
             * @ngdoc method
             * @name isDatatype
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             *Checks if the provided entity is an rdfs:Datatype. Returns a booelan.
             *
             * @param {Object} entity The entity you want to check
             * @return {boolean} Returns true if it is an rdfs:Datatype entity, otherwise returns false.
             */
            self.isDatatype = function(entity) {
                return _.includes(_.get(entity, '@type', []), prefixes.rdfs + 'Datatype');
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
             * Checks if the provided ontologies contain any owl:Class entities. Returns a boolean.
             *
             * @param {Object[]} ontologies The array of ontologies you want to check.
             * @returns {boolean} Returns true if there are any owl:Class entities in the ontologies, otherwise returns
             * false.
             */
            self.hasClasses = function(ontologies) {
                return _.some(ontologies, ont => _.some(ont, entity => self.isClass(entity) && !self.isBlankNode(entity)));
            }
            /**
             * @ngdoc method
             * @name getClasses
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the list of all owl:Class entities within the provided ontologies that are not blank nodes. Returns
             * an Object[].
             *
             * @param {Object[]} ontologies The array of ontologies you want to check.
             * @returns {Object[]} An array of all owl:Class entities within the ontologies.
             */
            self.getClasses = function(ontologies) {
                var classes = [];
                _.forEach(ontologies, ont => {
                    classes.push.apply(classes,
                        _.filter(ont, entity => self.isClass(entity) && !self.isBlankNode(entity)));
                });
                return classes;
            }
            /**
             * @ngdoc method
             * @name getClassIRIs
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the list of all owl:Class entity IRIs within the provided ontologies that are not blank nodes.
             * Returns a string[].
             *
             * @param {Object[]} ontologies The array of ontologies you want to check.
             * @returns {string[]} An array of all owl:Class entity IRI strings within the ontologies.
             */
            self.getClassIRIs = function(ontologies) {
                return _.map(self.getClasses(ontologies), '@id');
            }
            /**
             * @ngdoc method
             * @name hasClassProperties
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks to see if the class within the provided ontologies has any properties associated it via the
             * rdfs:domain axiom. Returns a boolean indicating the existence of those properties.
             *
             * @param {Object[]} ontologies The array of ontologies you want to check.
             * @param {string} classIRI The class IRI of the class you want to check about.
             * @returns {boolean} Returns true if it does have properties, otherwise returns false.
             */
            self.hasClassProperties = function(ontologies, classIRI) {
                return _.some(ontologies, ont => _.some(ont, {[prefixes.rdfs + 'domain']: [{'@id': classIRI}]}));
            }
            /**
             * @ngdoc method
             * @name getClassProperties
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the properties associated with the class within the provided ontologies by the rdfs:domain axiom.
             * Returns an array of all the properties associated with the provided class IRI.
             *
             * @param {Object[]} ontologies The array of ontologies you want to check.
             * @param {string} classIRI The class IRI of the class you want to check about.
             * @returns {Object[]} Returns an array of all the properties associated with the provided class IRI.
             */
            self.getClassProperties = function(ontologies, classIRI) {
                var classProperties = [];
                _.forEach(ontologies, ont => {
                    classProperties.push.apply(classProperties,
                        _.filter(ont, {[prefixes.rdfs + 'domain']: [{'@id': classIRI}]}));
                });
                return classProperties;
            }
            /**
             * @ngdoc method
             * @name getClassProperties
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the property IRIs associated with the class within the provided ontologies by the rdfs:domain axiom.
             * Returns an array of all the property IRIs associated with the provided class IRI.
             *
             * @param {Object[]} ontologies The array of ontologies you want to check.
             * @param {string} classIRI The class IRI of the class you want to check about.
             * @returns {string[]} Returns an array of all the property IRIs associated with the provided class IRI.
             */
            self.getClassPropertyIRIs = function(ontologies, classIRI) {
                return _.map(self.getClassProperties(ontologies, classIRI), '@id');
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
             * @name hasObjectProperties
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks if the provided ontologies contain any owl:ObjectProperty entities. Returns a boolean.
             *
             * @param {Object[]} ontologies The array of ontologies you want to check.
             * @returns {boolean} Returns true if there are any owl:ObjectProperty entities in the ontologies, otherwise
             * returns false.
             */
            self.hasObjectProperties = function(ontologies) {
                return _.some(ontologies, ont => _.some(ont, entity => self.isObjectProperty(entity) && !self.isBlankNode(entity)));
            }
            /**
             * @ngdoc method
             * @name getObjectProperties
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the list of all owl:ObjectProperty entities within the provided ontologies that are not blank nodes.
             * Returns an Object[].
             *
             * @param {Object[]} ontologies The array of ontologies you want to check.
             * @returns {Object[]} An array of all owl:ObjectProperty entities within the ontologies.
             */
            self.getObjectProperties = function(ontologies) {
                var objectProperties = [];
                _.forEach(ontologies, ont => {
                    objectProperties.push.apply(objectProperties,
                        _.filter(ont, entity => self.isObjectProperty(entity) && !self.isBlankNode(entity)));
                });
                return objectProperties;
            }
            /**
             * @ngdoc method
             * @name getObjectPropertyIRIs
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the list of all owl:ObjectProperty entity IRIs within the provided ontologies that are not blank
             * nodes. Returns an string[].
             *
             * @param {Object[]} ontologies The array of ontologies you want to check.
             * @returns {string[]} An array of all owl:ObjectProperty entity IRI strings within the ontologies.
             */
            self.getObjectPropertyIRIs = function(ontologies) {
                return _.map(self.getObjectProperties(ontologies), '@id');
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
             * @name hasDataTypeProperties
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks if the provided ontologies contain any owl:DatatypeProperty entities. Returns a boolean.
             *
             * @param {Object[]} ontologies The array of ontologies you want to check.
             * @returns {boolean} Returns true if there are any owl:DatatypeProperty entities in the ontologies,
             * otherwise returns false.
             */
            self.hasDataTypeProperties = function(ontologies) {
                return _.some(ontologies, ont => _.some(ont, entity => self.isDataTypeProperty(entity)));
            }
            /**
             * @ngdoc method
             * @name getDataTypeProperties
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the list of all owl:DatatypeProperty entities within the provided ontologies that are not blank
             * nodes. Returns an Object[].
             *
             * @param {Object[]} ontologies The array of ontologies you want to check.
             * @returns {Object[]} An array of all owl:DatatypeProperty entities within the ontologies.
             */
            self.getDataTypeProperties = function(ontologies) {
                var dataTypeProperties = [];
                _.forEach(ontologies, ont => {
                    dataTypeProperties.push.apply(dataTypeProperties,
                        _.filter(ont, entity => self.isDataTypeProperty(entity) && !self.isBlankNode(entity)));
                });
                return dataTypeProperties;
            }
            /**
             * @ngdoc method
             * @name getDataTypePropertyIRIs
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the list of all owl:DatatypeProperty entity IRIs within the provided ontologies that are not blank
             * nodes. Returns an string[].
             *
             * @param {Object[]} ontologies The array of ontologies you want to check.
             * @returns {string[]} An array of all owl:DatatypeProperty entity IRI strings within the ontologies.
             */
            self.getDataTypePropertyIRIs = function(ontologies) {
                return _.map(self.getDataTypeProperties(ontologies),'@id');
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
             * Checks if the provided ontologies have any properties that are not associated with a class by the
             * rdfs:domain axiom. Return a boolean indicating if any such properties exist.
             *
             * @param {Object[]} ontologies The array of ontologies you want to check.
             * @returns {boolean} Returns true if it contains properties without an rdfs:domain set, otherwise returns
             * false.
             */
            self.hasNoDomainProperties = function(ontologies) {
                return _.some(ontologies, ont =>
                            _.some(ont, entity => self.isProperty(entity) && !_.has(entity, prefixes.rdfs + 'domain')));
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
             * @param {Object[]} ontologies The array of ontologies you want to check.
             * @returns {Object[]} Returns an array of properties not associated with a class.
             */
            self.getNoDomainProperties = function(ontologies) {
                var noDomainProperties = [];
                _.forEach(ontologies, ont => {
                    noDomainProperties.push.apply(noDomainProperties,
                        _.filter(ont, entity => self.isProperty(entity) && !_.has(entity, prefixes.rdfs + 'domain')));
                });
                return noDomainProperties;
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
             * @param {Object[]} ontologies The array of ontologies you want to check.
             * @returns {string[]} Returns an array of property IRIs not associated with a class.
             */
            self.getNoDomainPropertyIRIs = function(ontologies) {
                return _.map(self.getNoDomainProperties(ontologies), '@id');
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
             * Checks if the provided ontologies contain any owl:AnnotationProperty entities. Returns a boolean.
             *
             * @param {Object[]} ontologies The array of ontologies you want to check.
             * @returns {boolean} Returns true if there are any owl:AnnotationProperty entities in the ontologies,
             * otherwise returns false.
             */
            self.hasAnnotations = function(ontologies) {
                return _.some(ontologies, ont =>
                            _.some(ont, entity => self.isAnnotation(entity) && !self.isBlankNode(entity)));
            }
            /**
             * @ngdoc method
             * @name getAnnotations
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the list of all owl:AnnotationProperty entities within the provided ontologies. Returns an Object[].
             *
             * @param {Object[]} ontologies The array of ontologies you want to check.
             * @returns {Object[]} An array of all owl:AnnotationProperty entities within the ontologies.
             */
            self.getAnnotations = function(ontologies) {
                var annotations = [];
                _.forEach(ontologies, ont => {
                    annotations.push.apply(annotations,
                        _.filter(ont, entity => self.isAnnotation(entity) && !self.isBlankNode(entity)));
                });
                return annotations;
            }
            /**
             * @ngdoc method
             * @name getAnnotationIRIs
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the list of all owl:AnnotationProperty entity IRIs within the provided ontologies that are not blank
             * nodes. Returns an string[].
             *
             * @param {Object[]} ontologies The array of ontologies you want to check.
             * @returns {string[]} An array of all owl:AnnotationProperty entity IRI strings within the ontologies.
             */
            self.getAnnotationIRIs = function(ontologies) {
                return _.map(self.getAnnotations(ontologies), '@id');
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
             * Checks to see if the ontologies have individuals. Returns a boolean indicating the existence of those
             * individuals.
             *
             * @param {Object[]} ontologies The array of ontologies you want to check.
             * @returns {boolean} Returns true if it does have individuals, otherwise returns false.
             */
            self.hasIndividuals = function(ontologies) {
                return _.some(ontologies, ont => _.some(ont, entity => self.isIndividual(entity)));
            }
            /**
             * @ngdoc method
             * @name getIndividuals
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the list of all owl:NamedIndividual entities within the provided ontologies. Returns an Object[].
             *
             * @param {Object[]} ontologies The array of ontologies you want to check.
             * @returns {Object[]} An array of all owl:NamedIndividual entities within the ontologies.
             */
            self.getIndividuals = function(ontologies) {
                var individuals = [];
                _.forEach(ontologies, ont => {
                    individuals.push.apply(individuals, _.filter(ont, entity => self.isIndividual(entity)));
                });
                return individuals;
            }
            /**
             * @ngdoc method
             * @name hasNoTypeIndividuals
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks to see if the ontologies have individuals with no other type. Returns a boolean indicating the
             * existence of those individuals.
             *
             * @param {Object[]} ontologies The array of ontologies you want to check.
             * @returns {boolean} Returns true if it does have individuals with no other type, otherwise returns false.
             */
            self.hasNoTypeIndividuals = function(ontologies) {
                return _.some(ontologies, ont =>
                            _.some(ont, entity => self.isIndividual(entity) && entity['@type'].length === 1));
            }
            /**
             * @ngdoc method
             * @name getNoTypeIndividuals
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the list of all owl:NamedIndividual entities within the provided ontologies that have no other type.
             * Returns an Object[].
             *
             * @param {Object[]} ontologies The array of ontologies you want to check.
             * @returns {Object[]} An array of all owl:NamedIndividual entities with no other type within the ontologies.
             */
            self.getNoTypeIndividuals = function(ontologies) {
                var individuals = [];
                _.forEach(ontologies, ont => {
                    individuals.push.apply(individuals,
                        _.filter(ont, entity => self.isIndividual(entity) && entity['@type'].length === 1));
                });
                return individuals;
            }
            /**
             * @ngdoc method
             * @name hasClassIndividuals
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks to see if the class within the provided ontologies have individuals with that type. Returns a
             * boolean indicating the existence of those individuals.
             *
             * @param {Object[]} ontologies The array of ontologies you want to check.
             * @param {string} classIRI The class IRI of the class you want to check about.
             * @returns {boolean} Returns true if it does have individuals, otherwise returns false.
             */
            self.hasClassIndividuals = function(ontologies, classIRI) {
                return _.some(self.getIndividuals(ontologies), {'@type': [classIRI]});
            }
            /**
             * @ngdoc method
             * @name getClassIndividuals
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the individuals associated with the class within the provided ontologies by the type. Returns an
             * array of all the properties associated with the provided class IRI.
             *
             * @param {Object[]} ontologies The array of ontologies you want to check.
             * @param {string} classIRI The class IRI of the class you want to check about.
             * @returns {Object[]} Returns an array of all the individuals associated with the provided class IRI.
             */
            self.getClassIndividuals = function(ontologies, classIRI) {
                return _.filter(self.getIndividuals(ontologies), {'@type': [classIRI]});
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
             * Gets the list of all owl:Restriction entities within the provided ontologies. Returns an Object[].
             *
             * @param {Object[]} ontologies The array of ontologies you want to check.
             * @returns {Object[]} An array of all owl:Restriction entities within the ontologies.
             */
            self.getRestrictions = function(ontologies) {
                var restrictions = [];
                _.forEach(ontologies, ont => {
                    restrictions.push.apply(restrictions, _.filter(ont, entity => self.isRestriction(entity)));
                });
                return restrictions;
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
                return self.isBlankNodeId(_.get(entity, '@id', ''));
            }
            /**
             * @ngdoc method
             * @name isBlankNodeId
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks if the provided entity id is a blank node id. Returns a boolean.
             *
             * @param {string} id The id to check.
             * @return {boolean} Retrurns true if the id is a blank node id, otherwise returns false.
             */
            self.isBlankNodeId = function(id) {
                return _.isString(id) && (_.includes(id, '/.well-known/genid/') || _.includes(id, '_:genid') || _.includes(id, '_:b'));
            }
            /**
             * @ngdoc method
             * @name getBlankNodes
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the list of all entities within the provided ontologies that are blank nodes. Returns an Object[].
             *
             * @param {Object[]} ontologies The array of ontologies you want to check.
             * @returns {Object[]} An array of all owl:Restriction entities within the ontologies.
             */
            self.getBlankNodes = function(ontologies) {
                var blankNodes = [];
                _.forEach(ontologies, ont => {
                    blankNodes.push.apply(blankNodes, _.filter(ont, entity => self.isBlankNode(entity)));
                });
                return blankNodes;
            }
            /**
             * @ngdoc method
             * @name getEntity
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets entity with the provided IRI from the provided ontologies in the Mobi repository. Returns the
             * entity Object.
             *
             * @param {Object[]} ontologies The array of ontologies you want to check.
             * @param {string} entityIRI The IRI of the entity that you want.
             * @returns {Object} An Object which represents the requested entity.
             */
            self.getEntity = function(ontologies, entityIRI) {
                var retValue;
                _.forEach(ontologies, ont => {
                    retValue = _.find(ont, {'@id': entityIRI});
                    if (retValue != null) {
                        return false; //This breaks the loop. It is NOT the entire function's return value!
                    }
                });
                return retValue;
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
            self.getEntityName = function(entity) {
                var result = utilService.getPropertyValue(entity, prefixes.rdfs + 'label')
                    || utilService.getDctermsValue(entity, 'title')
                    || utilService.getPropertyValue(entity, prefixes.dc + 'title')
                    || utilService.getPropertyValue(entity, prefixes.skos + 'prefLabel')
                    || utilService.getPropertyValue(entity, prefixes.skos + 'altLabel');
                if (!result && _.has(entity, '@id')) {
                    result = utilService.getBeautifulIRI(entity['@id']);
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
             * @name isConcept
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks if the provided entity is an skos:Concept entity. Returns a boolean.
             *
             * @param {Object} entity The entity you want to check.
             * @returns {boolean} Returns true if it is an skos:Concept entity, otherwise returns false.
             */
            self.isConcept = function(entity, derivedConcepts = []) {
                    return (_.includes(_.get(entity, '@type', []), prefixes.skos + 'Concept')
                        || _.intersection(_.get(entity, '@type', []), derivedConcepts).length > 0);
            }
            /**
             * @ngdoc method
             * @name hasConcepts
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks if the provided ontologies contain any skos:Concept entities. Returns a boolean.
             *
             * @param {Object[]} ontologies The array of ontologies you want to check.
             * @returns {boolean} Returns true if there are any skos:Concept entities in the ontologies, otherwise
             * returns false.
             */
            self.hasConcepts = function(ontologies, derivedConcepts) {
                return _.some(ontologies, ont =>
                            _.some(ont, entity => self.isConcept(entity, derivedConcepts) && !self.isBlankNode(entity)));
            }
            /**
             * @ngdoc method
             * @name getConcepts
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the list of all skos:Concept entities within the provided ontologies that are not blank nodes.
             * Returns an Object[].
             *
             * @param {Object[]} ontologies The array of ontologies you want to check.
             * @returns {Object[]} An array of all skos:Concept entities within the ontologies.
             */
            self.getConcepts = function(ontologies, derivedConcepts) {
                var concepts = [];
                _.forEach(ontologies, ont => {
                    concepts.push.apply(concepts,
                        _.filter(ont, entity => self.isConcept(entity, derivedConcepts) && !self.isBlankNode(entity)));
                });
                return concepts;
            }
            /**
             * @ngdoc method
             * @name getConceptIRIs
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the list of all skos:Concept entity IRIs within the provided ontologies that are not blank nodes.
             * Returns an string[].
             *
             * @param {Object[]} ontologies The array of ontologies you want to check.
             * @returns {string[]} An array of all skos:Concept entity IRI strings within the ontologies.
             */
            self.getConceptIRIs = function(ontologies, derivedConcepts) {
                return _.map(self.getConcepts(ontologies, derivedConcepts), '@id');
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
            self.isConceptScheme = function(entity, derivedConceptSchemes = []) {
                   return (_.includes(_.get(entity, '@type', []), prefixes.skos + 'ConceptScheme')
                        || _.intersection(_.get(entity, '@type', []), derivedConceptSchemes).length > 0);
            }
            /**
             * @ngdoc method
             * @name hasConceptSchemes
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Checks if the provided ontologies contain any skos:ConceptScheme entities. Returns a boolean.
             *
             * @param {Object[]} ontologies The array of ontologies you want to check.
             * @returns {boolean} Returns true if there are any skos:ConceptScheme entities in the ontologies, otherwise
             * returns false.
             */
            self.hasConceptSchemes = function(ontologies, derivedConceptSchemes) {
                return _.some(ontologies, ont =>
                            _.some(ont, entity => self.isConceptScheme(entity, derivedConceptSchemes) && !self.isBlankNode(entity)));
            }
            /**
             * @ngdoc method
             * @name getConceptSchemes
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the list of all skos:ConceptScheme entities within the provided ontologies that are not blank nodes.
             * Returns an Object[].
             *
             * @param {Object[]} ontologies The array of ontologies you want to check.
             * @returns {Object[]} An array of all skos:ConceptScheme entities within the ontologies.
             */
            self.getConceptSchemes = function(ontologies) {
                var conceptSchemes = [];
                _.forEach(ontologies, ont => {
                    conceptSchemes.push.apply(conceptSchemes,
                        _.filter(ont, entity => self.isConceptScheme(entity) && !self.isBlankNode(entity)));
                });
                return conceptSchemes;
            }
            /**
             * @ngdoc method
             * @name getConceptSchemeIRIs
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the list of all skos:ConceptScheme entity IRIs within the provided ontologies that are not blank
             * nodes. Returns a string[].
             *
             * @param {Object[]} ontologies The array of ontologies you want to check.
             * @returns {string[]} An array of all skos:ConceptScheme entity IRI strings within the ontology.
             */
            self.getConceptSchemeIRIs = function(ontologies) {
                return _.map(self.getConceptSchemes(ontologies), '@id');
            }
        }
})();

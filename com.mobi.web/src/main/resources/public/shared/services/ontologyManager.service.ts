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
import { endsWith, identity, get, noop, indexOf, forEach, some, includes, find, map, isMatch, has, filter, reduce, intersection, isString, concat, uniq } from 'lodash';
import * as jszip from 'jszip';
ontologyManagerService.$inject = ['$http', '$q', 'prefixes', 'catalogManagerService', 'utilService', '$httpParamSerializer', 'httpService', 'REST_PREFIX'];

/**
 * @ngdoc service
 * @name shared.service:ontologyManagerService
 * @requires shared.service:prefixes
 * @requires shared.service:catalogManagerService
 * @requires shared.service:utilService
 * @requires shared.service:httpService
 *
 * @description
 * `ontologyManagerService` is a service that provides access to the Mobi ontology REST
 * endpoints and utility functions for editing/creating ontologies and accessing
 * various entities within the ontology.
 */
function ontologyManagerService($http, $q, prefixes, catalogManagerService, utilService, $httpParamSerializer, httpService, REST_PREFIX) {
    const self = this;
    const prefix = REST_PREFIX + 'ontologies';
    const cm = catalogManagerService;
    const util = utilService;
    let catalogId = '';

    /**
     * @ngdoc property
     * @name ontologyRecords
     * @propertyOf shared.service:ontologyManagerService
     * @type {Object[]}
     *
     * @description
     * 'ontologyRecords' holds an array of ontology record objects which contain properties for the metadata
     * associated with that record.
     */
    self.ontologyRecords = [];
    /**
     * @ngdoc property
     * @name entityNameProps
     * @propertyOf shared.service:ontologyManagerService
     * @type {Object[]}
     *
     * @description
     * 'entityNameProps' holds an array of properties used to determine an entity name.
     */
    self.entityNameProps = [prefixes.rdfs + 'label', prefixes.dcterms + 'title', prefixes.dc + 'title', prefixes.skos + 'prefLabel', prefixes.skos + 'altLabel', prefixes.skosxl + 'literalForm'];

    /**
     * @ngdoc method
     * @name reset
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Resets all state variables.
     */
    self.reset = function() {
        self.ontologyRecords = [];
    };
    /**
     * @ngdoc method
     * @name initialize
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Initializes the `catalogId` variable.
     */
    self.initialize = function() {
        catalogId = get(cm.localCatalog, '@id', '');
    };
    /**
     * @ngdoc method
     * @name uploadOntology
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Calls the POST /mobirest/ontologies endpoint which uploads an ontology to the Mobi repository
     * with the file/JSON-LD provided. This creates a new OntologyRecord associated with this ontology. Returns a
     * promise indicating whether the ontology was persisted. Provide either a file or JSON-LD, but not both.
     *
     * @param {File} file The ontology file.
     * @param {Object} ontologyJson The ontology json.
     * @param {string} title The record title.
     * @param {string} description The record description.
     * @param {string} keywords The array of keywords for the record.
     * @param {string} id The identifier for this request.
     * @returns {Promise} A promise indicating whether the ontology was persisted.
     */
    self.uploadOntology = function(file, ontologyJson, title, description, keywords, id = '', callback = null) {
        const fd = new FormData();
        const config = {
            transformRequest: identity,
            headers: {
                'Content-Type': undefined
            }
        };
        let prepPromise;
        if (file !== undefined) {
            const titleInfo = getFileTitleInfo(title);
            if (endsWith(titleInfo.title, ".trig") || endsWith(titleInfo.title, ".trig.zip") || endsWith(titleInfo.title, ".trig.gzip")) {
                prepPromise = Promise.reject('TriG data is not supported for ontology upload.');
            } else if (titleInfo.ext !== 'zip' && file.size) {
                prepPromise = self.compressFile(file).then(file => {
                    fd.append('file',file);
                });
            } else {
                prepPromise = Promise.resolve(fd.append('file', file));
            }
        } else {
            prepPromise = Promise.resolve();
        }
       return prepPromise.then(() => {
            if (ontologyJson !== undefined) {
                fd.append('json', JSON.stringify(ontologyJson));
            }
            fd.append('title', title);
            if (description) {
                fd.append('description', description);
            }
            forEach(keywords, word => fd.append('keywords', word));
            const promise =  id ? httpService.post(prefix, fd, config, id) : $http.post(prefix, fd, config);
           
            if (typeof(callback) == 'function') {
                let resolver = promise.then(response => response.data, util.rejectErrorObject);
                callback(id, resolver, title);
            } else {
                return promise.then(response => response.data, util.rejectErrorObject);
            }    
        }, errorString => {
            const resolver = Promise.reject({'errorMessage': errorString, 'errorDetails': []});
            if (typeof(callback) == 'function') {
                callback(id, resolver, title);
            } else {
                return resolver;
            }
        }).then(response => { return response }, $q.reject);
    };

    /**
     * @ngdoc method
     * @name uploadChangesFile
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Calls the PUT /mobirest/ontologies/{recordId} endpoint which will return a new in-progress commit
     * object to be applied to the ontology.
     *
     * @param {File} file The updated ontology file.
     * @param {string} recordId the ontology record ID.
     * @param {string} branchId the ontology branch ID.
     * @param {string} commitId the ontology commit ID.
     * @returns {Promise} A promise with the new in-progress commit to be applied or error message.
     */
    self.uploadChangesFile = function(file, recordId, branchId, commitId) {
        const fd = new FormData();
        const config = {
            transformRequest: identity,
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
            .then(response => {
                if (get(response, 'status') === 204) {
                    return $q.reject({warningMessage: 'Uploaded file is identical to current branch.'});
                } else {
                    return response.data;
                }
            }, util.rejectErrorObject);
    };
    /**
     * @ngdoc method
     * @name getOntology
     * @methodOf shared.service:catalogManagerService
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
     * @param {boolean} [preview=false] Boolean indicating whether or not this ontology is intended to be
     * previewed, not edited
     * @param {boolean} [applyInProgressCommit=true]  Boolean indicating whether or not any in progress commits by user
     * should be applied to the return value
     * @return {Promise} A promise with the ontology at the specified commit in the specified RDF format
     */
    self.getOntology = function(recordId, branchId, commitId, rdfFormat = 'jsonld', clearCache = false, preview = false, applyInProgressCommit = true) {
        const config = {
            headers: {
                'Accept': 'text/plain'
            },
            params: {
                branchId,
                commitId,
                rdfFormat,
                clearCache,
                skolemize: !preview,
                applyInProgressCommit
            }
        };
        return $http.get(prefix + '/' + encodeURIComponent(recordId), config)
            .then(response => response.data, util.rejectError);
    };
    /**
     * @ngdoc method
     * @name deleteOntology
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Calls the DELETE /mobirest/ontologies/{recordId} endpoint which deletes the ontology.
     *
     * @param {string} recordId The id of the Record to be deleted.
     * @return {Promise} HTTP OK unless there was an error.
     */
    self.deleteOntology = function(recordId) {
        return $http.delete(prefix + '/' + encodeURIComponent(recordId))
            .then(noop, util.rejectError);
    };
    /**
     * @ngdoc method
     * @name downloadOntology
     * @methodOf shared.service:ontologyManagerService
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
        const params = $httpParamSerializer({
            branchId,
            commitId,
            rdfFormat: rdfFormat || 'jsonld',
            fileName: fileName || 'ontology'
        });
        util.startDownload(prefix + '/' + encodeURIComponent(recordId) + '?' + params);
    };
    /**
     * @ngdoc method
     * @name deleteOntologyBranch
     * @methodOf shared.service:catalogManagerService
     *
     * @description
     * Calls the DELETE /mobirest/ontologies/{recordId}/branches/{branchId} endpoint which deletes the provided
     * branch from the OntologyRecord
     *
     * @param {string} recordId The id of the Record.
     * @param {string} branchId The id of the Branch that should be removed.
     * @return {Promise} HTTP OK unless there was an error.
     */
    self.deleteOntologyBranch = function(recordId, branchId) {
        return $http.delete(prefix + '/' + encodeURIComponent(recordId) + '/branches/'
            + encodeURIComponent(branchId))
            .then(noop, util.rejectError);
    };
    /**
     * @ngdoc method
     * @name getVocabularyStuff
     * @methodOf shared.service:ontologyManagerService
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
        const config = { params: { branchId, commitId } };
        const url = prefix + '/' + encodeURIComponent(recordId) + '/vocabulary-stuff';
        const promise = id ? httpService.get(url, config, id) : $http.get(url, config);
        return promise.then(response => response.data, util.rejectError);
    };
    /**
     * @ngdoc method
     * @name getOntologyStuff
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Calls the GET /mobirest/ontologies/{recordId}/ontology-stuff endpoint and retrieves an object with keys
     * corresponding to the listItem structure.
     *
     * @param {string} recordId The id of the Record the Branch should be part of
     * @param {string} branchId The id of the Branch with the specified Commit
     * @param {string} commitId The id of the Commit to retrieve the ontology from
     * @param {boolean} clearCache Whether or not to clear the cache
     * @param {string} id The identifier for this request
     * @return {Promise} A Promise with an object containing listItem keys.
     */
    self.getOntologyStuff = function(recordId, branchId, commitId, clearCache, id = '') {
        const config = { params: { branchId, commitId, clearCache } };
        const url = prefix + '/' + encodeURIComponent(recordId) + '/ontology-stuff';
        const promise = id ? httpService.get(url, config, id) : $http.get(url, config);
        return promise.then(response => response.data, util.rejectError);
    };
    /**
     * @ngdoc method
     * @name getIris
     * @methodOf shared.service:ontologyManagerService
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
        const config = { params: { branchId, commitId } };
        return $http.get(prefix + '/' + encodeURIComponent(recordId) + '/iris', config)
            .then(response => response.data, util.rejectError);
    };
    /**
     * @ngdoc method
     * @name getImportedIris
     * @methodOf shared.service:ontologyManagerService
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
        const config = { params: { branchId, commitId } };
        return $http.get(prefix + '/' + encodeURIComponent(recordId) + '/imported-iris', config)
            .then(response => get(response, 'status') === 200 ? response.data : [], util.rejectError);
    };
    /**
     * @ngdoc method
     * @name getClassHierarchies
     * @methodOf shared.service:ontologyManagerService
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
        const config = { params: { branchId, commitId } };
        return $http.get(prefix + '/' + encodeURIComponent(recordId) + '/class-hierarchies', config)
            .then(response => response.data, util.rejectError);
    };
    /**
     * @ngdoc method
     * @name getOntologyClasses
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Calls the GET /mobirest/ontologies/{recordId}/classes endpoint and retrieves an array of the classes
     * within the ontology.
     *
     * @param {string} recordId The id of the Record the Branch should be part of
     * @param {string} branchId The id of the Branch with the specified Commit
     * @param {string} commitId The id of the Commit to retrieve the ontology from
     * @param {boolean} [applyInProgressCommit=true]  Boolean indicating whether or not any in progress commits by user
     *                                                should be applied to the return value
     * @return {Promise} A promise with an array containing a list of classes
     */
    self.getOntologyClasses = function(recordId, branchId, commitId, applyInProgressCommit = true) {
        const config = { params: { branchId, commitId, applyInProgressCommit} };
        return $http.get(prefix + '/' + encodeURIComponent(recordId) + '/classes', config)
            .then(response => response.data, util.rejectError);
    };
    /**
     * @ngdoc method
     * @name getDataProperties
     * @methodOf shared.service:ontologyManagerService
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
        const config = { params: { branchId, commitId } };
        return $http.get(prefix + '/' + encodeURIComponent(recordId) + '/data-properties', config)
            .then(response => response.data, util.rejectError);
    };
    /**
     * @ngdoc method
     * @name getObjProperties
     * @methodOf shared.service:ontologyManagerService
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
        const config = { params: { branchId, commitId } };
        return $http.get(prefix + '/' + encodeURIComponent(recordId) + '/object-properties', config)
            .then(response => response.data, util.rejectError);
    };
    /**
     * @ngdoc method
     * @name getClassesWithIndividuals
     * @methodOf shared.service:ontologyManagerService
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
        const config = { params: { branchId, commitId } };
        return $http.get(prefix + '/' + encodeURIComponent(recordId) + '/classes-with-individuals', config)
            .then(response => response.data, util.rejectError);
    };
    /**
     * @ngdoc method
     * @name getDataPropertyHierarchies
     * @methodOf shared.service:ontologyManagerService
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
        const config = { params: { branchId, commitId } };
        return $http.get(prefix + '/' + encodeURIComponent(recordId) + '/data-property-hierarchies', config)
            .then(response => response.data, util.rejectError);
    };
    /**
     * @ngdoc method
     * @name getObjectPropertyHierarchies
     * @methodOf shared.service:ontologyManagerService
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
        const config = { params: { branchId, commitId } };
        return $http.get(prefix + '/' + encodeURIComponent(recordId) + '/object-property-hierarchies', config)
            .then(response => response.data, util.rejectError);
    };
    /**
     * @ngdoc method
     * @name getAnnotationPropertyHierarchies
     * @methodOf shared.service:ontologyManagerService
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
        const config = { params: { branchId, commitId } };
        return $http.get(prefix + '/' + encodeURIComponent(recordId) + '/annotation-property-hierarchies', config)
            .then(response => response.data, util.rejectError);
    };
    /**
     * @ngdoc method
     * @name createAnnotation
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Calls the POST /mobirest/ontologies/{recordId}/annotations endpoint and creates a new AnnotationProperty
     * in the ontology. If the annotation already exists in the provided list of annotation IRIs, returns a
     * rejected promise.
     *
     * @param {string} recordId The id of the Record the Branch should be part of
     * @param {string[]} annotationIRIs A list of annotation IRI strings
     * @param {string} iri The IRI for the new AnnotationProperty
     * @return {Promise} A promise with the JSON-LD of the new AnnotationProperty if successful; otherwise
     *      rejects with an error message
     */
    self.createAnnotation = function(recordId, annotationIRIs, iri) {
        const annotationJSON = {'@id': iri, '@type': [prefixes.owl + 'AnnotationProperty']};
        if (indexOf(annotationIRIs, iri) === -1) {
            const config = {
                params: {
                    annotationjson: annotationJSON
                }
            };
            return $http.post(prefix + '/' + encodeURIComponent(recordId) + '/annotations', null, config)
                .then(response => {
                    if (get(response, 'status') === 200) {
                        return annotationJSON;
                    } else {
                        return util.rejectError(response);
                    }
                }, util.rejectError);
        } else {
            return $q.reject('This ontology already has an OWL Annotation declared with that IRI.');
        }
    };
    /**
     * @ngdoc method
     * @name getConceptHierarchies
     * @methodOf shared.service:ontologyManagerService
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
        const config = { params: { branchId, commitId } };
        return $http.get(prefix + '/' + encodeURIComponent(recordId) + '/concept-hierarchies', config)
            .then(response => response.data, util.rejectError);
    };
    /**
     * @ngdoc method
     * @name getConceptSchemeHierarchies
     * @methodOf shared.service:ontologyManagerService
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
        const config = { params: { branchId, commitId } };
        return $http.get(prefix + '/' + encodeURIComponent(recordId) + '/concept-scheme-hierarchies', config)
            .then(response => response.data, util.rejectError);
    };
    /**
     * @ngdoc method
     * @name getImportedOntologies
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Calls the GET /mobirest/ontologies/{recordId}/imported-ontologies endpoint which gets the list of
     * all ontologies imported by the ontology with the requested ontology ID.
     *
     * @param {string} recordId The record ID of the ontology you want to get from the repository.
     * @param {string} branchId The branch ID of the ontology you want to get from the repository.
     * @param {string} commitId The commit ID of the ontology you want to get from the repository.
     * @param {string} [rdfFormat='jsonld'] The format string to identify the serialization requested.
     * @returns {Promise} A promise containing the list of ontologies that are imported by the requested
     * ontology.
     */
    self.getImportedOntologies = function(recordId, branchId, commitId, rdfFormat = 'jsonld') {
        const config = {params: {rdfFormat, branchId, commitId}};
        return $http.get(prefix + '/' + encodeURIComponent(recordId) + '/imported-ontologies', config)
            .then(response => {
                if (get(response, 'status') === 200) {
                    return response.data;
                } else if (get(response, 'status') === 204) {
                    return [];
                } else {
                    return util.rejectError(response);
                }
            }, util.rejectError);
    };
    /**
     * @ngdoc method
     * @name getEntityUsages
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Calls the GET /mobirest/ontologies/{recordId}/entity-usages/{entityIRI} endpoint which gets the
     * JSON SPARQL query results for all statements which have the provided entityIRI as an object.
     *
     * @param {string} recordId The record ID of the ontology you want to get from the repository.
     * @param {string} branchId The branch ID of the ontology you want to get from the repository.
     * @param {string} commitId The commit ID of the ontology you want to get from the repository.
     * @param {string} entityIRI The entity IRI of the entity you want the usages for from the repository.
     * @param {string} queryType The type of query you want to perform (either 'select' or 'construct').
     * @param {string} id The identifier for this request
     * @returns {Promise} A promise containing the JSON SPARQL query results bindings.
     */
    self.getEntityUsages = function(recordId, branchId, commitId, entityIRI, queryType = 'select', id = '') {
        const config = {params: {branchId, commitId, queryType}};
        const url = prefix + '/' + encodeURIComponent(recordId) + '/entity-usages/' + encodeURIComponent(entityIRI);
        const promise = id ? httpService.get(url, config, id) : $http.get(url, config);
        return promise.then(response => {
            if (queryType === 'construct') {
                return response.data;
            } else {
                return response.data.results.bindings;
            }
        }, util.rejectError);
    };
    /**
     * @ngdoc method
     * @name getOntologyEntityNames
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Calls the POST /mobirest/ontologies/{recordId}/entity-names
     *
     * @param {string} recordId The record ID of the ontology to query.
     * @param {string} branchId The branch ID of the ontology to query.
     * @param {string} commitId The commit ID of the ontology to query.
     * @param {boolean} [includeImports=true] Whether to include the imported ontologies data
     * @param {boolean} [applyInProgressCommit=true] Whether to apply the in progress commit changes.
     * @param {string[]} [filterResources = []] The list of resources to filter the entity names query by.
     * @param {string} [id=''] The id to link this REST call to.
     * @return {Promise} A Promise with an object containing EntityNames.
     */
    self.getOntologyEntityNames = function(recordId, branchId, commitId, includeImports = true, applyInProgressCommit= true, filterResources = [], id = '') {
        const config = { params: { branchId, commitId, includeImports, applyInProgressCommit },
            headers: {
                'Content-Type': 'application/json'
            } };
        const url = prefix + '/' + encodeURIComponent(recordId) + '/entity-names';
        const data = {filterResources};
        const promise = id ? httpService.post(url, data, config, id) : $http.post(url, data, config);
        return promise.then(response => response.data, util.rejectError);
    };
    /**
     * @ngdoc method
     * @name getSearchResults
     * @methodOf shared.service:ontologyManagerService
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
        const defaultErrorMessage = 'An error has occurred with your search.';
        const config = { params: { searchText, branchId, commitId } };
        return httpService.get(prefix + '/' + encodeURIComponent(recordId) + '/search-results', config, id)
            .then(response => {
                if (get(response, 'status') === 200) {
                    return response.data;
                } else if (get(response, 'status') === 204) {
                    return [];
                } else {
                    return $q.reject(defaultErrorMessage);
                }
            }, response => util.rejectError(response, defaultErrorMessage));
    };
    /**
     * @ngdoc method
     * @name getQueryResults
     *
     * @description
     * Get the results of the provided SPARQL query.
     *
     * @param {string} recordId The record ID of the ontology to query.
     * @param {string} branchId The branch ID of the ontology to query.
     * @param {string} commitId The commit ID of the ontology to query.
     * @param {string} query The SPARQL query to run against the ontology.
     * @param {string} format The return format of the query results.
     * @param {string} [id=''] The id to link this REST call to.
     * @param {boolean} [includeImports=true] Whether to include the imported ontologies data
     * @param {boolean} [applyInProgressCommit=true] Whether to apply the in progress commit changes
     * @return {Promise} A promise containing the SPARQL query results
     */
    self.getQueryResults = function(recordId, branchId, commitId, query, format,  id = '', includeImports = true, applyInProgressCommit = false) {
        const config = { params: { query, branchId, commitId, format, includeImports, applyInProgressCommit } };
        const url = prefix + '/' + encodeURIComponent(recordId) + '/query';
        const promise = id ? httpService.get(url, config, id) : $http.get(url, config);
        return promise.then(response => response.data, util.rejectError);
    };
    /**
     * @ngdoc method
     * @name getFailedImports
     * @methodOf shared.service:ontologyManagerService
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
        const config = { params: { branchId, commitId } };
        return $http.get(prefix + '/' + encodeURIComponent(recordId) + '/failed-imports', config)
            .then(response => response.data, util.rejectError);
    };
    /**
     * @ngdoc method
     * @name getEntityAndBlankNodes
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Calls the GET /mobirest/ontologies/{recordId}/entities/{entityIRI} endpoint which gets the RDF of the entity with
     * the specified IRI along with all its linked blank nodes. Accepts the RDF format to return the RDF in, whether to
     * include imports, and whether to apply the in progress commit.
     *
     * @param {string} recordId The record ID of the ontology you want to get from the repository
     * @param {string} branchId The branch ID of the ontology you want to get from the repository
     * @param {string} commitId The commit ID of the ontology you want to get from the repository
     * @param {string} entityId The entity IRI of the entity you want to retrieve
     * @param {string} [format='jsonld'] The RDF format to return the results in
     * @param {boolean} [includeImports=true] Whether to include the imported ontologies data
     * @param {boolean} [applyInProgressCommit=true] Whether to apply the in progress commit changes
     * @param {string} [id=''] The id to link this REST call to
     * @return {Promise} A promise containing the RDF of the specified entity and its blank nodes
     */
    self.getEntityAndBlankNodes = function(recordId, branchId, commitId, entityId, format = 'jsonld', includeImports = true, applyInProgressCommit = true, id = '')  {
        const config = { params: { branchId, commitId, format, includeImports, applyInProgressCommit } };
        const url = prefix + '/' + encodeURIComponent(recordId) + '/entities/' + encodeURIComponent(entityId);
        const promise = id ? httpService.get(url, config, id) : $http.get(url, config);
        return promise.then(response => response.data, util.rejectError);
    };
    /**
     * @ngdoc method
     * @name isDeprecated
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Checks if the provided entity is deprecated by looking for the owl:deprecated annotation.
     *
     * @param {Object} entity The entity you want to check.
     * @return {boolean} Returns true if the owl:deprecated value is "true" or "1", otherwise returns false.
     */
    self.isDeprecated = function(entity) {
        const deprecated = util.getPropertyValue(entity, prefixes.owl + 'deprecated');
        return deprecated === 'true' || deprecated === '1';
    };
    /**
     * @ngdoc method
     * @name isOntology
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Checks if the provided entity is an owl:Ontology entity. Returns a boolean.
     *
     * @param {Object} entity The entity you want to check.
     * @returns {boolean} Returns true if it is an owl:Ontology entity, otherwise returns false.
     */
    self.isOntology = function(entity) {
        return includes(get(entity, '@type', []), prefixes.owl + 'Ontology');
    };
    /**
     * @ngdoc method
     * @name isOntologyRecord
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Checks if the provided entity is an ontologyEditor:OntologyRecord entity. Returns a boolean.
     *
     * @param {Object} entity The entity you want to check.
     * @returns {boolean} Returns true if it is an ontologyEditor:OntologyRecord entity, otherwise returns false.
     */
    self.isOntologyRecord = function(entity) {
        return includes(get(entity, '@type', []), prefixes.ontologyEditor + 'OntologyRecord');
    };
    /**
     * @ngdoc method
     * @name hasOntologyEntity
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Checks if the provided ontology contains an ontology entity. Returns a boolean.
     *
     * @param {Object[]} ontology The ontology to search through.
     * @returns {boolean} Returns true if it finds an entity with @type owl:Ontology entity, otherwise returns
     * false.
     */
    self.hasOntologyEntity = function(ontology) {
        return some(ontology, entity => self.isOntology(entity));
    };
    /**
     * @ngdoc method
     * @name getOntologyEntity
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Gets the ontology entity from the provided ontology. Returns an Object.
     *
     * @param {Object[]} ontology The ontology to search through.
     * @returns {Object} Returns the ontology entity.
     */
    self.getOntologyEntity = function(ontology) {
        return find(ontology, entity => self.isOntology(entity));
    };
    /**
     * @ngdoc method
     * @name getOntologyIRI
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Gets the ontology entity IRI from the provided ontology. Returns a string representing the ontology IRI.
     *
     * @param {Object[]} ontology The ontology to search through.
     * @returns {Object} Returns the ontology entity IRI.
     */
    self.getOntologyIRI = function(ontology) {
        const entity = self.getOntologyEntity(ontology);
        return get(entity, '@id', '');
    };
    /**
     * @ngdoc method
     * @name isDatatype
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     *Checks if the provided entity is an rdfs:Datatype. Returns a booelan.
        *
        * @param {Object} entity The entity you want to check
        * @return {boolean} Returns true if it is an rdfs:Datatype entity, otherwise returns false.
        */
    self.isDatatype = function(entity) {
        return includes(get(entity, '@type', []), prefixes.rdfs + 'Datatype');
    };
    /**
     * @ngdoc method
     * @name isClass
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Checks if the provided entity is an owl:Class entity. Returns a boolean.
     *
     * @param {Object} entity The entity you want to check.
     * @returns {boolean} Returns true if it is an owl:Class entity, otherwise returns false.
     */
    self.isClass = function(entity) {
        return includes(get(entity, '@type', []), prefixes.owl + 'Class');
    };
    /**
     * @ngdoc method
     * @name hasClasses
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Checks if the provided ontologies contain any owl:Class entities. Returns a boolean.
     *
     * @param {Object[]} ontologies The array of ontologies you want to check.
     * @returns {boolean} Returns true if there are any owl:Class entities in the ontologies, otherwise returns
     * false.
     */
    self.hasClasses = function(ontologies) {
        return some(ontologies, ont => some(ont, entity => self.isClass(entity) && !self.isBlankNode(entity)));
    };
    /**
     * @ngdoc method
     * @name getClasses
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Gets the list of all owl:Class entities within the provided ontologies that are not blank nodes. Returns
     * an Object[].
     *
     * @param {Object[]} ontologies The array of ontologies you want to check.
     * @returns {Object[]} An array of all owl:Class entities within the ontologies.
     */
    self.getClasses = function(ontologies) {
        return collectThings(ontologies, entity => self.isClass(entity) && !self.isBlankNode(entity));
    };
    /**
     * @ngdoc method
     * @name getClassIRIs
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Gets the list of all owl:Class entity IRIs within the provided ontologies that are not blank nodes.
     * Returns a string[].
     *
     * @param {Object[]} ontologies The array of ontologies you want to check.
     * @returns {string[]} An array of all owl:Class entity IRI strings within the ontologies.
     */
    self.getClassIRIs = function(ontologies) {
        return map(self.getClasses(ontologies), '@id');
    };
    /**
     * @ngdoc method
     * @name hasClassProperties
     * @methodOf shared.service:ontologyManagerService
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
        return some(ontologies, ont => some(ont, {[prefixes.rdfs + 'domain']: [{'@id': classIRI}]}));
    };
    /**
     * @ngdoc method
     * @name getClassProperties
     * @methodOf shared.service:ontologyManagerService
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
        return collectThings(ontologies, entity => isMatch(entity, {[prefixes.rdfs + 'domain']: [{'@id': classIRI}]}));
    };
    /**
     * @ngdoc method
     * @name getClassProperties
     * @methodOf shared.service:ontologyManagerService
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
        return map(self.getClassProperties(ontologies, classIRI), '@id');
    };
    /**
     * @ngdoc method
     * @name isObjectProperty
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Checks if the provided entity is an owl:ObjectProperty entity. Returns a boolean.
     *
     * @param {Object} entity The entity you want to check.
     * @returns {boolean} Returns true if it is an owl:ObjectProperty entity, otherwise returns false.
     */
    self.isObjectProperty = function(entity) {
        return includes(get(entity, '@type', []), prefixes.owl + 'ObjectProperty');
    };
    /**
     * @ngdoc method
     * @name hasObjectProperties
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Checks if the provided ontologies contain any owl:ObjectProperty entities. Returns a boolean.
     *
     * @param {Object[]} ontologies The array of ontologies you want to check.
     * @returns {boolean} Returns true if there are any owl:ObjectProperty entities in the ontologies, otherwise
     * returns false.
     */
    self.hasObjectProperties = function(ontologies) {
        return some(ontologies, ont => some(ont, entity => self.isObjectProperty(entity) && !self.isBlankNode(entity)));
    };
    /**
     * @ngdoc method
     * @name getObjectProperties
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Gets the list of all owl:ObjectProperty entities within the provided ontologies that are not blank nodes.
     * Returns an Object[].
     *
     * @param {Object[]} ontologies The array of ontologies you want to check.
     * @returns {Object[]} An array of all owl:ObjectProperty entities within the ontologies.
     */
    self.getObjectProperties = function(ontologies) {
        return collectThings(ontologies, entity => self.isObjectProperty(entity) && !self.isBlankNode(entity));
    };
    /**
     * @ngdoc method
     * @name getObjectPropertyIRIs
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Gets the list of all owl:ObjectProperty entity IRIs within the provided ontologies that are not blank
     * nodes. Returns an string[].
     *
     * @param {Object[]} ontologies The array of ontologies you want to check.
     * @returns {string[]} An array of all owl:ObjectProperty entity IRI strings within the ontologies.
     */
    self.getObjectPropertyIRIs = function(ontologies) {
        return map(self.getObjectProperties(ontologies), '@id');
    };
    /**
     * @ngdoc method
     * @name isDataTypeProperty
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Checks if the provided entity is an owl:DatatypeProperty entity. Returns a boolean.
     *
     * @param {Object} entity The entity you want to check.
     * @returns {boolean} Returns true if it is an owl:DatatypeProperty entity, otherwise returns false.
     */
    self.isDataTypeProperty = function(entity) {
        const types = get(entity, '@type', []);
        return includes(types, prefixes.owl + 'DatatypeProperty')
            || includes(types, prefixes.owl + 'DataTypeProperty');
    };
    /**
     * @ngdoc method
     * @name hasDataTypeProperties
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Checks if the provided ontologies contain any owl:DatatypeProperty entities. Returns a boolean.
     *
     * @param {Object[]} ontologies The array of ontologies you want to check.
     * @returns {boolean} Returns true if there are any owl:DatatypeProperty entities in the ontologies,
     * otherwise returns false.
     */
    self.hasDataTypeProperties = function(ontologies) {
        return some(ontologies, ont => some(ont, entity => self.isDataTypeProperty(entity)));
    };
    /**
     * @ngdoc method
     * @name getDataTypeProperties
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Gets the list of all owl:DatatypeProperty entities within the provided ontologies that are not blank
     * nodes. Returns an Object[].
     *
     * @param {Object[]} ontologies The array of ontologies you want to check.
     * @returns {Object[]} An array of all owl:DatatypeProperty entities within the ontologies.
     */
    self.getDataTypeProperties = function(ontologies) {
        return collectThings(ontologies, entity => self.isDataTypeProperty(entity) && !self.isBlankNode(entity));
    };
    /**
     * @ngdoc method
     * @name getDataTypePropertyIRIs
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Gets the list of all owl:DatatypeProperty entity IRIs within the provided ontologies that are not blank
     * nodes. Returns an string[].
     *
     * @param {Object[]} ontologies The array of ontologies you want to check.
     * @returns {string[]} An array of all owl:DatatypeProperty entity IRI strings within the ontologies.
     */
    self.getDataTypePropertyIRIs = function(ontologies) {
        return map(self.getDataTypeProperties(ontologies),'@id');
    };
    /**
     * @ngdoc method
     * @name isProperty
     * @methodOf shared.service:ontologyManagerService
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
    };
    /**
     * @ngdoc method
     * @name hasNoDomainProperties
     * @methodOf shared.service:ontologyManagerService
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
        return some(ontologies, ont =>
                    some(ont, entity => self.isProperty(entity) && !has(entity, prefixes.rdfs + 'domain')));
    };
    /**
     * @ngdoc method
     * @name getNoDomainProperties
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Gets the list of properties that are not associated with a class by the rdfs:domain axiom. Returns an
     * array of the properties not associated with a class.
     *
     * @param {Object[]} ontologies The array of ontologies you want to check.
     * @returns {Object[]} Returns an array of properties not associated with a class.
     */
    self.getNoDomainProperties = function(ontologies) {
        return collectThings(ontologies, entity => self.isProperty(entity) && !has(entity, prefixes.rdfs + 'domain'));
    };
    /**
     * @ngdoc method
     * @name getNoDomainPropertyIRIs
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Gets the list of property IRIs that are not associated with a class by the rdfs:domain axiom. Returns an
     * array of the property IRIs not associated with a class.
     *
     * @param {Object[]} ontologies The array of ontologies you want to check.
     * @returns {string[]} Returns an array of property IRIs not associated with a class.
     */
    self.getNoDomainPropertyIRIs = function(ontologies) {
        return map(self.getNoDomainProperties(ontologies), '@id');
    };
    /**
     * @ngdoc method
     * @name isAnnotation
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Checks if the provided entity is an owl:AnnotationProperty entity. Returns a boolean.
     *
     * @param {Object} entity The entity you want to check.
     * @returns {boolean} Returns true if it is an owl:AnnotationProperty entity, otherwise returns false.
     */
    self.isAnnotation = function(entity) {
        return includes(get(entity, '@type', []), prefixes.owl + 'AnnotationProperty');
    };
    /**
     * @ngdoc method
     * @name hasAnnotations
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Checks if the provided ontologies contain any owl:AnnotationProperty entities. Returns a boolean.
     *
     * @param {Object[]} ontologies The array of ontologies you want to check.
     * @returns {boolean} Returns true if there are any owl:AnnotationProperty entities in the ontologies,
     * otherwise returns false.
     */
    self.hasAnnotations = function(ontologies) {
        return some(ontologies, ont =>
                    some(ont, entity => self.isAnnotation(entity) && !self.isBlankNode(entity)));
    };
    /**
     * @ngdoc method
     * @name getAnnotations
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Gets the list of all owl:AnnotationProperty entities within the provided ontologies. Returns an Object[].
     *
     * @param {Object[]} ontologies The array of ontologies you want to check.
     * @returns {Object[]} An array of all owl:AnnotationProperty entities within the ontologies.
     */
    self.getAnnotations = function(ontologies) {
        return collectThings(ontologies, entity => self.isAnnotation(entity) && !self.isBlankNode(entity));
    };
    /**
     * @ngdoc method
     * @name getAnnotationIRIs
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Gets the list of all owl:AnnotationProperty entity IRIs within the provided ontologies that are not blank
     * nodes. Returns an string[].
     *
     * @param {Object[]} ontologies The array of ontologies you want to check.
     * @returns {string[]} An array of all owl:AnnotationProperty entity IRI strings within the ontologies.
     */
    self.getAnnotationIRIs = function(ontologies) {
        return map(self.getAnnotations(ontologies), '@id');
    };
    /**
     * @ngdoc method
     * @name isNamedIndividual
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Checks if the provided entity is an owl:NamedIndividual entity. Returns a boolean.
     *
     * @param {Object} entity The entity you want to check.
     * @returns {boolean} Returns true if it is an owl:NamedIndividual entity, otherwise returns false.
     */
    self.isNamedIndividual = function(entity) {
        return includes(get(entity, '@type', []), prefixes.owl + 'NamedIndividual');
    };
    /**
     * @ngdoc method
     * @name isIndividual
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Checks if the provided entity is an individual (i.e. not a standard owl: type). Returns a boolean.
     *
     * @param {Object} entity The entity you want to check.
     * @returns {boolean} Returns true if it is an individual, otherwise returns false.
     */
    self.isIndividual = function(entity) {
        return intersection(get(entity, '@type', []), [
            prefixes.owl + 'Class',
            prefixes.owl + 'DatatypeProperty',
            prefixes.owl + 'ObjectProperty',
            prefixes.owl + 'AnnotationProperty',
            prefixes.owl + 'Datatype',
            prefixes.owl + 'Ontology'
        ]).length === 0;
    };
    /**
     * @ngdoc method
     * @name hasIndividuals
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Checks to see if the ontologies have individuals. Returns a boolean indicating the existence of those
     * individuals.
     *
     * @param {Object[]} ontologies The array of ontologies you want to check.
     * @returns {boolean} Returns true if it does have individuals, otherwise returns false.
     */
    self.hasIndividuals = function(ontologies) {
        return some(ontologies, ont => some(ont, entity => self.isIndividual(entity)));
    };
    /**
     * @ngdoc method
     * @name getIndividuals
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Gets the list of all owl:NamedIndividual entities within the provided ontologies. Returns an Object[].
     *
     * @param {Object[]} ontologies The array of ontologies you want to check.
     * @returns {Object[]} An array of all owl:NamedIndividual entities within the ontologies.
     */
    self.getIndividuals = function(ontologies) {
        return collectThings(ontologies, entity => self.isIndividual(entity));
    };
    /**
     * @ngdoc method
     * @name hasNoTypeIndividuals
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Checks to see if the ontologies have individuals with no other type. Returns a boolean indicating the
     * existence of those individuals.
     *
     * @param {Object[]} ontologies The array of ontologies you want to check.
     * @returns {boolean} Returns true if it does have individuals with no other type, otherwise returns false.
     */
    self.hasNoTypeIndividuals = function(ontologies) {
        return some(ontologies, ont =>
                    some(ont, entity => self.isIndividual(entity) && entity['@type'].length === 1));
    };
    /**
     * @ngdoc method
     * @name getNoTypeIndividuals
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Gets the list of all owl:NamedIndividual entities within the provided ontologies that have no other type.
     * Returns an Object[].
     *
     * @param {Object[]} ontologies The array of ontologies you want to check.
     * @returns {Object[]} An array of all owl:NamedIndividual entities with no other type within the ontologies.
     */
    self.getNoTypeIndividuals = function(ontologies) {
        return collectThings(ontologies, entity => self.isIndividual(entity) && entity['@type'].length === 1);
    };
    /**
     * @ngdoc method
     * @name hasClassIndividuals
     * @methodOf shared.service:ontologyManagerService
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
        return some(self.getIndividuals(ontologies), {'@type': [classIRI]});
    };
    /**
     * @ngdoc method
     * @name getClassIndividuals
     * @methodOf shared.service:ontologyManagerService
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
        return filter(self.getIndividuals(ontologies), {'@type': [classIRI]});
    };
    /**
     * @ngdoc method
     * @name isRestriction
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Checks if the provided entity is an owl:Restriction. Returns a boolean.
     *
     * @param {Object} entity The entity you want to check.
     * @returns {boolean} Returns true if it is an owl:Restriction entity, otherwise returns false.
     */
    self.isRestriction = function(entity) {
        return includes(get(entity, '@type', []), prefixes.owl + 'Restriction');
    };
    /**
     * @ngdoc method
     * @name getRestrictions
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Gets the list of all owl:Restriction entities within the provided ontologies. Returns an Object[].
     *
     * @param {Object[]} ontologies The array of ontologies you want to check.
     * @returns {Object[]} An array of all owl:Restriction entities within the ontologies.
     */
    self.getRestrictions = function(ontologies) {
        return collectThings(ontologies, entity => self.isRestriction(entity));
    };
    /**
     * @ngdoc method
     * @name isBlankNode
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Checks if the provided entity is blank node. Returns a boolean.
     *
     * @param {Object} entity The entity you want to check.
     * @returns {boolean} Returns true if it is a blank node entity, otherwise returns false.
     */
    self.isBlankNode = function(entity) {
        return self.isBlankNodeId(get(entity, '@id', ''));
    };
    /**
     * @ngdoc method
     * @name isBlankNodeId
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Checks if the provided entity id is a blank node id. Returns a boolean.
     *
     * @param {string} id The id to check.
     * @return {boolean} Retrurns true if the id is a blank node id, otherwise returns false.
     */
    self.isBlankNodeId = function(id) {
        return isString(id) && (includes(id, '/.well-known/genid/') || includes(id, '_:genid') || includes(id, '_:b'));
    };
    /**
     * @ngdoc method
     * @name getBlankNodes
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Gets the list of all entities within the provided ontologies that are blank nodes. Returns an Object[].
     *
     * @param {Object[]} ontologies The array of ontologies you want to check.
     * @returns {Object[]} An array of all owl:Restriction entities within the ontologies.
     */
    self.getBlankNodes = function(ontologies) {
        return collectThings(ontologies, entity => self.isBlankNode(entity));
    };
    /**
     * @ngdoc method
     * @name getEntity
     * @methodOf shared.service:ontologyManagerService
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
        let retValue;
        forEach(ontologies, ont => {
            retValue = find(ont, {'@id': entityIRI});
            if (retValue !== null) {
                return false; //This breaks the loop. It is NOT the entire function's return value!
            }
        });
        return retValue;
    };
    /**
     * @ngdoc method
     * @name getEntityName
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Gets the provided entity's name. This name is either the `rdfs:label`, `dcterms:title`, or `dc:title`.
     * If none of those annotations exist, it returns the beautified `@id`. Prioritizes english language tagged
     * values over the others. Returns a string for the entity name.
     *
     * @param {Object} entity The entity you want the name of.
     * @returns {string} The beautified IRI string.
     */
    self.getEntityName = function(entity) {
        let result = reduce(self.entityNameProps, (tempResult, prop) => tempResult || getPrioritizedValue(entity, prop), '');
        if (!result && has(entity, '@id')) {
            result = utilService.getBeautifulIRI(entity['@id']);
        }
        return result;
    };
    function getPrioritizedValue(entity, prop) {
        return get(find(get(entity, '[\'' + prop + '\']'), {'@language': 'en'}), '@value') || utilService.getPropertyValue(entity, prop);
    }
    /**
     * @ngdoc method
     * @name getEntityNames
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Gets the provided entity's names. These names are an array of the '@value' values for the self.entityNameProps.
     *
     * @param {Object} entity The entity you want the names of.
     * @returns {string[]} The names for the self.entityNameProps.
     */
    self.getEntityNames = function(entity) {
        let names = [];
        forEach(self.entityNameProps, prop => {
            if (has(entity, prop)) {
                names = concat(names, map(get(entity, prop), '@value'));
            } 
        });
        return uniq(names);
    };
    /**
     * @ngdoc method
     * @name getEntityDescription
     * @methodOf shared.service:ontologyManagerService
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
    };
    /**
     * @ngdoc method
     * @name isConcept
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Checks if the provided entity is an skos:Concept entity. Returns a boolean.
     *
     * @param {Object} entity The entity you want to check.
     * @param {string[]} derivedConcepts A list of IRIs of classes that are subclasses of skos:Concept
     * @returns {boolean} Returns true if it is an skos:Concept entity, otherwise returns false.
     */
    self.isConcept = function(entity, derivedConcepts = []) {
            return (includes(get(entity, '@type', []), prefixes.skos + 'Concept')
                || intersection(get(entity, '@type', []), derivedConcepts).length > 0);
    };
    /**
     * @ngdoc method
     * @name hasConcepts
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Checks if the provided ontologies contain any skos:Concept entities. Returns a boolean.
     *
     * @param {Object[]} ontologies The array of ontologies you want to check.
     * @param {string[]} derivedConcepts A list of IRIs of classes that are subclasses of skos:Concept
     * @returns {boolean} Returns true if there are any skos:Concept entities in the ontologies, otherwise
     * returns false.
     */
    self.hasConcepts = function(ontologies, derivedConcepts) {
        return some(ontologies, ont =>
                    some(ont, entity => self.isConcept(entity, derivedConcepts) && !self.isBlankNode(entity)));
    };
    /**
     * @ngdoc method
     * @name getConcepts
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Gets the list of all skos:Concept entities within the provided ontologies that are not blank nodes.
     * Returns an Object[].
     *
     * @param {Object[]} ontologies The array of ontologies you want to check.
     * @param {string[]} derivedConcepts A list of IRIs of classes that are subclasses of skos:Concept
     * @returns {Object[]} An array of all skos:Concept entities within the ontologies.
     */
    self.getConcepts = function(ontologies, derivedConcepts) {
        return collectThings(ontologies, entity => self.isConcept(entity, derivedConcepts) && !self.isBlankNode(entity));
    };
    /**
     * @ngdoc method
     * @name getConceptIRIs
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Gets the list of all skos:Concept entity IRIs within the provided ontologies that are not blank nodes.
     * Returns an string[].
     *
     * @param {Object[]} ontologies The array of ontologies you want to check.
     * @param {string[]} derivedConcepts A list of IRIs of classes that are subclasses of skos:Concept
     * @returns {string[]} An array of all skos:Concept entity IRI strings within the ontologies.
     */
    self.getConceptIRIs = function(ontologies, derivedConcepts) {
        return map(self.getConcepts(ontologies, derivedConcepts), '@id');
    };
    /**
     * @ngdoc method
     * @name isConceptScheme
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Checks if the provided entity is an skos:ConceptScheme entity. Returns a boolean.
     *
     * @param {Object} entity The entity you want to check.
     * @param {string[]} derivedConceptSchemes A list of IRIs of classes that are subclasses of skos:ConceptScheme
     * @returns {boolean} Returns true if it is an skos:ConceptScheme entity, otherwise returns false.
     */
    self.isConceptScheme = function(entity, derivedConceptSchemes = []) {
            return (includes(get(entity, '@type', []), prefixes.skos + 'ConceptScheme')
                || intersection(get(entity, '@type', []), derivedConceptSchemes).length > 0);
    };
    /**
     * @ngdoc method
     * @name hasConceptSchemes
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Checks if the provided ontologies contain any skos:ConceptScheme entities. Returns a boolean.
     *
     * @param {Object[]} ontologies The array of ontologies you want to check.
     * @param {string[]} derivedConceptSchemes A list of IRIs of classes that are subclasses of skos:ConceptScheme
     * @returns {boolean} Returns true if there are any skos:ConceptScheme entities in the ontologies, otherwise
     * returns false.
     */
    self.hasConceptSchemes = function(ontologies, derivedConceptSchemes) {
        return some(ontologies, ont =>
                    some(ont, entity => self.isConceptScheme(entity, derivedConceptSchemes) && !self.isBlankNode(entity)));
    };
    /**
     * @ngdoc method
     * @name getConceptSchemes
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Gets the list of all skos:ConceptScheme entities within the provided ontologies that are not blank nodes.
     * Returns an Object[].
     *
     * @param {Object[]} ontologies The array of ontologies you want to check.
     * @param {string[]} derivedConceptSchemes A list of IRIs of classes that are subclasses of skos:ConceptScheme
     * @returns {Object[]} An array of all skos:ConceptScheme entities within the ontologies.
     */
    self.getConceptSchemes = function(ontologies, derivedConceptSchemes) {
        return collectThings(ontologies, entity => self.isConceptScheme(entity, derivedConceptSchemes) && !self.isBlankNode(entity));
    };
    /**
     * @ngdoc method
     * @name getConceptSchemeIRIs
     * @methodOf shared.service:ontologyManagerService
     *
     * @description
     * Gets the list of all skos:ConceptScheme entity IRIs within the provided ontologies that are not blank
     * nodes. Returns a string[].
     *
     * @param {Object[]} ontologies The array of ontologies you want to check.
     * @param {string[]} derivedConceptSchemes A list of IRIs of classes that are subclasses of skos:ConceptScheme
     * @returns {string[]} An array of all skos:ConceptScheme entity IRI strings within the ontology.
     */
    self.getConceptSchemeIRIs = function(ontologies, derivedConceptSchemes) {
        return map(self.getConceptSchemes(ontologies, derivedConceptSchemes), '@id');
    };
    /**
     * @description
     * Compressing a file before uploading.
     * @param {File} file The ontology file.
     * @returns {file} compressed file
     */
    self.compressFile = function(file) {
        const reader = new FileReader();
        const zip = new jszip();
        if (file && file.size) {
            reader.readAsArrayBuffer(file); 
        } else {
            Promise.resolve(file);
        }
        return new Promise((resolve, reject) => {
            reader.onload = (evt) => {
                try {
                    zip.file(file.name, evt.target.result);
                    zip.generateAsync({type: 'blob', compression:'DEFLATE'})
                        .then((content) => {
                            let fl = new File([content], file.name + '.zip')
                            resolve(fl)
                        })
                } catch (error) {
                    reject(error);
                }
            };
        });
    };

    function getFileTitleInfo(title) {
        const fileName = title.toLowerCase().split('.');
        return {
            title: title.toLowerCase(),
            name: fileName.slice(0,1)[0],
            ext: fileName.slice(-1)[0]
        };
    }

    function collectThings(ontologies, filterFunc) {
        const things = [];
        const iris = [];
        forEach(ontologies, ont => {
            forEach(filter(ont, entity => !includes(iris, get(entity, '@id')) && filterFunc(entity)), entity => {
                things.push(entity);
                iris.push(get(entity, '@id'));
            });
        });
        return things;
    }
}

export default ontologyManagerService;
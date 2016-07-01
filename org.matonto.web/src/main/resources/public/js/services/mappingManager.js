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
         * @name mappingManager
         * @requires ontologyManager
         * @requires prefixes
         *
         * @description 
         * The `mappingManager` module only provides the `mappingManagerService` service which
         * provides access to the MatOnto mapping REST endpoints and utility functions for  
         * manipulating mapping arrays
         */
        .module('mappingManager', ['ontologyManager', 'prefixes'])
        /**
         * @ngdoc service
         * @name mappingManager.service:mappingManagerService
         * @requires $window
         * @requires $rootScope
         * @requires $filter
         * @requires $http
         * @requires $q
         * @requires prefixes.service:prefixes
         * @requires ontologyManager.service:ontologyManagerService
         * @requires uuid
         *
         * @description 
         * `mappingManagerService` is a service that provides access to the MatOnto mapping REST 
         * endpoints and utility functions for editing/creating mapping arrays and accessing 
         * various aspects of mapping arrays.
         */
        .service('mappingManagerService', mappingManagerService);

        mappingManagerService.$inject = ['$window', '$rootScope', '$filter', '$http', '$q', 'ontologyManagerService', 'prefixes', 'uuid'];

        function mappingManagerService($window, $rootScope, $filter, $http, $q, ontologyManagerService, prefixes, uuid) {
            var self = this,
                prefix = '/matontorest/mappings';

            /**
             * @ngdoc property
             * @name previousMappingNames
             * @propertyOf mappingManager.service:mappingManagerService
             * @type {string[]}
             *
             * @description 
             * `previousMappingNames` holds an array of the local names of all saved mappings in the
             * MatOnto repository
             */
            self.previousMappingNames = [];
            /**
             * @ngdoc property
             * @name mapping
             * @propertyOf mappingManager.service:mappingManagerService
             * @type {Object}
             *
             * @description 
             * `mapping` holds the mapping object of the mapping being currently viewed/edited.
             * The structure of the object is:
             * ```
             * {
             *    name: '',
             *    jsonld: []
             * }
             * ```
             */
            self.mapping = undefined;
            /**
             * @ngdoc property
             * @name sourceOntologies
             * @propertyOf mappingManager.service:mappingManagerService
             * @type {Object[]}
             *
             * @description 
             * `sourceOntologies` holds an array of all the ontologies used for the currently selected 
             * mapping. This includes the source ontology as specified by the mapping array and the 
             * imports closure of that ontology.
             */
            self.sourceOntologies = [];

            initialize();

            function initialize() {
                $http.get(prefix, {})
                    .then(response => {
                        self.previousMappingNames = response.data;
                    });
            }

            // REST endpoint calls
            /**
             * @ngdoc method
             * @name upload
             * @methodOf mappingManager.mappingManagerService
             *
             * @description
             * Calls the POST /matontorest/mappings endpoint which uploads a mapping to the MatOnto 
             * repository with a generated IRI. Returns a promise with the IRI of the newly uploaded 
             * mapping.
             * 
             * @param {Object[]} mapping The JSON-LD object of a mapping
             * @returns {Promise} A promise with the IRI of the uploaded mapping
             */
            self.upload = function(mapping) {
                var deferred = $q.defer(),
                    fd = new FormData(),
                    config = {
                        transformRequest: angular.identity,
                        headers: {
                            'Content-Type': undefined,
                            'Accept': 'text/plain'
                        }
                    };
                fd.append('jsonld', angular.toJson(mapping));

                $rootScope.showSpinner = true;
                $http.post(prefix, fd, config)
                    .then(response => {
                        self.previousMappingNames = _.union(self.previousMappingNames, [response.data]);
                        deferred.resolve(response.data);
                    }, response => {
                        deferred.reject(_.get(response, 'statusText', ''));
                    }).then(() => {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
            }
            
            /**
             * @ngdoc method
             * @name getMapping
             * @methodOf mappingManager.mappingManagerService
             *
             * @description
             * Calls the GET /matontorest/mappings/{mappingName} endpoint which returns the JSONL-LD
             * of a saved mapping. Returns a promise with "@graph" of the mapping.
             * 
             * @param {string} mappingName The IRI for the mapping with the user-defined local name
             * @returns {Promise} A promise with the JSON-LD of the uploaded mapping
             */
            self.getMapping = function(mappingId) {
                var deferred = $q.defer();
                $rootScope.showSpinner = true;
                $http.get(prefix + '/' + encodeURIComponent(mappingId))
                    .then(response => {
                        deferred.resolve(_.get(response.data, '@graph', []));
                    }, response => {
                        deferred.reject(_.get(response, 'statusText', ''));
                    }).then(() => {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
            }
            /**
             * @ngdoc method
             * @name downloadMapping
             * @methodOf mappingManager.mappingManagerService
             *
             * @description
             * Calls the GET /matontorest/mappings/{mappingName} endpoint using the `window.open` function
             * which will start a download of the JSON-LD of a saved mapping.
             * 
             * @param {string} mappingName The IRI for the mapping with the user-defined local name
             */
            self.downloadMapping = function(mappingId) {
                $window.location = prefix + '/' + encodeURIComponent(mappingId);
            }
            /**
             * @ngdoc method
             * @name deleteMapping
             * @methodOf mappingManager.mappingManagerService
             *
             * @description
             * Calls the DELETE /matontorest/mappings/{mappingName} endpoint which deleted the specified
             * mapping from the MatOnto repository. Returns a promise with the success of the deletion.
             * 
             * @param {string} mappingName The IRI for the mapping with the user-defined local name
             * @returns {Promise} A promise with a boolean indication the success of the deletion.
             */
            self.deleteMapping = function(mappingId) {
                var deferred = $q.defer();
                $rootScope.showSpinner = true;
                $http.delete(prefix + '/' + encodeURIComponent(mappingId))
                    .then(response => {
                        _.pull(self.previousMappingNames, mappingId);
                        deferred.resolve();
                    }, response => {
                        deferred.reject(_.get(response, 'statusText', ''));
                    }).then(() => {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
            }
            self.getMappingName = function(mappingId) {
                return typeof mappingId === 'string' ? mappingId.replace(prefixes.mappings, '') : '';
            }
            self.getMappingId = function(mappingName) {
                return prefixes.mappings + mappingName;
            }

            // Edit mapping methods 
            /**
             * @ngdoc method
             * @name createNewMapping
             * @methodOf mappingManager.mappingManagerService
             *
             * @description
             * Creates a new mapping array with only the mapping entity defined with the passed IRI.
             *
             * @param {string} iri The IRI of the new mapping
             * @returns {Object[]} A new mapping array
             */
            self.createNewMapping = function(iri) {
                var jsonld = [];
                var mappingEntity = {
                    '@id': iri,
                    '@type': [prefixes.delim + 'Mapping']
                };
                jsonld.push(mappingEntity);
                return jsonld;
            }
            /**
             * @ngdoc method
             * @name setSourceOntology
             * @methodOf mappingManager.mappingManagerService
             *
             * @description
             * Sets the `sourceOntology` property to a mapping's Document entity. Returns a new copy 
             * of the mapping.
             *
             * @param {Object[]} mapping The mapping JSON-LD array
             * @param {string} ontologyId The id of the ontology to set as the source ontology
             * @returns {Object[]} The edited mapping array
             */
            self.setSourceOntology = function(mapping, ontologyId) {
                var newMapping = angular.copy(mapping);
                var mappingEntity = getMappingEntity(newMapping);
                mappingEntity[prefixes.delim + 'sourceOntology'] = [{'@id': ontologyId}];
                return newMapping;
            }
            /**
             * @ngdoc method
             * @name addClass
             * @methodOf mappingManager.mappingManagerService
             *
             * @description
             * Adds a class mapping to a mapping based on the given class Id. The class must be present 
             * in the passed ontology. Returns a new copy of the mapping.
             * 
             * @param {Object[]} mapping The mapping JSON-LD array
             * @param {Object} ontology The ontology object to search for the class in
             * @param {string} classId The id of the class in the ontology
             * @returns {Object[]} The edited mapping array
             */
            self.addClass = function(mapping, ontology, classId) {
                var newMapping = angular.copy(mapping);
                // Check if class exists in ontology
                if (ontologyManagerService.getClass(ontology, classId)) {
                    // Collect IRI sections for prefix and create class mapping
                    var splitIri = $filter('splitIRI')(classId);
                    var ontologyDataName = ontologyManagerService.getBeautifulIRI(_.get(ontology, '@id', '')).toLowerCase();
                    var classEntity = {
                        '@id': getMappingEntity(newMapping)['@id'] + '/' + uuid.v4(),
                        '@type': [prefixes.delim + 'ClassMapping']
                    };
                    classEntity[prefixes.delim + 'mapsTo'] = [{'@id': classId}];
                    classEntity[prefixes.delim + 'hasPrefix'] = [{'@value': prefixes.data + ontologyDataName + '/' + splitIri.end.toLowerCase() + '/'}];
                    classEntity[prefixes.delim + 'localName'] = [{'@value': '${UUID}'}];
                    newMapping.push(classEntity);
                }

                return newMapping;
            }
            /**
             * @ngdoc method
             * @name editIriTemplate
             * @methodOf mappingManager.mappingManagerService
             *
             * @description
             * Edits the IRI template of a class mapping specified by id in a mapping. Sets the `hasPrefix` 
             * and `localName` properties of the class mapping. Returns a new copy of the mapping.
             *
             * @param {Object[]} mapping The mapping JSON-LD array
             * @param {string} classMappingId The id of the class mapping whose IRI template will be edited
             * @param {string} prefixEnd The new end of the prefix
             * @param {string} localNamePattern The new local name pattern. Must be in the following format:
             * `${index/UUID}`
             * @returns {Object[]} The edited mapping array
             */
            self.editIriTemplate = function(mapping, classMappingId, prefixEnd, localNamePattern) {
                var newMapping = angular.copy(mapping);
                // Check if class exists in ontology
                if (entityExists(newMapping, classMappingId)) {
                    var classMapping = getEntityById(newMapping, classMappingId);
                    var ontologyDataName = ontologyManagerService.getBeautifulIRI(self.getSourceOntologyId(newMapping)).toLowerCase();
                    classMapping[prefixes.delim + 'hasPrefix'] = [{'@value': prefixes.data + ontologyDataName + '/' + prefixEnd}];
                    classMapping[prefixes.delim + 'localName'] = [{'@value': localNamePattern}];
                }

                return newMapping
            }
            /**
             * @ngdoc method
             * @name addDataProp
             * @methodOf mappingManager.mappingManagerService
             *
             * @description
             * Adds a data property mapping to a mapping for the specified class mapping. The class mapping
             * must already be in the mapping and the data property must exist in the passed ontology. Sets 
             * the `columnIndex` of the data property mapping to the passed index. Returns a new copy of 
             * the mapping.
             *
             * @param {Object[]} mapping The mapping JSON-LD array
             * @param {Object} ontology The ontology object to search for the property in
             * @param {string} classMappingId The id of the class mapping to add the data property mapping to
             * @param {string} propId The id of the data property in the ontology
             * @param {number} columnIndex The column index to set the data property mapping's `columnIndex 
             * property to
             * @returns {Object[]} The edited mapping array
             */
            self.addDataProp = function(mapping, ontology, classMappingId, propId, columnIndex) {
                var newMapping = angular.copy(mapping);
                // If class mapping doesn't exist or the property does not exist for that class,
                // return the mapping
                if (entityExists(newMapping, classMappingId) && ontologyManagerService.getClassProperty(ontology, 
                    self.getClassIdByMappingId(newMapping, classMappingId), propId)) {
                    var dataEntity = self.getDataMappingFromClass(newMapping, classMappingId, propId);
                    // If the data property and mapping already exist, update the column index
                    if (dataEntity) {
                        dataEntity[prefixes.delim + 'columnIndex'] = [{'@value': `${columnIndex}`}];
                        _.remove(newMapping, {'@id': dataEntity['@id']});
                    } else {
                        // Add new data mapping id to data properties of class mapping
                        var dataEntity = {
                            '@id': getMappingEntity(newMapping)['@id'] + '/' + uuid.v4()
                        };
                        var classMapping = getEntityById(newMapping, classMappingId);
                        // Sets the dataProperty key if not already present
                        classMapping[prefixes.delim + 'dataProperty'] = getDataProperties(classMapping);
                        classMapping[prefixes.delim + 'dataProperty'].push(angular.copy(dataEntity));
                        // Create data mapping
                        dataEntity['@type'] = [prefixes.delim + 'DataMapping'];
                        dataEntity[prefixes.delim + 'columnIndex'] = [{'@value': `${columnIndex}`}];
                        dataEntity[prefixes.delim + 'hasProperty'] = [{'@id': propId}];
                    }
                    // Add/update data mapping
                    newMapping.push(dataEntity);
                }
                return newMapping;
            }
            /**
             * @ngdoc method
             * @name addObjectProp
             * @methodOf mappingManager.mappingManagerService
             *
             * @description
             * Adds a object property mapping to a mapping for the specified class mapping. The class mapping
             * must already be in the mapping and the object property must exist in one of the passed ontologies. 
             * Creates a class mapping for the range class of the object property. Returns a new copy of the mapping.
             *
             * @param {Object[]} mapping The mapping JSON-LD array
             * @param {Object[]} ontologies An array of ontology objects to search for the property and range class in
             * @param {string} classMappingId The id of the class mapping to add the object property mapping to
             * @param {string} propId The id of the object property in the ontology
             * @returns {Object[]} The edited mapping array
             */
            self.addObjectProp = function(mapping, ontologies, classMappingId, propId) {
                var newMapping = angular.copy(mapping);
                // Check if class mapping exists
                if (entityExists(newMapping, classMappingId)) {
                    var classId = self.getClassIdByMappingId(newMapping, classMappingId);
                    var ontology = ontologyManagerService.findOntologyWithClass(ontologies, classId);
                    // Check if ontology exists with class
                    if (ontology) {
                        var propObj = ontologyManagerService.getClassProperty(ontology, classId, propId);
                        // Check if object property exists for class in ontology
                        if (propObj) {
                            // Add new object mapping id to object properties of class mapping
                            var dataEntity = {
                                '@id': getMappingEntity(newMapping)['@id'] + '/' + uuid.v4()
                            };
                            var classMapping = getEntityById(newMapping, classMappingId);
                            classMapping[prefixes.delim + 'objectProperty'] = getObjectProperties(classMapping);
                            classMapping[prefixes.delim + 'objectProperty'].push(angular.copy(dataEntity));
                            // Find the range of the object property (currently only supports a single class)
                            var rangeClass = propObj[prefixes.rdfs + 'range'][0]['@id'];
                            var rangeOntology = ontologyManagerService.findOntologyWithClass(ontologies, rangeClass);
                            var rangeClassMappings = getClassMappingsByClass(newMapping, rangeClass);

                            // Create class mapping for range of object property
                            newMapping = self.addClass(newMapping, rangeOntology, rangeClass);
                            var newClassMapping = _.differenceBy(getClassMappingsByClass(newMapping, rangeClass), rangeClassMappings, '@id')[0];
                            // Create object mapping
                            dataEntity['@type'] = [prefixes.delim + 'ObjectMapping'];
                            dataEntity[prefixes.delim + 'classMapping'] = [{'@id': newClassMapping['@id']}];
                            dataEntity[prefixes.delim + 'hasProperty'] = [{'@id': propId}];
                            newMapping.push(dataEntity);
                        }
                    }
                }
                return newMapping;
            }
            /**
             * @ngdoc method
             * @name removeProp
             * @methodOf mappingManager.mappingManagerService
             *
             * @description
             * Removes a property mapping from a mapping from the specified class mapping. The class mapping and
             * property mapping must already be in the mapping. Returns a new copy of the mapping.
             * 
             * @param {Object[]} mapping The mapping JSON-LD array
             * @param {string} classMappingId The id of the class mapping with the property mapping to remove
             * @param {string} propMappingId The id of the property mapping to remove
             * @returns {Object[]} The edited mapping array
             */
            self.removeProp = function(mapping, classMappingId, propMappingId) {
                var newMapping = angular.copy(mapping);
                if (entityExists(newMapping, propMappingId)) {
                    // Collect the property mapping and the class mapping
                    var propMapping = getEntityById(newMapping, propMappingId);
                    var propType = self.isObjectMapping(propMapping) ? 'objectProperty' : 'dataProperty';
                    var classMapping = getEntityById(newMapping, classMappingId);
                    // Remove the property mapping
                    _.pull(newMapping, propMapping);
                    // Remove the property mapping id from the class mapping's properties
                    _.remove(classMapping[prefixes.delim + propType], {'@id': propMappingId});
                    cleanPropertyArray(classMapping, propType);
                }
                return newMapping;
            }
            /**
             * @ngdoc method
             * @name removeClass
             * @methodOf mappingManager.mappingManagerService
             *
             * @description
             * Removes a class mapping from a mapping. The class mapping must already be in the mapping. 
             * Also removes every property mapping from the specified class mapping and any object property
             * mappings from other class mappings that point to it. Returns a new copy of the mapping.
             *
             * @param {Object[]} mapping The mapping JSON-LD array
             * @param {string} classMappingId The id of the class mapping to remove
             * @returns {Object[]} The edited mapping array
             */
            self.removeClass = function(mapping, classMappingId) {
                var newMapping = angular.copy(mapping);
                if (entityExists(newMapping, classMappingId)) {
                    // Collect class mapping and any object mappings that use the class mapping
                    var classMapping = getEntityById(newMapping, classMappingId);
                    var classId = self.getClassIdByMapping(classMapping);
                    var objectMappings = _.filter(
                        self.getAllObjectMappings(newMapping),
                        ["['" + prefixes.delim + "classMapping'][0]['@id']", classMapping['@id']]
                    );
                    // If there are object mappings that use the class mapping, iterate through them
                    _.forEach(objectMappings, objectMapping => {
                        // Collect the class mapping that uses the object mapping
                        var classWithObjectMapping = self.findClassWithObjectMapping(newMapping, objectMapping['@id']);
                        // Remove the object property for the object mapping
                        _.remove(classWithObjectMapping[prefixes.delim + 'objectProperty'], {'@id': objectMapping['@id']});
                        cleanPropertyArray(classWithObjectMapping, 'objectProperty');
                        //Replace class mapping
                        newMapping.splice(_.findIndex(newMapping, {'@id': classWithObjectMapping['@id']}), 1, classWithObjectMapping);
                        // Remove object mapping
                        _.remove(newMapping, objectMapping);
                    });
                    // Remove all properties of the class mapping and the class mapping itself
                    _.forEach(_.concat(getDataProperties(classMapping), getObjectProperties(classMapping)), prop => {
                        newMapping = self.removeProp(newMapping, classMapping['@id'], prop['@id']);
                    });
                    _.remove(newMapping, {'@id': classMapping['@id']});
                }

                return newMapping;
            }

            // Public helper methods
            /**
             * @ngdoc method
             * @name getClassIdByMappingId
             * @methodOf mappingManager.mappingManagerService
             *
             * @description
             * Collects the id of the class being mapped by a class mapping specified by id.
             *
             * @param {Object[]} mapping The mapping JSON-LD array
             * @param {string} classMappingId The id of the class mapping to collect the class id from
             * @returns {string} The id of the class mapped by the class mapping
             */
            self.getClassIdByMappingId = function(mapping, classMappingId) {
                return self.getClassIdByMapping(getEntityById(mapping, classMappingId));
            }
            /**
             * @ngdoc method
             * @name getClassIdByMapping
             * @methodOf mappingManager.mappingManagerService
             *
             * @description
             * Collects the id of the class being mapped by the passed class mapping.
             *
             * @param {Object} classMapping The the class mapping to collect the class id from
             * @returns {string} The id of the class mapped by the class mapping
             */
            self.getClassIdByMapping = function(classMapping) {
                return _.get(classMapping, "['" + prefixes.delim + "mapsTo'][0]['@id']", '');
            }
            /**
             * @ngdoc method
             * @name getPropIdByMappingId
             * @methodOf mappingManager.mappingManagerService
             *
             * @description
             * Collects the id of the property being mapped by a property mapping specified by id.
             *
             * @param {Object[]} mapping The mapping JSON-LD array
             * @param {string} propMappingId The id of the property mapping to collect the property 
             * id from
             * @returns {string} The id of the property mapped by the property mapping
             */
            self.getPropIdByMappingId = function(mapping, propMappingId) {
                return self.getPropIdByMapping(getEntityById(mapping, propMappingId));
            }
            /**
             * @ngdoc method
             * @name getPropIdByMapping
             * @methodOf mappingManager.mappingManagerService
             *
             * @description
             * Collects the id of the property being mapped by the passed property mapping.
             *
             * @param {Object} propMapping The property mapping to collect the property id from
             * @returns {string} The id of the property mapped by the property mapping
             */
            self.getPropIdByMapping = function(propMapping) {
                return _.get(propMapping, "['" + prefixes.delim + "hasProperty'][0]['@id']", '');
            }
            /**
             * @ngdoc method
             * @name getSourceOntologyId
             * @methodOf mappingManager.mappingManagerService
             *
             * @description
             * Collects the source ontology id of the passed mapping.
             *
             * @param {Object[]} mapping The mapping JSON-LD array
             * @returns {string} The id of the source ontology of a mapping
             */
            self.getSourceOntologyId = function(mapping) {
                return _.get(
                    getMappingEntity(mapping),
                    "['" + prefixes.delim + "sourceOntology'][0]['@id']"
                );
            }
            /**
             * @ngdoc method
             * @name getSourceOntology
             * @methodOf mappingManager.mappingManagerService
             *
             * @description
             * Collects the source ontology of the passed mapping using the source ontology id and
             * {@link mappingManager.mappingManagerService#sourceOntologies sourceOntologies}.
             *
             * @param {Object[]} mapping The mapping JSON-LD array
             * @returns {Object} The source ontology of a mapping
             */
            self.getSourceOntology = function(mapping) {
                return _.find(self.sourceOntologies, {'@id': self.getSourceOntologyId(mapping)});
            }
            /**
             * @ngdoc method
             * @name getDataMappingFromClass
             * @methodOf mappingManager.mappingManagerService
             *
             * @description
             * Retrieves the data mapping mapping the specified property from the specified class
             * mapping in a mapping.
             *
             * @param {Object[]} mapping The mapping JSON-LD array
             * @param {string} classMappingId The id of the class mapping with the requested data property
             * @param {string} propId The id of the requested data property
             * @returns {Object} The data property mapping which maps the specified data property
             */
            self.getDataMappingFromClass = function(mapping, classMappingId, propId) {
                var dataProperties = _.map(getDataProperties(getEntityById(mapping, classMappingId)), '@id');
                var dataMappings = getMappingsForProp(mapping, propId);
                if (dataProperties.length && dataMappings.length) {
                    return _.find(dataMappings, mapping => dataProperties.indexOf(mapping['@id']) >= 0);
                }
                return undefined;
            }
            /**
             * @ngdoc method
             * @name getAllClassMappings
             * @methodOf mappingManager.mappingManagerService
             *
             * @description
             * Retrieves all class mapping in the passed mapping array.
             *
             * @param {Object[]} mapping The mapping JSON-LD array
             * @returns {Object[]} An array of all the class mappings in the passed mapping array
             */
            self.getAllClassMappings = function(mapping) {
                return getEntitiesByType(mapping, 'ClassMapping');
            }
            /**
             * @ngdoc method
             * @name getAllDataMappings
             * @methodOf mappingManager.mappingManagerService
             *
             * @description
             * Retrieves all data property mapping in the passed mapping array.
             *
             * @param {Object[]} mapping The mapping JSON-LD array
             * @returns {Object[]} An array of all the data property mappings in the passed mapping array
             */
            self.getAllDataMappings = function(mapping) {
                return getEntitiesByType(mapping, 'DataMapping');
            }
            /**
             * @ngdoc method
             * @name getAllObjectMappings
             * @methodOf mappingManager.mappingManagerService
             *
             * @description
             * Retrieves all object property mapping in the passed mapping array.
             *
             * @param {Object[]} mapping The mapping JSON-LD array
             * @returns {Object[]} An array of all the object property mappings in the passed mapping array
             */
            self.getAllObjectMappings = function(mapping) {
                return getEntitiesByType(mapping, 'ObjectMapping');
            }
            /**
             * @ngdoc method
             * @name getAllObjectMappings
             * @methodOf mappingManager.mappingManagerService
             *
             * @description
             * Retrieves all property mappings for the specified class mapping in the passed mapping.
             *
             * @param {Object[]} mapping The mapping JSON-LD array
             * @param {string} classMappingId The id of the class mapping to collect property mappings from
             * @returns {Object[]} An array of all the property mappings for the specified class mapping
             */
            self.getPropMappingsByClass = function(mapping, classMappingId) {
                var classMapping = getEntityById(mapping, classMappingId);
                return _.intersectionBy(
                    mapping, _.concat(getDataProperties(classMapping), getObjectProperties(classMapping)), 
                    '@id'
                );
            }
            /**
             * @ngdoc method
             * @name isClassMapping
             * @methodOf mappingManager.mappingManagerService
             *
             * @description
             * Tests whether the passed mapping entity is a class mapping.
             *
             * @param {Object} entity A mapping entity
             * @returns {boolean} A boolean indicating whether the entity is a class mapping
             */
            self.isClassMapping = function(entity) {
                return isType(entity, 'ClassMapping');
            }
            /**
             * @ngdoc method
             * @name isObjectMapping
             * @methodOf mappingManager.mappingManagerService
             *
             * @description
             * Tests whether the passed mapping entity is an object property mapping.
             *
             * @param {Object} entity A mapping entity
             * @returns {boolean} A boolean indicating whether the entity is an object property mapping
             */
            self.isObjectMapping = function(entity) {
                return isType(entity, 'ObjectMapping');
            }
            /**
             * @ngdoc method
             * @name isDataMapping
             * @methodOf mappingManager.mappingManagerService
             *
             * @description
             * Tests whether the passed mapping entity is a data property mapping.
             *
             * @param {Object} entity A mapping entity
             * @returns {boolean} A boolean indicating whether the entity is a data property mapping
             */
            self.isDataMapping = function(entity) {
                return isType(entity, 'DataMapping');
            }
            /**
             * @ngdoc method
             * @name findClassWithDataMapping
             * @methodOf mappingManager.mappingManagerService
             *
             * @description
             * Finds the class mapping which contains the specified data property mapping.
             *
             * @param {Object[]} mapping The mapping JSON-LD array
             * @param {string} dataMappingId The id of a data property mapping
             * @returns {Object} The class mapping which contains the specified data property mapping
             */
            self.findClassWithDataMapping = function(mapping, dataMappingId) {
                return findClassWithPropMapping(mapping, dataMappingId, 'dataProperty');
            }
            /**
             * @ngdoc method
             * @name findClassWithObjectMapping
             * @methodOf mappingManager.mappingManagerService
             *
             * @description
             * Finds the class mapping which contains the specified object property mapping.
             *
             * @param {Object[]} mapping The mapping JSON-LD array
             * @param {string} objectMappingId The id of a data property mapping
             * @returns {Object} The class mapping which contains the specified object property mapping
             */
            self.findClassWithObjectMapping = function(mapping, objectMappingId) {
                return findClassWithPropMapping(mapping, objectMappingId, 'objectProperty');
            } 
            /**
             * @ngdoc method
             * @name getPropMappingTitle
             * @methodOf mappingManager.mappingManagerService
             *
             * @description
             * Creates a title for a property mapping using the passed class and property names.
             *
             * @param {string} className The name of the containing class
             * @param {string} propName The name of the property
             * @returns {string} A standardized title for a property mapping
             */
            self.getPropMappingTitle = function(className, propName) {
                return className + ': ' + propName;
            }

            // Private helper methods
            function cleanPropertyArray(classMapping, propType) {
                if (_.get(classMapping, prefixes.delim + propType) && _.get(classMapping, prefixes.delim + propType).length === 0) {
                    delete classMapping[prefixes.delim + propType];
                }
            }
            function getEntitiesByType(mapping, type) {
                return _.filter(mapping, {'@type': [prefixes.delim + type]});
            }
            function getEntityById(mapping, id) {
                return _.find(mapping, {'@id': id});
            }
            function entityExists(mapping, id) {
                return !!getEntityById(mapping, id);
            }
            function getClassMappingsByClass(mapping, classId) {
                return _.filter(self.getAllClassMappings(mapping), ["['" + prefixes.delim + "mapsTo'][0]['@id']", classId]);
            }            
            
            function getMappingsForProp(mapping, propId) {
                var propMappings = _.concat(self.getAllDataMappings(mapping), self.getAllObjectMappings(mapping));
                return _.filter(propMappings, [prefixes.delim + 'hasProperty', [{'@id': propId}]]);
            }
            function findClassWithPropMapping(mapping, propMappingId, type) {
                return _.find(self.getAllClassMappings(mapping), classMapping => _.map(getProperties(classMapping, type), '@id').indexOf(propMappingId) >= 0);
            }
            function getDataProperties(classMapping) {
                return getProperties(classMapping, 'dataProperty');
            }
            function getObjectProperties(classMapping) {
                return getProperties(classMapping, 'objectProperty');
            }
            function getProperties(classMapping, type) {
                return _.get(classMapping, "['" + prefixes.delim + type + "']", []);
            }
            function isType(entity, type) {
                return _.get(entity, "['@type'][0]") === prefixes.delim + type;
            }
            function getMappingEntity(mapping) {
                return _.get(getEntitiesByType(mapping, 'Mapping'), 0);
            }
        }
})();
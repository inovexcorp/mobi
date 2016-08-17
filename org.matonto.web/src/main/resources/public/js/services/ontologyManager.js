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
         * @requires $rootScope
         * @requires $window
         * @requires $http
         * @requires $q
         * @requires $timeout
         * @requires $filter
         * @requires prefixes.service:prefixes
         * @requires uuid
         * @requires annotationManger.service:annotationManagerService
         *
         * @description
         * `ontologyManagerService` is a service that provides access to the MatOnto ontology REST
         * endpoints and utility functions for editing/creating ontologies and accessing
         * various entities within the ontology.
         */
        .service('ontologyManagerService', ontologyManagerService);

        ontologyManagerService.$inject = ['$rootScope', '$window', '$http', '$q', '$timeout', '$filter', 'prefixes',
            'uuid', 'annotationManagerService'];

        function ontologyManagerService($rootScope, $window, $http, $q, $timeout, $filter, prefixes, uuid,
            annotationManagerService) {
            var self = this;
            var prefix = '/matontorest/ontologies/';
            var defaultDatatypes = _.map(['anyURI', 'boolean', 'byte', 'dateTime', 'decimal', 'double', 'float', 'int',
                'integer', 'language', 'long', 'string'], function(item) {
                return {
                    'namespace': prefixes.xsd,
                    'localName': item
                }
            });
            var defaultAnnotations = annotationManagerService.getDefaultAnnotations();
            var defaultErrorMessage = defaultErrorMessage;

            /**
             * @ngdoc property
             * @name ontologyIds
             * @propertyOf ontologyManager.service:ontologyManagerService
             * @type {string[]}
             *
             * @description
             * `ontologyIds` holds an array of the ontology ids in the MatOnto repository.
             */
            self.ontologyIds = [];
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
             *      classHierarchy: []
             * }
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
             * @ngdoc method
             * @name getAllOntologyIds
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the GET /matontorest/ontologies/ontologyids endpoint which gets the list of ontology ids in the
             * MatOnto repository. Returns a promise with an array of the ontology ids.
             *
             * @returns {Promise} A promise with an array of the ontology ids.
             */
            self.getAllOntologyIds = function() {
                return $http.get(prefix + 'ontologyids');
            }
            /**
             * @ngdoc method
             * @name uploadFile
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the POST /matontorest/ontologies endpoint which uploads an ontology to the MatOnto repository
             * with the file provided. Returns a promise indicating whether the ontology was persisted.
             *
             * @param {File} file The ontology file.
             * @returns {Promise} A promise indicating whether the ontology was persisted.
             */
            self.uploadFile = function(file) {
                var fd = new FormData(),
                    config = {
                        transformRequest: angular.identity,
                        headers: {
                            'Content-Type': undefined
                        }
                    };
                fd.append('file', file);
                return $http.post(prefix, fd, config);
            }
            /**
             * @ngdoc method
             * @name getOntology
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the GET /matontorest/ontologies/{ontologyId} endpoint which gets an ontology from the MatOnto
             * with the JSON-LD ontology string provided. Returns a promise which includes the serialized ontology.
             *
             * @param {string} ontologyId The ontology ID of the ontology you want to get from the repository.
             * @param {string} [rdfFormat='jsonld'] The format string to identify the serialization requested.
             * @returns {Promise} A promise containing the ontology id and JSON-LD serialization of the ontology.
             */
            self.getOntology = function(ontologyId, rdfFormat = 'jsonld') {
                var config = {
                    params: {
                        rdfformat: rdfFormat
                    }
                };
                return $http.get(prefix + encodeURIComponent(ontologyId), config);
            }
            /**
             * @ngdoc method
             * @name downloadOntologyFile
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the GET /matontorest/ontologies/{ontologyId} endpoint using the `window.open` function which will
             * start a download of the specified ontology.
             *
             * @param {string} ontologyId The ontology ID of the ontology you want to download.
             * @param {string} [rdfFormat='jsonld'] The format string to identify the serialization requested.
             * @param {string} [fileName='ontology'] The ontology file name specified.
             * @returns {Promise} A promise indicating whether the ontology was persisted.
             */
            self.downloadOntologyFile = function(ontologyId, rdfFormat = 'jsonld', fileName = 'ontology') {
                $window.location = prefix + encodeURIComponent(ontologyId)
                    + `?rdfFormat=${rdfFormat}&fileName=${fileName}`;
            }
            /**
             * @ngdoc method
             * @name uploadThenGet
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the POST /matontorest/ontologies endpoint which uploads an ontology to the MatOnto repository
             * with the file provided and then calls `ontologyManagerService.getOntology` to get the ontology they
             * just uploaded. Returns a promise.
             *
             * @param {File} file The ontology file.
             * @returns {Promise} A promise with an empty object or error message.
             */
            self.uploadThenGet = function(file) {
                $rootScope.showSpinner = true;
                var deferred = $q.defer();
                var onError = function(response) {
                    deferred.reject(response);
                    $rootScope.showSpinner = false;
                };
                var onUploadSuccess = function(ontologyId) {
                    self.getOntology(ontologyId)
                        .then(response => {
                            if (_.get(response, 'status') === 200 && _.has(response, 'data.id')
                                && _.has(response, 'data.ontology')) {
                                addOntologyToList(response.data.id, response.data.ontology)
                                    .then(() => {
                                        $rootScope.showSpinner = false;
                                        deferred.resolve({});
                                    });
                            } else {
                                onError(response);
                            }
                        }, response => {
                            onError(response);
                        });
                };
                self.uploadFile(file)
                    .then(response => {
                        if (_.get(response, 'status') === 200 && _.get(response, 'data.persisted')
                            && _.has(response, 'data.ontologyId')) {
                            onUploadSuccess(response.data.ontologyId);
                        } else {
                            onError(response);
                        }
                    }, response => {
                        onError(response);
                    });
                return deferred.promise;
            }
            /**
             * @ngdoc method
             * @name openOntology
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Used to open an ontology from the MatOnto repository. It calls `ontologyManagerService.getOntology` to
             * get the specified ontology from the MatOnto repository. Returns a promise.
             *
             * @param {string} ontologyId The ontology ID of the requested ontology.
             * @returns {Promise} A promise with an empty object or error message.
             */
            self.openOntology = function(ontologyId) {
                $rootScope.showSpinner = true;
                var deferred = $q.defer();
                self.getOntology(ontologyId)
                    .then(response => {
                        if (_.get(response, 'status') === 200 && _.has(response, 'data.id')
                            && _.has(response, 'data.ontology')) {
                            addOntologyToList(response.data.id, response.data.ontology)
                                .then(() => {
                                    self.ontologyIds.splice(_.indexOf(self.ontologyIds, ontologyId), 1);
                                    deferred.resolve({});
                                });
                        } else {
                            deferred.reject(response.statusText);
                        }
                    }, response => {
                        deferred.reject(response.statusText);
                    });
                deferred.promise.then(() => {
                    $rootScope.showSpinner = false;
                });
                return deferred.promise;
            }
            /**
             * @ngdoc method
             * @name closeOntology
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Used to close an ontology from the MatOnto application. It removes the ontology list item from
             * `ontologyManagerService.list` and adds the ontology ID to `ontologyManagerService.ontologyIds` so that it
             * can be opened later if necessary.
             *
             * @param {string} ontologyId The ontology ID of the requested ontology.
             */
            self.closeOntology = function(ontologyId) {
                self.list.splice(_.findIndex(self.list, {ontologyId: ontologyId}), 1);
                self.ontologyIds.push(ontologyId);
            }
            /**
             * @ngdoc method
             * @name getPreview
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Used to get the string representation of the requested serialization of the ontology. It calls
             * `ontologyManagerService.getOntology` to get the specified ontology from the MatOnto repository. Returns
             * a promise with the string representation of the ontology.
             *
             * @param {string} ontologyId The ontology ID of the requested ontology.
             * @param {string} [rdfFormat='jsonld'] The format string to identify the serialization requested.
             * @returns {Promise} A promise with the string representation of the ontology.
             */
            self.getPreview = function(ontologyId, rdfFormat = 'jsonld') {
                $rootScope.showSpinner = true;
                var deferred = $q.defer();
                self.getOntology(ontologyId, rdfFormat)
                    .then(response => {
                        if (_.get(response, 'status') === 200 && _.has(response, 'data.ontology')) {
                            deferred.resolve((rdfFormat === 'jsonld') ? $filter('json')(response.data.ontology)
                                : response.data.ontology);
                        } else {
                            deferred.reject('No data was returned. This typically happens whenever you try to preview'
                                + 'a new, unsaved ontology. Please try again after you save the ontology.');
                        }
                    }, response => {
                        deferred.reject('An error has occurred, please try again later');
                    })
                    .then(() => {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
            }
            /**
             * @ngdoc method
             * @name saveChanges
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Saves all changes to the ontology with the specified ontology ID. It calls the POST
             * /matontorest/ontology/{ontologyId} for each of the unsaved entities. Returns a promise with the new
             * ontology ID.
             *
             * @param {string} ontologyId The ontology ID of the requested ontology.
             * @param {Object[]} unsavedEntities The array of ontology entities with unsaved changes.
             * @returns {Promise} A promise with the ontology ID.
             */
            self.saveChanges = function(ontologyId, unsavedEntities) {
                var deferred = $q.defer();
                var promises = [];
                var config = {};
                _.forEach(unsavedEntities, entity => {
                    config = {
                        params: {
                            resourceid: _.get(entity, 'matonto.originalIRI'),
                            resourcejson: $filter('removeMatonto')(entity)
                        }
                    };
                    promises.push($http.post(prefix + encodeURIComponent(ontologyId), null, config));
                    _.set(entity, 'matonto.unsaved', false);
                    if (_.has(entity, '@id')) {
                        _.set(entity, 'matonto.originalIRI', entity['@id']);
                    }
                });
                $q.all(promises)
                    .then(response => {
                        if (!_.some(response, {data: {updated: false}})) {
                            var newId = _.get(response, '[0].data.id');
                            if (!_.isEqual(ontologyId, newId)) {
                                self.setOntologyId(ontologyId, newId);
                            }
                            deferred.resolve(newId);
                        } else {
                            // TODO: find a useful error message if this did go wrong
                            deferred.reject('An error has occurred.');
                        }
                    }, response => {
                        // TODO: find a more useful error message
                        deferred.reject('An error has occurred.');
                    });
                return deferred.promise;
            }
            /**
             * @ngdoc method
             * @name getListItemById
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the associated object from `ontologyManagerService.list` that contains the requested ontology ID.
             * Returns the list item.
             *
             * @param {string} ontologyId The ontology ID of the requested ontology.
             * @returns {Object} The associated Object from `ontologyManagerService.list`.
             */
            self.getListItemById = function(ontologyId) {
                return _.find(self.list, {ontologyId: ontologyId});
            }
            /**
             * @ngdoc method
             * @name setOntologyId
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Sets the ontology ID in the list item to a new value.
             *
             * @param {string} oldId The old ontology ID that will be changed.
             * @param {string} newId The new ontology ID that it will be changed to.
             */
            self.setOntologyId = function(oldId, newId) {
                _.set(self.getListItemById(oldId), 'ontologyId', newId);
            }
            /**
             * @ngdoc method
             * @name getOntologyById
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the ontology from the `ontologyManagerService.list` using the requested ontology ID. Returns the
             * JSON-LD of the ontology.
             *
             * @param {string} ontologyId The ontology ID of the requested ontology.
             * @returns {Object[]} The JSON-LD of the requested ontology.
             */
            self.getOntologyById = function(ontologyId) {
                return _.get(self.getListItemById(ontologyId), 'ontology', []);
            }
            /**
             * @ngdoc method
             * @name getIdByOntology
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the ontology ID of the ontology requested. Returns the ontology ID.
             *
             * @param {Object[]} ontology The ontology you want to get the ID from.
             * @returns {string} The ontology ID for the requested ontology.
             */
            self.getIdByOntology = function(ontology) {
                return _.get(_.find(self.list, {ontology: ontology}), 'id', '');
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
                return _.indexOf(_.get(entity, '@type', []), prefixes.owl + 'Ontology') !== -1;
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
                return _.some(ontology, {'@type': [prefixes.owl + 'Ontology']});
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
                return _.find(ontology, {'@type': [prefixes.owl + 'Ontology']}, {});
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
                return _.get(entity, 'matonto.originalIRI', _.get(entity, 'matonto.anonymous', ''));
            }
            /**
             * @ngdoc method
             * @name deleteOntology
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the DELETE /matontorest/ontology/{ontologyId} endpoint which deletes the specified ontology from
             * the MatOnto repository. Returns a promise with the success of the deletion.
             *
             * @param {string} ontologyId The ontology ID of the requested ontology.
             * @returns {Promise} A promise with a boolean indicating the success of the deletion.
             */
            self.deleteOntology = function(ontologyId) {
                $rootScope.showSpinner = true;
                var deferred = $q.defer();
                $http.delete(prefix + encodeURIComponent(ontologyId))
                    .then(response => {
                        if (_.get(response, 'data.deleted')) {
                            self.list.splice(_.findIndex(self.list, {ontologyId: ontologyId}), 1);
                            deferred.resolve();
                        } else {
                            deferred.reject(_.get(response, 'statusText', defaultErrorMessage));
                        }
                    }, response => {
                        deferred.reject(_.get(response, 'data.error', defaultErrorMessage));
                    })
                    .then(() => {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
            }
            /**
             * @ngdoc method
             * @name createOntology
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the POST /matontorest/ontologies endpoint which uploads an ontology to the MatOnto repository
             * with the JSON-LD ontology string provided. Returns a promise with the entityIRI and ontologyId for the
             * state of the newly created ontology.
             *
             * @param {string} ontologyJSON The JSON-LD representing the ontology.
             * @returns {Promise} A promise with the entityIRI and ontologyId for the state of the newly created
             * ontology.
             */
            self.createOntology = function(ontologyJSON) {
                $rootScope.showSpinner = true;
                var deferred = $q.defer();
                var config = {
                    params: {
                        ontologyjson: ontologyJSON
                    }
                };
                $http.post(prefix, null, config)
                    .then(response => {
                        if (_.has(response, 'data.persisted') && _.has(response, 'data.ontologyId')) {
                            _.set(ontologyJSON, 'matonto.originalIRI', ontologyJSON['@id']);
                            var listItem = {
                                ontology: [ontologyJSON],
                                ontologyId: response.data.ontologyId,
                                annotations: defaultAnnotations,
                                dataPropertyRange: defaultDatatypes,
                                subClasses: [],
                                subDataProperties: [],
                                subObjectProperties: []
                            }
                            self.list.push(listItem);
                            deferred.resolve({
                                entityIRI: ontologyJSON['@id'],
                                ontologyId: response.data.ontologyId
                            });
                        } else {
                            deferred.reject(_.get(response, 'statusText', defaultErrorMessage));
                        }
                    }, response => {
                        deferred.reject(_.get(response, 'statusText', defaultErrorMessage));
                    })
                    .then(() => {
                        $rootScope.showSpinner = false;
                    });
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
                return _.indexOf(_.get(entity, '@type', []), prefixes.owl + 'Class') !== -1;
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
                return _.some(ontology, entity => {
                    return self.isClass(entity) && !self.isBlankNode(entity);
                });
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
                return _.filter(ontology, entity => {
                    return self.isClass(entity) && !self.isBlankNode(entity);
                });
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
             * @name deleteClass
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the DELETE /matontorest/ontology/{ontologyId}/classes/{classId} endpoint which deletes the
             * specified class from the ontology in the MatOnto repository. Returns a promise with the success of the
             * deletion.
             *
             * @param {string} ontologyId The ontology ID of the requested ontology.
             * @returns {Promise} A promise with a boolean indicating the success of the deletion.
             */
            self.deleteClass = function(ontologyId, classIRI) {
                $rootScope.showSpinner = true;
                var deferred = $q.defer();
                $http.delete(prefix + encodeURIComponent(ontologyId) + '/classes/' + encodeURIComponent(classIRI))
                    .then(response => {
                        onDeleteSuccess(response, ontologyId, classIRI, 'subClasses', deferred);
                    }, response => {
                        onDeleteError(response, deferred);
                    })
                    .then(() => {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
            }
            /**
             * @ngdoc method
             * @name createClass
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the POST /matontorest/ontologies/{ontologyId}/classes endpoint which adds the provided class to
             * the ontology within the MatOnto repository. Returns a promise with the entityIRI and ontologyId for the
             * state of the newly created class.
             *
             * @param {string} ontologyId The ontology ID of the requested ontology.
             * @param {string} classJSON The JSON-LD representing the owl:Class to create.
             * @returns {Promise} A promise with the entityIRI and ontologyId for the state of the newly created
             * class.
             */
            self.createClass = function(ontologyId, classJSON) {
                $rootScope.showSpinner = true;
                var deferred = $q.defer();
                var config = {
                    params: {
                        resourcejson: classJSON
                    }
                };
                $http.post(prefix + encodeURIComponent(ontologyId) + '/classes', null, config)
                    .then(response => {
                        onCreateSuccess(response, ontologyId, classJSON, 'subClasses', deferred);
                    }, response => {
                        onCreateError(response, deferred);
                    })
                    .then(function() {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
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
                return _.indexOf(_.get(entity, '@type', []), prefixes.owl + 'ObjectProperty') !== -1;
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
                return _.indexOf(types, prefixes.owl + 'DatatypeProperty') !== -1
                    || _.indexOf(types, prefixes.owl + 'DataTypeProperty') !== -1;
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
                return _.some(ontology, entity => {
                    return self.isProperty(entity) && !_.has(entity, prefixes.rdfs + 'domain');
                });
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
                return _.filter(ontology, entity => {
                    return self.isProperty(entity) && !_.has(entity, prefixes.rdfs + 'domain');
                });
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
                return _.some(ontology, entity => {
                    return self.isObjectProperty(entity) && !self.isBlankNode(entity);
                });
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
                return _.filter(ontology, entity => {
                    return self.isObjectProperty(entity) && !self.isBlankNode(entity);
                });
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
             * @name deleteObjectProperty
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the DELETE /matontorest/ontology/{ontologyId}/object-properties/{propertyId} endpoint which
             * deletes the specified property from the ontology in the MatOnto repository. Returns a promise with the
             * success of the deletion.
             *
             * @param {string} ontologyId The ontology ID of the requested ontology.
             * @param {string} propertyIRI The IRI of the object property you want to delete.
             * @returns {Promise} A promise with a boolean indicating the success of the deletion.
             */
            self.deleteObjectProperty = function(ontologyId, propertyIRI) {
                $rootScope.showSpinner = true;
                var deferred = $q.defer();
                $http.delete(prefix + encodeURIComponent(ontologyId) + '/object-properties/'
                    + encodeURIComponent(propertyIRI))
                    .then(response => {
                        onDeleteSuccess(response, ontologyId, propertyIRI, 'subObjectProperties', deferred);
                    }, response => {
                        onDeleteError(response, deferred);
                    })
                    .then(() => {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
            }
            /**
             * @ngdoc method
             * @name createObjectProperty
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the POST /matontorest/ontology/{ontologyId}/object-properties endpoint which adds the provided
             * object property to the ontology within the MatOnto repository. Returns a promise with the entityIRI and
             * ontologyId for the state of the newly created object property.
             *
             * @param {string} ontologyId The ontology ID of the requested ontology.
             * @param {string} propertyJSON The JSON-LD representing the owl:ObjectProperty to create.
             * @returns {Promise} A promise with the entityIRI and ontologyId for the state of the newly created
             * property.
             */
            self.createObjectProperty = function(ontologyId, propertyJSON) {
                $rootScope.showSpinner = true;
                var deferred = $q.defer();
                var config = {
                    params: {
                        resourcejson: propertyJSON
                    }
                };
                $http.post(prefix + encodeURIComponent(ontologyId) + '/object-properties', null, config)
                    .then(response => {
                        onCreateSuccess(response, ontologyId, propertyJSON, 'subObjectProperties', deferred);
                    }, response => {
                        onCreateError(response, deferred);
                    })
                    .then(function() {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
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
                return _.some(ontology, entity => {
                    return self.isDataTypeProperty(entity);
                });
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
                return _.filter(ontology, entity => {
                    return self.isDataTypeProperty(entity) && !self.isBlankNode(entity);
                });
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
             * @name deleteDataTypeProperty
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the DELETE /matontorest/ontology/{ontologyId}/data-properties/{propertyId} endpoint which
             * deletes the specified property from the ontology in the MatOnto repository. Returns a promise with the
             * success of the deletion.
             *
             * @param {string} ontologyId The ontology ID of the requested ontology.
             * @param {string} propertyIRI The IRI of the datatype property you want to delete.
             * @returns {Promise} A promise with a boolean indicating the success of the deletion.
             */
            self.deleteDataTypeProperty = function(ontologyId, propertyIRI) {
                $rootScope.showSpinner = true;
                var deferred = $q.defer();
                $http.delete(prefix + encodeURIComponent(ontologyId) + '/data-properties/'
                    + encodeURIComponent(propertyIRI))
                    .then(response => {
                        onDeleteSuccess(response, ontologyId, propertyIRI, 'subDataProperties', deferred);
                    }, response => {
                        onDeleteError(response, deferred);
                    })
                    .then(() => {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
            }
            /**
             * @ngdoc method
             * @name createDataTypeProperty
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the POST /matontorest/ontology/{ontologyId}/data-properties endpoint which adds the provided
             * object property to the ontology within the MatOnto repository. Returns a promise with the entityIRI and
             * ontologyId for the state of the newly created object property.
             *
             * @param {string} ontologyId The ontology ID of the requested ontology.
             * @param {string} propertyJSON The JSON-LD representing the owl:ObjectProperty to create.
             * @returns {Promise} A promise with the entityIRI and ontologyId for the state of the newly created
             * property.
             */
            self.createDataTypeProperty = function(ontologyId, propertyJSON) {
                $rootScope.showSpinner = true;
                var deferred = $q.defer();
                var config = {
                    params: {
                        resourcejson: propertyJSON
                    }
                };
                $http.post(prefix + encodeURIComponent(ontologyId) + '/data-properties', null, config)
                    .then(response => {
                        onCreateSuccess(response, ontologyId, propertyJSON, 'subDataProperties', deferred);
                    }, response => {
                        onCreateError(response, deferred);
                    })
                    .then(function() {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
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
                return _.some(ontology, {'@type': [prefixes.owl + 'AnnotationProperty']});
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
                return _.filter(ontology, {'@type': [prefixes.owl + 'AnnotationProperty']});
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
                return _.indexOf(_.get(entity, '@type', []), prefixes.owl + 'Restriction') !== -1;
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
                return _.filter(ontology, {'@type': [prefixes.owl + 'Restriction']});
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
                return _.filter(ontology, entity => {
                    return self.isBlankNode(entity);
                });
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
                return _.find(ontology, {matonto:{originalIRI: entityIRI}});
            }
            /**
             * @ngdoc method
             * @name removeEntity
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Removes the entity with the provided IRI from the ontology with the provided ontology ID in the MatOnto
             * repository. Returns the entity Object.
             *
             * @param {Object[]} ontology The ontology you want to check.
             * @returns {Object} An Object which represents the requested entity.
             */
            self.removeEntity = function(ontologyId, entityIRI) {
                return _.remove(self.getOntologyById(ontologyId), {matonto:{originalIRI: entityIRI}});
            }
            /**
             * @ngdoc method
             * @name addEntity
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Adds the entity represented by the entityJSON to the ontology with the provided ontology ID in the
             * MatOnto repository.
             *
             * @param {Object[]} ontology The ontology you want to check.
             */
            self.addEntity = function(ontologyId, entityJSON) {
                self.getOntologyById(ontologyId).push(entityJSON);
            }
            /**
             * @ngdoc method
             * @name getBeautifulIRI
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Gets the "beautified" IRI representation for the iri passed. Returns the modified IRI.
             *
             * @param {string} iri The IRI string that you want to beautify.
             * @returns {string} The beautified IRI string.
             */
            self.getBeautifulIRI = function(iri) {
                var splitEnd = $filter('splitIRI')(iri).end;
                return splitEnd ? $filter('beautify')(splitEnd) : iri;
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
             * @param {Object} entity The ontology entity you want the name of.
             * @returns {string} The beautified IRI string.
             */
            self.getEntityName = function(entity) {
                var result = _.get(entity, "['" + prefixes.rdfs + "label'][0]['@value']") || _.get(entity, "['"
                    + prefixes.dcterms + "title'][0]['@value']") || _.get(entity, "['" + prefixes.dc
                    + "title'][0]['@value']");
                if (!result) {
                    if (_.has(entity, 'matonto.originalIRI')) {
                        result = self.getBeautifulIRI(entity.matonto.originalIRI);
                    } else {
                        result = _.get(entity, 'matonto.anonymous', '(Entity has no IRI)');
                    }
                }
                return result;
            }
            /**
             * @ngdoc method
             * @name getImportedOntologies
             * @methodOf ontologyManager.service:ontologyManagerService
             *
             * @description
             * Calls the GET /matontorest/ontologies/{ontologyId}/imported-ontologies endpoint which gets the list of
             * all ontologies imported by the ontology with the requested ontology ID.
             *
             * @param {string} ontologyId The ontology ID of the ontology you want to get from the repository.
             * @param {string} [rdfFormat='jsonld'] The format string to identify the serialization requested.
             * @returns {Promise} A promise containing the list of ontologies that are imported by the requested
             * ontology.
             */
            self.getImportedOntologies = function(ontologyId, rdfFormat = 'jsonlod') {
                $rootScope.showSpinner = true;
                var deferred = $q.defer();
                var config = {
                    params: {
                        rdfformat: rdfFormat
                    }
                };
                $http.get(prefix + encodeURIComponent(ontologyId) + '/imported-ontologies', null, config)
                    .then(response => {
                        if(_.get(response, 'status') === 200 && _.has(response, 'data')) {
                            var ontologies = _.map(response, item => {
                                return item.ontology;
                            });
                            deferred.resolve(ontologies);
                        } else if (_.get(response, 'status') === 204) {
                            deferred.resolve([]);
                        } else {
                            deferred.reject(response);
                        }
                    }, deferred.reject)
                    .then(() => {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
            }

            /* Private helper functions */
            function onCreateSuccess(response, ontologyId, entityJSON, arrayProperty, deferred) {
                if (_.get(response, 'data.added')) {
                    _.set(entityJSON, 'matonto.originalIRI', entityJSON['@id']);
                    self.addEntity(ontologyId, entityJSON);
                    var split = $filter('splitIRI')(entityJSON['@id']);
                    var listItem = self.getListItemById(ontologyId);
                    _.get(listItem, arrayProperty).push({namespace:split.begin + split.then, localName: split.end});
                    deferred.resolve({
                        entityIRI: entityJSON['@id'],
                        ontologyId: ontologyId
                    });
                } else {
                    onCreateError(response, deferred);
                }
            }
            function onCreateError(response, deferred) {
                deferred.reject(_.get(response, 'statusText', defaultErrorMessage));
            }
            function onDeleteSuccess(response, ontologyId, entityIRI, arrayProperty, deferred) {
                if (_.get(response, 'data.deleted')) {
                    self.removeEntity(ontologyId, entityIRI);
                    updateModels(response);
                    var split = $filter('splitIRI')(entityIRI);
                    var listItem = self.getListItemById(ontologyId);
                    _.remove(_.get(listItem, arrayProperty), {namespace:split.begin + split.then,
                        localName: split.end});
                    deferred.resolve();
                } else {
                    deferred.reject(_.get(response, 'statusText', defaultErrorMessage));
                }
            }
            function onDeleteError(response, deferred) {
                deferred.reject(_.get(response, 'data.error', defaultErrorMessage));
            }
            function updateModels(response) {
                if(_.has(response, 'data.models', [])) {
                    _.forEach(response.data.models, function(model) {
                        var ontologyId = _.get(model, "[0]['@id']");
                        var newEntity = _.get(model, "[0]['@graph'][0]");
                        var newEntityIRI = _.get(newEntity, '@id');
                        var oldEntity = self.getEntity(self.getOntologyById(ontologyId), newEntityIRI);
                        if (_.has(oldEntity, 'matonto.icon')) {
                            _.set(newEntity, 'matonto.icon', oldEntity.matonto.icon);
                        }
                        _.set(newEntity, 'matonto.originalIRI', newEntityIRI);
                        oldEntity = newEntity;
                    });
                }
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
            function addOntologyIdToArray(arr, ontologyId) {
                return _.forEach(arr, item => {
                    return _.set(item, 'ontologyId', ontologyId);
                });
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
                    joiningWord = 'or';
                } else if (_.has(blankNode, prefixes.owl + 'intersectionOf')) {
                    list = _.get(blankNode[prefixes.owl + 'intersectionOf'], "[0]['@list']", []);
                    joiningWord = 'and';
                }
                if (list.length) {
                    readableText = '';
                    _.forEach(list, (item, index) => {
                        readableText += $filter('splitIRI')(_.get(item, '@id')).end;
                        if (index !== (list.length - 1)) {
                            readableText += ' ' + joiningWord + ' ';
                        }
                    });
                }
                return readableText;
            }
            function addOntologyToList(ontologyId, ontology) {
                var deferred = $q.defer();
                var blankNodes = {};
                _.forEach(ontology, entity => {
                    if (_.has(entity, '@id')) {
                        _.set(entity, 'matonto.originalIRI', entity['@id']);
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
                var listItem = {
                    ontologyId: ontologyId,
                    ontology: ontology,
                    blankNodes: blankNodes
                }
                $q.all([
                    $http.get(prefix + encodeURIComponent(ontologyId) + '/iris'),
                    $http.get(prefix + encodeURIComponent(ontologyId) + '/imported-iris'),
                    $http.get(prefix + encodeURIComponent(ontologyId) + '/class-hierarchies')
                ]).then(response => {
                    var irisResponse = response[0];
                    listItem.annotations = _.unionWith(
                        _.get(irisResponse, 'data.annotationProperties'),
                        defaultAnnotations,
                        _.isMatch
                    );
                    listItem.subClasses = _.get(irisResponse, 'data.classes');
                    listItem.subDataProperties = _.get(irisResponse, 'data.dataProperties');
                    listItem.subObjectProperties = _.get(irisResponse, 'data.objectProperties');
                    listItem.dataPropertyRange = _.unionWith(
                        _.get(irisResponse, 'data.datatypes'),
                        defaultDatatypes,
                        _.isMatch
                    );
                    var importedIrisResponse = response[1];
                    if (_.get(importedIrisResponse, 'status') === 200) {
                        _.forEach(importedIrisResponse.data, iriList => {
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
                        });
                    }
                    var classHierarchyResponse = response[2];
                    if (_.get(classHierarchyResponse, 'status') === 200) {
                        listItem.classHierarchy = classHierarchyResponse.data;
                    }
                    self.list.push(listItem);
                    deferred.resolve();
                }, () => {
                    deferred.reject();
                });
                return deferred.promise;
            }
            function initialize() {
                $rootScope.showSpinner = true;
                self.getAllOntologyIds()
                    .then(response => {
                        self.ontologyIds = _.get(response, 'data', []);
                    }, response => {
                        console.log(response.statusText);
                    })
                    .then(() => {
                        $rootScope.showSpinner = false;
                    });
            }
            initialize();
        }
})();

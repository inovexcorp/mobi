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
        .module('ontologyManager', [])
        .service('ontologyManagerService', ontologyManagerService);

        ontologyManagerService.$inject = ['$rootScope', '$window', '$http', '$q', '$timeout', '$filter',
            'updateRefsService', 'responseObj', 'prefixes', 'uuid', 'annotationManagerService'];

        function ontologyManagerService($rootScope, $window, $http, $q, $timeout, $filter, updateRefsService,
            responseObj, prefixes, uuid, annotationManagerService) {
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
            self.ontologyIds = [];
            self.list = [];
            self.propertyTypes = [
                prefixes.owl + 'DatatypeProperty',
                prefixes.owl + 'ObjectProperty'
            ];

            self.getAllOntologyIds = function() {
                return $http.get(prefix + 'ontologyids');
            }

            /* Ontologies */
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

            self.uploadOntologyJson = function(ontologyJSON) {
                var config = {
                    params: {
                        ontologyjson: ontologyJSON
                    }
                };
                return $http.post(prefix, null, config);
            }

            self.getOntology = function(ontologyId, rdfFormat = 'jsonld') {
                var config = {
                    params: {
                        rdfformat: rdfFormat
                    }
                };
                return $http.get(prefix + encodeURIComponent(ontologyId), config);
            }

            self.downloadOntologyFile = function(ontologyId, rdfFormat = 'jsonld', fileName = 'ontology') {
                $window.location = prefix + encodeURIComponent(ontologyId)
                    + `?rdfFormat=${rdfFormat}&fileName=${fileName}`;
            }

            self.saveChangesToOntology = function(ontologyId, resourceIRI, resourceJSON) {
                var config = {
                    params: {
                        resourceid: resourceIRI,
                        resourcejson: resourceJSON
                    }
                };
                return $http.post(prefix + encodeURIComponent(ontologyId), null, config);
            }

            /* Classes */
            self.addClassToOntology = function(ontologyId, classJSON) {
                var config = {
                    params: {
                        resourcejson: classJSON
                    }
                };
                return $http.post(prefix + encodeURIComponent(ontologyId) + '/classes', null, config);
            }

            self.deleteClassFromOntology = function(ontologyId, classIRI) {
                return $http.delete(prefix + encodeURIComponent(ontologyId) + '/classes/'
                    + encodeURIComponent(classIRI));
            }

            /* Object Properties */
            self.addObjectPropertyToOntology = function(ontologyId, objectPropertyJSON) {
                var config = {
                    params: {
                        resourcejson: objectPropertyJSON
                    }
                };
                return $http.post(prefix + encodeURIComponent(ontologyId) + '/object-properties', null, config);
            }

            self.deleteObjectPropertyFromOntology = function(ontologyId, objectPropertyIRI) {
                return $http.delete(prefix + encodeURIComponent(ontologyId) + '/object-properties/'
                    + encodeURIComponent(objectPropertyIRI));
            }

            /* Data Properties */
            self.addDataPropertyToOntology = function(ontologyId, dataPropertyJSON) {
                var config = {
                    params: {
                        resourcejson: dataPropertyJSON
                    }
                };
                return $http.post(prefix + encodeURIComponent(ontologyId) + '/data-properties', null, config);
            }

            self.deleteDataPropertyFromOntology = function(ontologyId, dataPropertyIRI) {
                return $http.delete(prefix + encodeURIComponent(ontologyId) + '/data-properties/'
                    + encodeURIComponent(dataPropertyIRI));
            }

            /* Individuals */
            self.addIndividualToOntology = function(ontologyId, individualJSON) {
                var config = {
                    params: {
                        resourcejson: individualJSON
                    }
                };
                return $http.post(prefix + encodeURIComponent(ontologyId) + '/named-individuals', null, config);
            }

            self.deleteIndividualFromOntology = function(ontologyId, individualIRI) {
                return $http.delete(prefix + encodeURIComponent(ontologyId) + '/named-individuals/' 
                    + encodeURIComponent(individualIRI));
            }

            /* Imported ontologies */
            self.getImportsClosure = function(ontologyId, rdfFormat = 'jsonld') {
                var config = {
                    params: {
                        rdfformat: rdfFormat
                    }
                };
                return $http.get(prefix + encodeURIComponent(ontologyId) + '/imported-ontologies', null, config);
            }

            /* UI Functions */
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

            function addOntologyToList(ontologyId, ontology) {
                var deferred = $q.defer();
                // Assumes that all entities have an '@id' if they are not an ontology
                _.forEach(ontology, entity => {
                    if (_.has(entity, '@id')) {
                        _.set(entity, 'matonto.originalIRI', entity['@id']);
                    } else {
                        _.set(entity, 'matonto.anonymous', ontologyId + ' (Anonymous Ontology)');
                    }
                    if (self.isProperty(entity)) {
                        _.set(entity, 'matonto.icon', getIcon(entity));
                    }
                });
                var listItem = {
                    ontologyId: ontologyId,
                    ontology: ontology
                }
                $q.all([
                    $http.get(prefix + encodeURIComponent(ontologyId) + '/iris'),
                    $http.get(prefix + encodeURIComponent(ontologyId) + '/imported-iris')
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
                    listItem.individuals = _.get(irisResponse, 'data.namedIndividuals');
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
                    self.list.push(listItem);
                    deferred.resolve();
                }, () => {
                    deferred.reject();
                });
                console.log(_.join(self.getSuperClassIRIs(ontology)));
                return deferred.promise;
            }

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
                            if (_.get(response, 'status') === 200) {
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
                        if (_.get(response, 'data.persisted') && _.has(response, 'data.ontologyId')) {
                            onUploadSuccess(response.data.ontologyId);
                        } else {
                            onError(response);
                        }
                    }, response => {
                        onError(response);
                    });
                return deferred.promise;
            }

            self.openOntology = function(ontologyId) {
                $rootScope.showSpinner = true;
                var deferred = $q.defer();
                self.getOntology(ontologyId)
                    .then(response => {
                        if (_.has(response, 'data.ontology') && _.has(response, 'data.id')) {
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

            self.closeOntology = function(ontologyId) {
                self.list.splice(_.indexOf(self.list, {id: ontologyId}), 1);
                self.ontologyIds.push(ontologyId);
            }

            self.getPreview = function(ontologyId, rdfFormat) {
                $rootScope.showSpinner = true;
                var deferred = $q.defer();
                self.getOntology(ontologyId, rdfFormat)
                    .then(response => {
                        if (_.has(response, 'data.ontology')) {
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

            self.saveChanges = function(ontologyId, unsavedEntities) {
                var deferred = $q.defer();
                var promises = [];
                _.forEach(unsavedEntities, entity => {
                    promises.push(self.saveChangesToOntology(ontologyId, _.get(entity, 'matonto.originalIRI'),
                        $filter('removeMatonto')(entity)));
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

            self.getListItemById = function(ontologyId) {
                return _.find(self.list, {ontologyId: ontologyId});
            }

            self.setOntologyId = function(oldId, newId) {
                _.set(self.getListItemById(oldId), 'ontologyId', newId);
            }

            self.getOntologyById = function(ontologyId) {
                return _.get(self.getListItemById(ontologyId), 'ontology', []);
            }

            self.getIdByOntology = function(ontology) {
                return _.get(_.find(self.list, {ontology: ontology}), 'id', '');
            }

            self.isOntology = function(entity) {
                return _.indexOf(_.get(entity, '@type', []), prefixes.owl + 'Ontology') !== -1;
            }

            self.hasOntologyEntity = function(ontology) {
                return _.some(ontology, {'@type': [prefixes.owl + 'Ontology']});
            }

            self.getOntologyEntity = function(ontology) {
                return _.find(ontology, {'@type': [prefixes.owl + 'Ontology']});
            }

            self.getOntologyIRI = function(ontology) {
                var entity = self.getOntologyEntity(ontology);
                return _.get(entity, 'matonto.originalIRI', _.get(entity, 'matonto.anonymous', ''));
            }

            self.deleteOntology = function(ontologyId) {
                $rootScope.showSpinner = true;
                var deferred = $q.defer();
                $http.delete(prefix + encodeURIComponent(ontologyId))
                    .then(response => {
                        if (_.get(response, 'data.deleted')) {
                            self.list.splice(_.indexOf(self.list, {id: ontologyId}), 1);
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

            self.createOntology = function(ontologyJSON) {
                $rootScope.showSpinner = true;
                var deferred = $q.defer();
                self.uploadOntologyJson(ontologyJSON)
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

            self.isClass = function(entity) {
                return _.indexOf(_.get(entity, '@type', []), prefixes.owl + 'Class') !== -1;
            }

            self.hasClasses = function(ontology) {
                return _.some(ontology, {'@type': [prefixes.owl + 'Class']});
            }

            self.getClasses = function(ontology) {
                return _.filter(ontology, entity => {
                    return _.isMatch(entity, {'@type': [prefixes.owl + 'Class']})
                        && !_.includes(_.get(entity, '@id'), '_:b');
                });
            }

            self.getClassIRIs = function(ontology) {
                return _.map(self.getClasses(ontology), 'matonto.originalIRI');
            }

            self.deleteClass = function(ontologyId, classIRI) {
                $rootScope.showSpinner = true;
                var deferred = $q.defer();
                self.deleteClassFromOntology(ontologyId, classIRI)
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

            self.createClass = function(ontologyId, classJSON) {
                $rootScope.showSpinner = true;
                var deferred = $q.defer();
                self.addClassToOntology(ontologyId, classJSON)
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

            self.getSuperClasses = function(ontology) {
                var result = [];
                _.forEach(
                    _.filter(ontology, entity => {
                        return _.isMatch(entity, {'@type': [prefixes.owl + 'Class']})
                            && _.has(entity, prefixes.rdfs + 'subClassOf') && !_.includes(_.get(entity, '@id'), '_:b');
                    }),
                    entity => {
                        _.forEach(_.get(entity, prefixes.rdfs + 'subClassOf'), obj => {
                            var entity = self.getEntity(ontology, _.get(obj, '@id'));
                            if (entity && !_.includes(_.get(entity, '@id'), '_:b')) {
                                result.push(entity);
                            }
                        });
                    }
                );
                return _.uniq(result);
            }

            self.getSuperClassIRIs = function(ontology) {
                return _.map(self.getSuperClasses(ontology), 'matonto.originalIRI');
            }

            self.getSubClassesOf = function(ontology, classIRI) {
                return _.filter(ontology, {[prefixes.rdfs + 'subClassOf']: [{'@id': classIRI}]});
            }

            self.hasSubClassesOf = function(ontology, classIRI) {
                return _.some(ontology, {[prefixes.rdfs + 'subClassOf']: [{'@id': classIRI}]});
            }

            self.hasClassProperties = function(ontology, classIRI) {
                return _.some(ontology, {[prefixes.rdfs + 'domain']: [{'@id': classIRI}]});
            }

            self.getClassProperties = function(ontology, classIRI) {
                return _.filter(ontology, {[prefixes.rdfs + 'domain']: [{'@id': classIRI}]});
            }

            self.getClassPropertyIRIs = function(ontology, classIRI) {
                return _.map(self.getClassProperties(ontology, classIRI), 'matonto.originalIRI');
            }

            self.getClassProperty = function(ontology, classIRI, propertyIRI) {
                return _.find(self.getClassProperties(ontology, classIRI), {'@id': propId});
            }

            self.isObjectProperty = function(entity) {
                return _.indexOf(_.get(entity, '@type', []), prefixes.owl + 'ObjectProperty') !== -1;
            }

            self.isDataTypeProperty = function(entity) {
                var types = _.get(entity, '@type', []);
                return _.indexOf(types, prefixes.owl + 'DatatypeProperty') !== -1
                    || _.indexOf(types, prefixes.owl + 'DataTypeProperty') !== -1;
            }

            self.isProperty = function(entity) {
                return self.isObjectProperty(entity) || self.isDataTypeProperty(entity);
            }

            self.hasNoDomainProperties = function(ontology) {
                return _.some(ontology, entity => {
                    return self.isProperty(entity) && !_.has(entity, prefixes.rdfs + 'domain');
                });
            }

            self.getNoDomainProperties = function(ontology) {
                return _.filter(ontology, entity => {
                    return self.isProperty(entity) && !_.has(entity, prefixes.rdfs + 'domain');
                });
            }

            self.getNoDomainPropertyIRIs = function(ontology) {
                return _.map(self.getNoDomainProperties(ontology), 'matonto.originalIRI');
            }

            self.hasObjectProperties = function(ontology) {
                return _.some(ontology, entity => {
                    return self.isObjectProperty(entity);
                });
            }

            self.getObjectProperties = function(ontology) {
                return _.filter(ontology, entity => {
                    return self.isObjectProperty(entity);
                });
            }

            self.getObjectPropertyIRIs = function(ontology) {
                return _.map(self.getObjectProperties(ontology), 'matonto.originalIRI');
            }

            self.deleteObjectProperty = function(ontologyId, propertyIRI) {
                $rootScope.showSpinner = true;
                var deferred = $q.defer();
                self.deleteObjectPropertyFromOntology(ontologyId, propertyIRI)
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

            self.createObjectProperty = function(ontologyId, propertyJSON) {
                $rootScope.showSpinner = true;
                var deferred = $q.defer();
                self.addObjectPropertyToOntology(ontologyId, propertyJSON)
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

            self.getSuperObjectProperties = function(ontology) {
                var result = [];
                _.forEach(_.filter(ontology, entity => {
                    return self.isObjectProperty(entity) && _.has(entity, prefixes.rdfs + 'subPropertyOf');
                }), entity => {
                    _.forEach(_.get(entity, prefixes.rdfs + 'subPropertyOf'), obj => {
                        var entity = self.getEntity(ontology, _.get(obj, '@id'));
                        if (entity && !_.has(entity, prefixes.rdfs + 'subPropertyOf')) {
                            result.push(entity);
                        }
                    });
                });
                return result;
            }

            self.getSuperObjectPropertyIRIs = function(ontology) {
                return _.map(self.getSuperObjectProperties(ontology), 'matonto.originalIRI');
            }

            self.getSubObjectPropertiesOf = function(ontology, propertyIRI) {
                return _.filter(ontology, {[prefixes.rdfs + 'subPropertyOf']: [{'@id': propertyIRI}]});
            }

            self.getSubObjectPropertiesOf = function(ontology, propertyIRI) {
                return _.some(ontology, {[prefixes.rdfs + 'subPropertyOf']: [{'@id': propertyIRI}]});
            }

            self.hasDataTypeProperties = function(ontology) {
                return _.some(ontology, entity => {
                    return self.isDataTypeProperty(entity);
                });
            }

            self.getDataTypeProperties = function(ontology) {
                return _.filter(ontology, entity => {
                    return self.isDataTypeProperty(entity);
                });
            }

            self.getDataTypePropertyIRIs = function(ontology) {
                return _.map(self.getDataTypeProperties(ontology), 'matonto.originalIRI');
            }

            self.deleteDataTypeProperty = function(ontologyId, propertyIRI) {
                $rootScope.showSpinner = true;
                var deferred = $q.defer();
                self.deleteDataPropertyFromOntology(ontologyId, propertyIRI)
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

            self.createDataTypeProperty = function(ontologyId, propertyJSON) {
                $rootScope.showSpinner = true;
                var deferred = $q.defer();
                self.addDataPropertyToOntology(ontologyId, propertyJSON)
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

            self.hasAnnotations = function(ontology) {
                return _.some(ontology, {'@type': [prefixes.owl + 'AnnotationProperty']});
            }

            self.getAnnotations = function(ontology) {
                return _.filter(ontology, {'@type': [prefixes.owl + 'AnnotationProperty']});
            }

            self.getAnnotationIRIs = function(ontology) {
                return _.map(self.getAnnotations(ontology), 'matonto.originalIRI');
            }

            self.isIndividual = function(entity) {
                return _.includes(_.get(entity, '@type', []), prefixes.owl + 'NamedIndividual');
            }

            self.getIndividuals = function(ontology) {
                return _.filter(ontology, entity => _.includes(_.get(entity, '@type', []), prefixes.owl + 'NamedIndividual'));
            }

            self.hasClassIndividuals = function(ontology, classIRI) {
                return _.some(self.getIndividuals(ontology), entity => _.includes(_.get(entity, '@type', []), classIRI));
            }

            self.getClassIndividuals = function(ontology, classIRI) {
                return _.filter(self.getIndividuals(ontology), entity => _.includes(_.get(entity, '@type', []), classIRI));
            }

            self.deleteIndividual = function(ontologyId, individualIRI) {
                $rootScope.showSpinner = true;
                var deferred = $q.defer();
                self.deleteIndividualFromOntology(ontologyId, individualIRI)
                    .then(response => {
                        onDeleteSuccess(response, ontologyId, individualIRI, 'individuals', deferred);
                    }, response => {
                        onDeleteError(response, deferred);
                    })
                    .then(() => {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
            }

            self.createIndividual = function(ontologyId, individualJSON) {
                $rootScope.showSpinner = true;
                var deferred = $q.defer();
                self.addIndividualToOntology(ontologyId, individualJSON)
                    .then(response => {
                        onCreateSuccess(response, ontologyId, individualJSON, 'individuals', deferred);
                    }, response => {
                        onCreateError(response, deferred);
                    })
                    .then(() => {
                        $rootScope.showSpinner = false;
                    });
                return deferred.promise;
            }

            self.getRestrictions = function(ontology) {
                return _.filter(ontology, {'@type': [prefixes.owl + 'Restriction']});
            }

            self.getBlankNodes = function(ontology) {
                return _.filter(ontology, entity => {
                    return _.includes(_.get(entity, '@id'), '_:b');
                });
            }

            self.getEntity = function(ontology, entityIRI) {
                return _.find(ontology, {matonto:{originalIRI: entityIRI}}) || _.find(ontology, {'@id': entityIRI});
            }

            self.removeEntity = function(ontologyId, entityIRI) {
                return _.remove(self.getOntologyById(ontologyId), {matonto:{originalIRI: entityIRI}});
            }

            self.addEntity = function(ontologyId, entityJSON) {
                self.getOntologyById(ontologyId).push(entityJSON);
            }

            self.getBeautifulIRI = function(iri) {
                var splitEnd = $filter('splitIRI')(iri).end;
                return splitEnd ? $filter('beautify')(splitEnd) : iri;
            }

            self.getEntityName = function(entity) {
                var result = _.get(entity, "['" + prefixes.rdfs + "label'][0]['@value']") || _.get(entity, "['"
                    + prefixes.dcterms + "title'][0]['@value']") || _.get(entity, "['" + prefixes.dc
                    + "title'][0]['@value']");
                if (!result) {
                    if (_.has(entity, '@id')) {
                        result = self.getBeautifulIRI(entity['@id']);
                    } else {
                        result = _.get(entity, 'matonto.anonymous', '(Entity has no IRI)');
                    }
                }
                return result;
            }

            self.findOntologyWithClass = function(ontologyList, classIRI) {
                return _.find(ontologyList, ontology => {
                    return _.findIndex(self.getClasses(ontology), {'@id': classIRI}) !== -1;
                });
            }

            self.getImportedOntologies = function(ontologyId) {
                $rootScope.showSpinner = true;
                var deferred = $q.defer();
                self.getImportsClosure(ontologyId)
                    .then(response => {
                        if(_.get(response, 'status') === 200 && _.has(response, 'data')) {
                            deferred.resolve(response.data);
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

            // TODO: Update this to handle loading the page the first time.
            // Update - including the ontologyManagerService at the app.js level caused this because the rest endpoint
            //          is secured and can't get results whenever you aren't logged in. Singleton service.
            function initialize() {
                $rootScope.showSpinner = true;
                self.getAllOntologyIds()
                    .then(response => {
                        _.forEach(_.get(response, 'data'), id => {
                            self.ontologyIds.push(id);
                        });
                    }, response => {
                        console.log(response.data.error);
                    })
                    .then(() => {
                        $rootScope.showSpinner = false;
                    });
            }

            initialize();
        }
})();

(function() {
    'use strict';

    angular
        .module('mappingManager', ['ontologyManager', 'prefixes'])
        .service('mappingManagerService', mappingManagerService);

        mappingManagerService.$inject = ['$window', '$rootScope', '$filter', '$http', '$q', '$cookies', 'ontologyManagerService', 'prefixes', 'uuid'];

        function mappingManagerService($window, $rootScope, $filter, $http, $q, $cookies, ontologyManagerService, prefixes, uuid) {
            var self = this,
                prefix = '/matontorest/mappings';
            self.previousMappingNames = [];

            initialize();

            function initialize() {
                $http.get(prefix, {})
                    .then(function(response) {
                        var userMappingNames = getCookieMappings();
                        // Delete any mapping cookies whose files are no longer saved
                        _.forEach(_.keys(userMappingNames), function(uuid) {
                            if (response.data.indexOf(uuid) < 0) {
                                deleteMappingCookie(uuid);
                            }
                        });
                        // Collect the uuids of uploaded mapping files that are saved in cookies
                        var uuids = _.filter(response.data, function(uuid) {
                            return userMappingNames.hasOwnProperty(uuid);
                        });
                        self.previousMappingNames = _.map(uuids, function(uuid) {
                            return userMappingNames[uuid];
                        });
                    });
            }

            // REST endpoint calls
            /**
             * HTTP POST to mappings which uploads a mapping file to data/tmp/ directory.
             * @param {object} mapping - A JSON-LD object with a mapping
             * @param {string} mappingName - The user-defined name for the mapping file
             * @return {promise} The response data with the name of the uploaded file
             */
            self.upload = function(mapping, mappingName) {
                var deferred = $q.defer(),
                    fd = new FormData(),
                    config = {
                        transformRequest: angular.identity,
                        headers: {
                            'Content-Type': undefined
                        }
                    };
                fd.append('jsonld', angular.toJson(mapping));

                $rootScope.showSpinner = true;
                $http.post(prefix, fd, config)
                    .then(function(response) {
                        $rootScope.showSpinner = false;
                        setMappingCookie(response.data, mappingName);
                        self.previousMappingNames.push(mappingName);
                        deferred.resolve(response.data);
                    }, function(response) {
                        $rootScope.showSpinner = false;
                        deferred.reject(response);
                    });
                return deferred.promise;
            }
            /**
             * HTTP GET to mappings/{mappingName} which returns the JSON-LD of an 
             * uploaded mapping file.
             * @param {string} mappingName - The user-defined name for the mapping file
             * @return {promise} The response data with the JSON-LD in the uploaded file
             */
            self.getMapping = function(mappingName) {
                var deferred = $q.defer();
                $rootScope.showSpinner = true;
                if (getMappingUUID(mappingName)) {
                    $http.get(prefix + '/' + encodeURIComponent(getMappingUUID(mappingName)), {})
                        .then(function(response) {
                            $rootScope.showSpinner = false;
                            deferred.resolve(response.data);
                        }, function(response) {
                            $rootScope.showSpinner = false;
                            deferred.reject(response);
                        });
                } else {
                    $rootScope.showSpinner = false;
                    deferred.reject("Mapping", mappingName, "doesn't exist");
                }
                return deferred.promise;
            }
            /**
             * HTTP GET to mappings/{mappingName} which returns an octet-stream with the
             * JSON-LD of an uploaded mapping file.
             * @param {string} mappingName - The user-defined name for the mapping file
             * @return {promise} The response data with the octet-stream containing the 
             *                   JSON-LD in the uploaded file
             */
            self.downloadMapping = function(mappingName) {
                var deferred = $q.defer();
                if (getMappingUUID(mappingName)) {
                    var config = {
                        headers: {
                            'Accept': 'application/octet-stream'
                        }
                    };
                    
                    $http.get(prefix + '/' + encodeURIComponent(getMappingUUID(mappingName)), config)
                        .then(function(response) {
                            deferred.resolve(response.data);
                        }, function(response) {
                            deferred.reject(response);
                        });
                } else {
                    deferred.reject("Mapping", mappingName, "doesn't exist");
                }
                return deferred.promise;
            }

            // Edit mapping methods 
            self.createNewMapping = function(mappingName) {
                var jsonld = [];
                jsonld = addSingleEntity(jsonld, prefixes.delim + 'Document');
                var documentEntity = {
                    '@id': prefixes.dataDelim + 'Document',
                    '@type': [prefixes.delim + 'Document']
                };
                jsonld.push(documentEntity);
                return {
                    jsonld,
                    name: mappingName
                };
            }
            self.setSourceOntology = function(mapping, ontologyId) {
                var newMapping = angular.copy(mapping);
                var documentEntity = getEntityById(newMapping.jsonld, prefixes.dataDelim + 'Document');
                documentEntity[prefixes.delim + 'sourceOntology'] = [{'@id': ontologyId}];
                return newMapping;
            }
            self.addClass = function(mapping, classId) {
                var newMapping = angular.copy(mapping);
                // Check if class exists in ontology
                if (ontologyManagerService.getClass(self.getSourceOntologyId(newMapping), classId)) {
                    // Add entities for ontology class ids
                    newMapping.jsonld = addSingleEntity(newMapping.jsonld, prefixes.delim + 'ClassMapping');
                    newMapping.jsonld = addSingleEntity(newMapping.jsonld, classId);
                    // Collect IRI sections for prefix and create class mapping
                    var splitIri = $filter('splitIRI')(classId);
                    var ontologyDataName = $filter('beautify')(($filter('splitIRI')(self.getSourceOntologyId(newMapping))).end).toLowerCase();
                    var classEntity = {
                        '@id': prefixes.dataDelim + uuid.v4(),
                        '@type': [prefixes.delim + 'ClassMapping']
                    };
                    classEntity[prefixes.delim + 'mapsTo'] = [{'@id': classId}];
                    classEntity[prefixes.delim + 'hasPrefix'] = [{'@value': prefixes.data + ontologyDataName + '/' + splitIri.end.toLowerCase() + '/'}];
                    classEntity[prefixes.delim + 'localName'] = [{'@value': '${UUID}'}];
                    newMapping.jsonld.push(classEntity);
                }

                return newMapping;
            }
            self.editIriTemplate = function(mapping, classMappingId, prefixEnd, localNamePattern) {
                var newMapping = angular.copy(mapping);
                // Check if class exists in ontology
                if (entityExists(newMapping.jsonld, classMappingId)) {
                    var classMapping = getEntityById(newMapping.jsonld, classMappingId);
                    var ontologyDataName = $filter('beautify')(($filter('splitIRI')(self.getSourceOntologyId(newMapping))).end).toLowerCase();
                    classMapping[prefixes.delim + 'hasPrefix'] = [{'@value': prefixes.data + ontologyDataName + '/' + prefixEnd}];
                    classMapping[prefixes.delim + 'localName'] = [{'@value': localNamePattern}];
                }

                return newMapping
            }
            self.addDataProp = function(mapping, classMappingId, propId, columnIndex) {
                var newMapping = angular.copy(mapping);
                // If class mapping doesn't exist or the property does not exist for that class,
                // return the mapping
                if (entityExists(newMapping.jsonld, classMappingId) && ontologyManagerService.getClassProperty(
                    self.getSourceOntologyId(newMapping), self.getClassIdByMappingId(newMapping, classMappingId), propId)) {
                    // Add entity for property id
                    newMapping.jsonld = addSingleEntity(newMapping.jsonld, propId);
                    var dataEntity = self.getDataMappingFromClass(mapping.jsonld, classMappingId, propId);
                    // If the data property and mapping already exist, update the column index
                    if (dataEntity) {
                        dataEntity[prefixes.delim + 'columnIndex'] = [{'@value': `${columnIndex}`}];
                        _.remove(newMapping.jsonld, {'@id': dataEntity['@id']});
                    } else {
                        // Add new data mapping id to data properties of class mapping
                        var dataEntity = {
                            '@id': prefixes.dataDelim + uuid.v4()
                        };
                        var classMapping = getEntityById(newMapping.jsonld, classMappingId);
                        // Sets the dataProperty key if not already present
                        classMapping[prefixes.delim + 'dataProperty'] = getDataProperties(classMapping);
                        classMapping[prefixes.delim + 'dataProperty'].push(angular.copy(dataEntity));
                        // Create data mapping
                        dataEntity['@type'] = [prefixes.delim + 'DataMapping'];
                        dataEntity[prefixes.delim + 'columnIndex'] = [{'@value': `${columnIndex}`}];
                        dataEntity[prefixes.delim + 'hasProperty'] = [{'@id': propId}];
                    }
                    // Add/update data mapping
                    newMapping.jsonld.push(dataEntity);
                }
                return newMapping;
            }
            self.addObjectProp = function(mapping, classMappingId, propId) {
                var newMapping = angular.copy(mapping);
                var propObj = ontologyManagerService.getClassProperty(
                    self.getSourceOntologyId(newMapping), self.getClassIdByMappingId(newMapping, classMappingId), propId);
                // Check if object property exists for class in ontology and if class mapping exists
                if (entityExists(newMapping.jsonld, classMappingId) && propObj) {
                    // Add entity for property id
                    newMapping.jsonld = addSingleEntity(newMapping.jsonld, propId);
                    // Add new object mapping id to object properties of class mapping
                    var dataEntity = {
                        '@id': prefixes.dataDelim + uuid.v4()
                    };
                    var classMapping = getEntityById(newMapping.jsonld, classMappingId);
                    classMapping[prefixes.delim + 'objectProperty'] = getObjectProperties(classMapping);
                    classMapping[prefixes.delim + 'objectProperty'].push(angular.copy(dataEntity));
                    // Find the range of the object property (currently only supports a single class)
                    var rangeClass = propObj[prefixes.rdfs + 'range'][0]['@id'];
                    var rangeClassMappings = getClassMappingsByClass(newMapping.jsonld, rangeClass);

                    // Create class mapping for range of object property
                    newMapping = self.addClass(newMapping, rangeClass);
                    var newClassMapping = _.differenceBy(getClassMappingsByClass(newMapping.jsonld, rangeClass), rangeClassMappings, '@id')[0];
                    // Create object mapping
                    dataEntity['@type'] = [prefixes.delim + 'ObjectMapping'];
                    dataEntity[prefixes.delim + 'classMapping'] = [{'@id': newClassMapping['@id']}];
                    dataEntity[prefixes.delim + 'hasProperty'] = [{'@id': propId}];
                    newMapping.jsonld.push(dataEntity);
                }
                return newMapping;
            }
            self.removeProp = function(mapping, classMappingId, propMappingId) {
                var newMapping = angular.copy(mapping);
                if (entityExists(mapping.jsonld, propMappingId)) {
                    // Collect the property mapping, the property id entity, and the class mapping
                    var propMapping = getEntityById(newMapping.jsonld, propMappingId);
                    var propEntity = getEntityById(newMapping.jsonld, self.getPropIdByMapping(propMapping));
                    var propType = self.isObjectMapping(propMapping) ? 'objectProperty' : 'dataProperty';
                    var classMapping = getEntityById(newMapping.jsonld, classMappingId);
                    // Remove the property mapping and the property id entity if it isn't used elsewhere
                    _.pull(newMapping.jsonld, propMapping);
                    if (getMappingsForProp(newMapping.jsonld, propEntity['@id']).length === 0) {
                        _.pull(newMapping.jsonld, propEntity);
                    }
                    // Remove the property mapping id from the class mapping's properties
                    _.remove(classMapping[prefixes.delim + propType], {'@id': propMappingId});
                    cleanPropertyArray(classMapping, propType);
                }
                return newMapping;
            }
            self.removeClass = function(mapping, classMappingId) {
                var newMapping = angular.copy(mapping);
                if (entityExists(newMapping.jsonld, classMappingId)) {
                    // Collect class mapping and any object mappings that use the class mapping
                    var classMapping = getEntityById(newMapping.jsonld, classMappingId);
                    var classId = self.getClassIdByMapping(classMapping);
                    // Remove the class id entity
                    if (_.filter(newMapping.jsonld, ["['" + prefixes.delim + "mapsTo'][0]['@id']", classId]).length <= 1) {
                        _.pull(newMapping.jsonld, getEntityById(newMapping.jsonld, classId));
                    }
                    var objectMappings = _.filter(
                        getAllObjectMappings(newMapping.jsonld),
                        ["['" + prefixes.delim + "classMapping'][0]['@id']", classMapping['@id']]
                    );
                    // If there are object mappings that use the class mapping, iterate through them
                    _.forEach(objectMappings, function(objectMapping) {
                        // Collect the class mapping that uses the object mapping
                        var classWithObjectMapping = self.findClassWithObjectMapping(newMapping.jsonld, objectMapping['@id']);
                        // Remove the object property for the object mapping
                        _.remove(classWithObjectMapping[prefixes.delim + 'objectProperty'], {'@id': objectMapping['@id']});
                        cleanPropertyArray(classWithObjectMapping, 'objectProperty');
                        // Remove object mapping
                        _.pull(newMapping.jsonld, objectMapping);
                        // Remove the property id entity for the object mapping if no other object mappings use it
                        var propEntity = getEntityById(newMapping.jsonld, self.getPropIdByMapping(objectMapping));
                        if (getMappingsForProp(newMapping.jsonld, propEntity['@id']).length === 0) {
                            _.pull(newMapping.jsonld, propEntity);
                        }
                    });
                    // Remove all properties of the class mapping and the class mapping itself
                    _.forEach(_.concat(getDataProperties(classMapping), getObjectProperties(classMapping)), function(prop) {
                        newMapping = self.removeProp(newMapping, classMapping['@id'], prop['@id']);
                    });
                    _.remove(newMapping.jsonld, {'@id': classMapping['@id']});
                }

                return newMapping;
            }

            // Public helper methods
            self.getClassIdByMappingId = function(mapping, classMappingId) {
                return self.getClassIdByMapping(getEntityById(mapping.jsonld, classMappingId));
            }
            self.getClassIdByMapping = function(classMapping) {
                return _.get(classMapping, "['" + prefixes.delim + "mapsTo'][0]['@id']");
            }
            self.getPropIdByMappingId = function(mapping, propMappingId) {
                return self.getPropIdByMapping(getEntityById(mapping.jsonld, propMappingId));
            }
            self.getPropIdByMapping = function(propMapping) {
                return _.get(propMapping, "['" + prefixes.delim + "hasProperty'][0]['@id']");
            }
            self.getSourceOntologyId = function(mapping) {
                return _.get(
                    getEntityById(mapping.jsonld, prefixes.dataDelim + 'Document'),
                    "['" + prefixes.delim + "sourceOntology'][0]['@id']"
                );
            }
            self.getMappedClassIds = function(mapping) {
                return _.map(getAllClassMappings(mapping.jsonld), "['" + prefixes.delim + "mapsTo'][0]['@id']");
            }
            self.getDataMappingFromClass = function(jsonld, classMappingId, propId) {
                var dataProperties = _.map(getDataProperties(getEntityById(jsonld, classMappingId)), '@id');
                var dataMappings = getMappingsForProp(jsonld, propId);
                if (dataProperties.length && dataMappings.length) {
                    return _.find(dataMappings, function(mapping) {
                        return dataProperties.indexOf(mapping['@id']) >= 0;
                    });
                }
                return undefined;
            }
            self.getPropMappingsByClass = function(mapping, classMappingId) {
                var classMapping = getEntityById(mapping.jsonld, classMappingId);
                return _.intersectionBy(
                    mapping.jsonld, _.concat(getDataProperties(classMapping), getObjectProperties(classMapping)), 
                    '@id'
                );
            }
            self.isObjectMapping = function(entity) {
                return isType(entity, 'ObjectMapping');
            }
            self.isDataMapping = function(entity) {
                return isType(entity, 'DataMapping');
            }
            self.getMappedColumns = function(mapping) {
                return _.map(getAllDataMappings(mapping.jsonld), function(dataMapping) {
                    var index = dataMapping[prefixes.delim + 'columnIndex'][0]['@value'];
                    return {
                        index,
                        propId: dataMapping['@id']
                    };
                });
            }
            self.findClassWithDataMapping = function(jsonld, dataMappingId) {
                return findClassWithPropMapping(jsonld, dataMappingId, 'dataProperty');
            }
            self.findClassWithObjectMapping = function(jsonld, objectMappingId) {
                return findClassWithPropMapping(jsonld, objectMappingId, 'objectProperty');
            } 

            // Private helper methods
            function getCookieMappings() {
                return $cookies.getObject('mappings') ? $cookies.getObject('mappings') : {};
            }
            function deleteMappingCookie(uuid) {
                var mappings = getCookieMappings();
                delete mappings[uuid];
                $cookies.putObject('mappings', mappings);
            }
            function getMappingUUID(mappingName) {
                var mappings = getCookieMappings();
                return _.findKey(mappings, _.partial(_.isEqual, mappingName));
            }
            function setMappingCookie(uuid, name) {
                var mappings = getCookieMappings();
                mappings[uuid] = name;
                $cookies.putObject('mappings', mappings, {expires: new $window.Date(3000, 1, 1)});
            }
            function addSingleEntity(jsonld, id) {
                var newJsonld = angular.copy(jsonld);
                if (!entityExists(newJsonld, id)) {
                    newJsonld.push({'@id': id});
                }
                return newJsonld;
            }
            function cleanPropertyArray(classMapping, propType) {
                if (_.get(classMapping, prefixes.delim + propType) && _.get(classMapping, prefixes.delim + propType).length === 0) {
                    delete classMapping[prefixes.delim + propType];
                }
            }
            function getEntitiesByType(jsonld, type) {
                return _.filter(jsonld, {'@type': [prefixes.delim + type]});
            }
            function getEntityById(jsonld, id) {
                return _.find(jsonld, {'@id': id});
            }
            function entityExists(jsonld, id) {
                return !!getEntityById(jsonld, id);
            }
            function getAllClassMappings(jsonld) {
                return getEntitiesByType(jsonld, 'ClassMapping');
            }
            function getClassMappingsByClass(jsonld, classId) {
                return _.filter(getAllClassMappings(jsonld), ["['" + prefixes.delim + "mapsTo'][0]['@id']", classId]);
            }
            function getAllDataMappings(jsonld) {
                return getEntitiesByType(jsonld, 'DataMapping');
            }
            function getAllObjectMappings(jsonld) {
                return getEntitiesByType(jsonld, 'ObjectMapping');
            }
            function getMappingsForProp(jsonld, propId) {
                var propMappings = _.concat(getAllDataMappings(jsonld), getAllObjectMappings(jsonld));
                return _.filter(propMappings, [prefixes.delim + 'hasProperty', [{'@id': propId}]]);
            }
            function findClassWithPropMapping(jsonld, propMappingId, type) {
                return _.find(getAllClassMappings(jsonld), function(classMapping) {
                    return _.map(getProperties(classMapping, type), '@id').indexOf(propMappingId) >= 0;
                });
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
        }
})();
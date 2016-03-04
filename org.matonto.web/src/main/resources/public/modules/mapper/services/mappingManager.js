(function() {
    'use strict';

    angular
        .module('mappingManager', ['ontologyManager', 'prefixes'])
        .service('mappingManagerService', mappingManagerService);

        mappingManagerService.$inject = ['ontologyManagerService', 'prefixes'];


        function mappingManagerService(ontologyManagerService, prefixes) {
            var self = this,
                prefix = 'matontorest/etl';
            self.previousMappingNames = [];
            self.propMappingIds = {
                data: 1,
                object: 1
            };

            initialize();

            function initialize() {}
            function getClassMappings(jsonld) {
                return jsonld.filter(function(entity) {
                    return entity.hasOwnProperty('@type') && angular.equals(entity['@type'], [prefixes.delim + 'ClassMapping']);
                });
            }
            function getClassMapping(jsonld, classId) {
                var classMappings = getClassMappings(jsonld);
                return classMappings.find(function(entity) {
                    return entity.hasOwnProperty(prefixes.delim + 'mapsTo') && entity[prefixes.delim + 'mapsTo'][0]['@id'] === classId;
                });
            }
            function classMappingExists(jsonld, classId) {
                !!getClassMapping(jsonld, classId);
            }
            function getAllDataMappings(jsonld) {
                return jsonld.filter(function(entity) {
                    return entity['@id'].indexOf('DataMapping') >= 0;
                });
            }
            function getDataMappingsForProp(jsonld, propId) {
                var dataMappings = getAllDataMappings(jsonld);
                return dataMappings.filter(function(entity) {
                    return entity.hasOwnProperty(prefixes.delim + 'hasProperty') && entity[prefixes.delim + 'mapsTo'][0]['@id'] === propId;
                });
            }
            function getDataMappingFromClass(jsonld, classId, propId) {
                var classMapping = getClassMapping(jsonld, classId);
                var dataMappings = getDataMappingsForProp(jsonld, propId);
                if (classMapping && dataMappings.length) {
                    if (classMapping.hasOwnProperty(prefixes.delim + 'dataProperty')) {
                        var dataProperties = classMapping[prefixes.delim + 'dataProperty'].map(function(entity) {
                            return entity['@id'];
                        });
                        return dataMappings.filter(function(prop) {
                            return dataProperties.indexOf(prop['@id']) !== -1;
                        })[0];
                    }
                }
                return undefined;
            }
            function dataPropertyExists(jsonld, classId, propId) {
                return !!getDataMappingFromClass(jsonld, classId, propId);
            }
            function entityExists(jsonld, id) {
                return !!jsonld.find(function(entity) {
                    return  entity['@id'] === id;
                });
            }
            function addSingleEntity(jsonld, idString) {
                var newJsonld = angular.copy(jsonld);
                if (!entityExists(newJsonld, idString)) {
                    newJsonld.push({'@id': idString});
                }
                return newJsonld;
            }
            function newMappingId(type) {
                var id;
                if (type === 'data') {
                    id = prefixes.dataDelim + 'DataMapping' + self.propMappingIds.data;
                    self.propMappingIds.data++;
                } else {
                    id = prefixes.dataDelim + 'ObjectMapping' + self.propMappingIds.object;
                    self.propMappingIds.object++;
                }
                return id;
            }


            self.getMappingNames = function() {}
            self.getMapping = function(mappingName) {}
            self.getMappingColumns = function(mappingName) {}
            self.createNewMapping = function(mappingName, separator) {
                var jsonld = [];
                jsonld = addSingleEntity(jsonld, prefixes.delim + 'Document');
                var documentEntity = {
                    "@id": prefixes.dataDelim + "Document",
                    "@type": prefixes.delim + "Document"
                };
                switch (separator) {
                    case "comma":
                        documentEntity[prefixes.delim + "separator"] = [{"@value": ","}];
                        break;
                    case "tab":
                        documentEntity[prefixes.delim + "separator"] = [{"@value": "\t"}];
                        break;
                    case "space":
                        documentEntity[prefixes.delim + "separator"] = [{"@value": " "}];
                        break;
                    default:
                        documentEntity[prefixes.delim + "separator"] = [{"@value": separator}];
                        break;
                }
                jsonld.push(documentEntity);
                return {
                    jsonld,
                    name: mappingName
                };
            }
            self.addClass = function(mapping, ontologyId, classId, localNamePattern) {
                var newMapping = angular.copy(mapping);
                var classObj = ontologyManagerService.getClass(ontologyId, classId);
                if (classObj && !classMappingExists(newMapping.jsonld, classId)) {
                    newMapping.jsonld = addSingleEntity(newMapping.jsonld, prefixes.delim + 'ClassMapping');
                    newMapping.jsonld = addSingleEntity(newMapping.jsonld, classId);
                    var ontologyDelimiter = ontologyManagerService.getDelimiter(ontologyId);
                    var className = classId.split(ontologyDelimiter).pop();
                    var ontologyDataName = classId.replace(ontologyDelimiter + className, '').split('/').pop();
                    var classEntity = {
                        '@id': prefixes.dataDelim + className,
                        '@type': [prefixes.delim + 'ClassMapping']
                    };
                    classEntity[prefixes.delim + 'mapsTo'] = [{'@id': classId}];
                    classEntity[prefixes.delim + 'hasPrefix'] = [{'@value': prefixes.data + ontologyDataName + '/' + className.toLowerCase() + '/'}];
                    classEntity[prefixes.delim + 'localName'] = [{'@value': "${" + localNamePattern + "}"}];
                    newMapping.jsonld.push(classEntity);
                }

                return newMapping;
            }

            self.addDataProp = function(mapping, ontologyId, classId, propId, columnIndex) {
                var newMapping = angular.copy(mapping);
                var propObj = ontologyManagerService.getClassProperty(ontologyId, classId, propId);
                if (propObj && classMappingExists(newMapping.jsonld, classId)) {
                    newMapping.jsonld = addSingleEntity(newMapping.jsonld, propId);
                    var dataEntity;
                    if (dataPropertyExists(newMapping.jsonld, classId, propId)) {
                        dataEntity = getDataMappingFromClass(mapping.jsonld, classId, propId);
                        dataEntity[prefixes.delim + 'columnIndex'] = [{'@value': `${columnIndex}`}];
                    } else {
                        var dataEntity = {
                            '@id': newMappingId('data') 
                        };
                        var classMapping = getClassMapping(newMapping.jsonld, classId);
                        if (!classMapping.hasOwnProperty(prefixes.delim + 'dataProperty')) {
                            classMapping[prefixes.delim + 'dataProperty'] = [];
                        }
                        classMapping[prefixes.delim + 'dataProperty'].push(angular.copy(dataEntity));
                        dataEntity[prefixes.delim + 'columnIndex'] = [{'@value': `${columnIndex}`}];
                        dataEntity[prefixes.delim + 'hasProperty'] = [{'@id': propId}];
                        newMapping.jsonld.push(dataEntity);
                    }
                }
                return newMapping;
            }
            self.addObjectProp = function(mapping, ontologyId, classId, propId, localNamePattern) {

            }
            self.getMappedClassIds = function(mapping) {
                return getClassMappings(mapping.jsonld).map(function(classMapping) {
                    return classMapping[prefixes.delim + 'mapsTo'][0]['@id'];
                });
            }
            self.getMappedPropIdsByClass = function(mapping, classId) {
                var classMapping = getClassMapping(mapping.jsonld, classId);
                var objectProps = classMapping.hasOwnProperty(prefixes.delim + 'objectProperty') ? classMapping[prefixes.delim + 'objectProperty'] : [];
                var dataProps = classMapping.hasOwnProperty(prefixes.delim + 'dataProperty') ? classMapping[prefixes.delim + 'dataProperty'] : [];
                return objectProps.concat(dataProps).map(function(entity) {
                    return entity['@id'];
                });
            }
        }
})();
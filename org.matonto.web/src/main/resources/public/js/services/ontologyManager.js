(function() {
    'use strict';

    angular
        .module('ontologyManager', ['splitIRI', 'beautify', 'updateRefs', 'camelCase', 'responseObj', 'prefixes', 'annotationManager'])
        .service('ontologyManagerService', ontologyManagerService);

        ontologyManagerService.$inject = ['$rootScope', '$http', '$q', '$timeout', '$filter', 'FileSaver', 'Blob', 'updateRefsService', 'responseObj', 'prefixes', 'uuid', 'annotationManagerService'];

        function ontologyManagerService($rootScope, $http, $q, $timeout, $filter, FileSaver, Blob, updateRefsService, responseObj, prefixes, uuid, annotationManagerService) {
            var self = this,
                prefix = '/matontorest/ontologies',
                defaultDatatypes = _.map(['anyURI', 'boolean', 'byte', 'dateTime', 'decimal', 'double', 'float', 'int', 'integer', 'language', 'long', 'string'], function(item) {
                    return {
                        'namespace': prefixes.xsd,
                        'localName': item
                    }
                }),
                defaultAnnotations = annotationManagerService.getDefaultAnnotations(),
                changedEntries = [],
                ontologies = [],
                propertyTypes = [
                    prefixes.owl + 'DatatypeProperty',
                    prefixes.owl + 'ObjectProperty'
                ],
                ontologyIds = [],
                ontologyTemplate = {
                    '@id': '',
                    '@type': [prefixes.owl + 'Ontology'],
                    matonto: {
                        delimiter: '#',
                        classes: [],
                        annotations: defaultAnnotations,
                        isValid: true,
                        subClasses: [],
                        subDataProperties: [],
                        subObjectProperties: [],
                        dataPropertyRange: defaultDatatypes,
                        noDomains: []
                    }
                },
                classTemplate = {
                    '@id': '',
                    '@type': [prefixes.owl + 'Class'],
                    matonto: {
                        properties: []
                    }
                },
                propertyTemplate = {
                    '@id': '',
                    '@type': [],
                    matonto: {}
                };

            initialize();

            function initialize() {
                $rootScope.showSpinner = true;

                $http.get(prefix + '/ontologyids')
                    .then(function(response) {
                        console.log('Successfully retrieved ontology ids');
                        for(var i = 0; i < response.data.length; i++) {
                            ontologyIds.push(response.data[i]);
                        }
                    }, function(response) {
                        console.error('Error in initialize() function');
                    })
                    .then(function() {
                        $rootScope.showSpinner = false;
                    });
            }

            function initOntology(ontology, obj) {
                var delimiter = _.last(obj['@id']);
                obj.matonto = {
                    originalId: obj['@id'],
                    blankNodes: [],
                    classExpressions: {},
                    propertyExpressions: {},
                    unionOfs: {},
                    intersectionOfs: {},
                    delimiter: _.includes(['#', ':', '/'], delimiter) ? delimiter : '#',
                    isValid: true
                }

                angular.merge(ontology, obj);
            }

            function chooseIcon(property) {
                var icon = '',
                    range = property[prefixes.rdfs + 'range'];
                // assigns the icon based on the range
                if(range) {
                    if(range.length === 1) {
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
                    }
                    else {
                        icon = 'fa-cubes';
                    }
                }
                // return the class for an icon from Font Awesome
                return icon;
            }

            function addToClass(id, property, classes) {
                var i = 0;
                while(i < classes.length) {
                    if(classes[i]['@id'] === id) {
                        classes[i].matonto.properties.push(property);
                        break;
                    }
                    i++;
                }
            }

            function objToArr(obj) {
                var prop,
                    result = [];

                _.forOwn(obj, function(value, key) {
                    result.push({key: key, value: value});
                });

                return result;
            }

            function arrToObj(context) {
                var result = {},
                    i = context.length;
                while(i--) {
                    result[context[i].key] = context[i].value;
                }
                return result;
            }

            function getPrefixes(context) {
                var inverted = _.invert(context);
                return {
                    owl: inverted[prefixes.owl] ? inverted[prefixes.owl] + ':' : prefixes.owl,
                    rdfs: inverted[prefixes.rdfs] ? inverted[prefixes.rdfs] + ':' : prefixes.rdfs,
                    xsd: inverted[prefixes.xsd] ? inverted[prefixes.xsd] + ':' : prefixes.xsd
                };
            }

            function fullRestructureOntology(ontology, ontologyId) {
                var context = ontology['@context'] || {};
                ontology = ontology['@graph'] || ontology;

                return fullRestructure(ontology, ontologyId, context, getPrefixes(context));
            }

            function restructureOntology(ontology) {
                var context = ontology['@context'] || {};
                ontology = ontology['@graph'] || ontology;
                return restructure(ontology, context, getPrefixes(context));
            }

            function addOntology(ontology, ontologyId) {
                var deferred = $q.defer();

                fullRestructureOntology(ontology, ontologyId)
                    .then(function(response) {
                        ontologies.push(response);
                        deferred.resolve(response);
                    }, function(response) {
                        // TODO: handle error scenario
                        deferred.reject('something went wrong');
                    });
                return deferred.promise;
            }

            function addOntologyIriToElements(arr, ontologyIri) {
                return _.forEach(arr, function(element) {
                    return element.ontologyIri = ontologyIri;
                });
            }

            function isProperty(types) {
                return _.indexOf(types, prefixes.owl + 'ObjectProperty') !== -1 || _.indexOf(types, prefixes.owl + 'DatatypeProperty') !== -1 || _.indexOf(types, prefixes.owl + 'DataTypeProperty') !== -1;
            }

            function updateProperty(modelId, modelGraph, oldEntity, classObj, ontology) {
                if(oldEntity) {
                    var index = _.indexOf(classObj.matonto.properties, oldEntity);
                    modelGraph.matonto = oldEntity.matonto;

                    if(!_.get(modelGraph, prefixes.rdfs + 'domain')) {
                        ontology.matonto.noDomains.push(modelGraph);
                    }
                } else {
                    _.forEach(ontology.matonto.classes, function(obj) {
                        oldEntity = _.find(obj.matonto.properties, {'@id': modelId});

                        if(oldEntity) {
                            var index = _.indexOf(obj.matonto.properties, oldEntity);

                            modelGraph.matonto = oldEntity.matonto;
                            obj.matonto.properties[index] = modelGraph;

                            return false;
                        }
                    });
                }
            }

            function updateClass(modelId, modelGraph, oldEntity, ontology) {
                var oldEntity = _.find(ontology.matonto.classes, {'@id': modelId});
                var index = _.indexOf(ontology.matonto.classes, oldEntity);

                modelGraph.matonto = ontology.matonto.classes[index].matonto;
                ontology.matonto.classes[index] = modelGraph;
            }

            function updateModels(response, ontology, classObj) {
                if(_.get(response, 'data.models', []).length) {
                    _.forEach(response.data.models, function(model) {
                        var modelGraph = _.get(model, "[0]['@graph'][0]", {});
                        var modelId = _.get(modelGraph, '@id', '');
                        var modelTypes = _.get(modelGraph, '@type', []);

                        if(isProperty(modelTypes)) {
                            var oldEntity = classObj ? _.find(classObj.matonto.properties, {'@id': modelId}) : _.find(ontology.matonto.noDomains, {'@id': modelId});
                            updateProperty(modelId, modelGraph, oldEntity, classObj, ontology);
                        } else if(_.indexOf(modelTypes, prefixes.owl + 'Class') !== -1) {
                            var oldEntity = _.find(ontology.matonto.classes, {'@id': modelId});
                            updateClass(modelId, modelGraph, oldEntity, ontology);
                        }
                    });
                }
            }

            function removeIdFromArray(id, arr) {
                var splitId = $filter('splitIRI')(id);
                var index = _.findIndex(arr, {namespace: splitId.begin + splitId.then, localName: splitId.end});
                arr.splice(index, 1);
            }

            function deleteOntology(ontologyId, state) {
                $rootScope.showSpinner = true;

                var deferred = $q.defer();

                $http.delete(prefix + '/' + encodeURIComponent(ontologyId))
                    .then(function(response) {
                        if(response.data.deleted) {
                            console.log('Successfully deleted ontology');
                            ontologies.splice(state.oi, 1);
                            deferred.resolve({ selectOntology: false });
                        } else {
                            console.warn('Ontology not deleted');
                            deferred.reject(response);
                        }
                    }, function(response) {
                        console.error('Error in deleteOntology() function');
                        deferred.reject(response.data.error);
                    })
                    .then(function() {
                        $rootScope.showSpinner = false;
                    });

                return deferred.promise;
            }

            function deleteClass(ontologyId, classId, state) {
                $rootScope.showSpinner = true;

                var deferred = $q.defer();

                $http.delete(prefix + '/' + encodeURIComponent(ontologyId) + '/classes/' + encodeURIComponent(classId))
                    .then(function(response) {
                        if(response.data.deleted) {
                            var ontology = ontologies[state.oi];
                            var classObj = ontology.matonto.classes[state.ci];

                            console.log('Successfully deleted class');
                            updateModels(response, ontology, classObj);
                            ontology.matonto.classes.splice(state.ci, 1);
                            removeIdFromArray(classId, ontology.matonto.subClasses);

                            deferred.resolve({ selectOntology: true });
                        } else {
                            console.warn('Class not deleted');
                            deferred.reject(response);
                        }
                    }, function(response) {
                        console.error('Error in deleteClass() function');
                        deferred.reject(response);
                    })
                    .then(function() {
                        $rootScope.showSpinner = false;
                    });

                return deferred.promise;
            }

            function deleteProperty(ontologyId, propertyId, state) {
                $rootScope.showSpinner = true;

                var property,
                    ontology = ontologies[state.oi],
                    classObj = undefined,
                    deferred = $q.defer();

                if(state.ci === undefined) {
                    property = ontology.matonto.noDomains[state.pi];
                } else {
                    classObj = ontology.matonto.classes[state.ci];
                    property = classObj.matonto.properties[state.pi];
                }

                var type = getRestfulPropertyType(_.get(property, '@type', []));

                $http.delete(prefix + '/' + encodeURIComponent(ontologyId) + '/' + type + '/' + encodeURIComponent(propertyId))
                    .then(function(response) {
                        if(response.data.deleted) {
                            console.log('Successfully deleted property');
                            updateModels(response, ontology, null);

                            if(classObj) {
                                classObj.matonto.properties.splice(state.pi, 1);
                            } else {
                                ontology.matonto.noDomains.splice(state.pi, 1);
                            }

                            if(type === 'object-properties') {
                                removeIdFromArray(propertyId, ontology.matonto.subObjectProperties);
                            } else {
                                removeIdFromArray(propertyId, ontology.matonto.subDataProperties);
                            }

                            deferred.resolve({ selectOntology: true });
                        } else {
                            console.warn('Property not deleted');
                            deferred.reject(response);
                        }
                    }, function(response) {
                        console.error('Error in deleteClass() function');
                        deferred.reject(response);
                    })
                    .then(function() {
                        $rootScope.showSpinner = false;
                    });

                return deferred.promise;
            }

            function removeOntologyId(ontologyId) {
                ontologyIds.splice(_.indexOf(ontologyIds, ontologyId), 1);
            }

            function addOntologyId(ontologyId) {
                ontologyIds.push(ontologyId);
            }

            function createResult(prop, value) {
                var result = {};
                result[prop] = value;
                return result;
            }

            function getRestrictionObject(obj, detailedProp, detailedObj, blankNodeId) {
                var onId = _.get(obj[0], '@id', '');
                var readableText = $filter('splitIRI')(onId).end + ' ' + $filter('splitIRI')(detailedProp).end + ' ';
                if(_.has(detailedObj, '@id')) {
                    readableText += $filter('splitIRI')(detailedObj['@id']).end;
                } else if(_.has(detailedObj, '@value') && _.has(detailedObj, '@type')) {
                    readableText += detailedObj['@value'] + ' ' + $filter('splitIRI')(detailedObj['@type']).end;
                }
                return createResult(blankNodeId, readableText);
            }

            function getBlankNodeObject(obj, joiningWord, blankNode) {
                var id = _.get(blankNode, '@id');
                var list = _.get(obj, "[0]['@list']", []);
                if(list.length) {
                    var stoppingIndex = list.length - 1;
                    var readableText = '';
                    _.forEach(list, function(item, index) {
                        readableText += $filter('splitIRI')(_.get(item, '@id')).end;
                        if(index !== stoppingIndex) {
                            readableText += ' ' + joiningWord + ' ';
                        }
                    });
                    console.log('Properly handled\n', blankNode);
                    return createResult(id, readableText);
                } else {
                    console.warn('Improperly handled\n', blankNode);
                    return {};
                }
            }

            function restructure(flattened, context, prefixes) {
                var j, obj, types, domain, annotations,
                    ontology = {
                        matonto: {
                            noDomains: [],
                            owl: prefixes.owl,
                            rdfs: prefixes.rdfs,
                            annotations: [],
                            currentAnnotationSelect: null
                        }
                    },
                    classes = [],
                    properties = [],
                    others = [],
                    restrictions = [],
                    jsAnnotations = [],
                    jsDatatypes = [],
                    blankNodes = [],
                    list = flattened['@graph'] ? flattened['@graph'] : flattened,
                    i = 0;

                while (i < list.length) {
                    obj = list[i];
                    types = _.get(obj, '@type', []);

                    if(_.indexOf(types, prefixes.owl + 'Restriction') !== -1) {
                        restrictions.push(obj);
                    } else if(_.get(obj, '@id').includes('_:b')) {
                        blankNodes.push(obj);
                    } else if(_.indexOf(types, prefixes.owl + 'Ontology') !== -1) {
                        initOntology(ontology, obj);
                    } else if(_.indexOf(types, prefixes.owl + 'Class') !== -1) {
                        obj.matonto = {
                            properties: [],
                            originalId: obj['@id']
                        };
                        classes.push(obj);
                    } else if(_.indexOf(types, prefixes.owl + 'DatatypeProperty') !== -1 || _.indexOf(types, prefixes.owl + 'ObjectProperty') !== -1 || _.indexOf(types, prefixes.rdf + 'Property') !== -1) {
                        obj.matonto = {
                            icon: chooseIcon(obj, prefixes),
                            originalId: obj['@id']
                        };
                        properties.push(obj);
                    } else if(_.indexOf(types, prefixes.owl + 'AnnotationProperty') !== -1) {
                        jsAnnotations.push(obj);
                    } else if(_.indexOf(types, prefixes.rdfs + 'Datatype') !== -1) {
                        jsDatatypes.push(obj);
                    } else {
                        others.push(obj);
                    }
                    i++;
                }

                ontology.matonto.jsAnnotations = jsAnnotations;

                _.forEach(blankNodes, function(blankNode) {
                    if(_.has(blankNode, prefixes.owl + 'unionOf')) {
                        var unionOf = _.get(blankNode, prefixes.owl + 'unionOf');
                        _.assign(ontology.matonto.unionOfs, getBlankNodeObject(unionOf, 'or', blankNode));
                    } else if(_.has(blankNode, prefixes.owl + 'intersectionOf')) {
                        var intersectionOf = _.get(blankNode, prefixes.owl + 'intersectionOf');
                        _.assign(ontology.matonto.intersectionOfs, getBlankNodeObject(intersectionOf, 'or', blankNode));
                    } else {
                        console.warn('Improperly handled\n', blankNode);
                    }
                });

                i = 0;
                while(i < restrictions.length) {
                    var restriction = restrictions[i];
                    var id = _.get(restriction, '@id');

                    var props = Object.keys(restriction);
                    _.pull(props, prefixes.owl + 'onProperty', prefixes.owl + 'onClass', '@id', '@type');
                    var detailedProp = (props.length === 1) ? props[0] : undefined;
                    var onPropertyObj = _.get(restriction, prefixes.owl + 'onProperty');
                    var onClassObj = _.get(restriction, prefixes.owl + 'onClass');

                    if(detailedProp && _.isArray(restriction[detailedProp]) && restriction[detailedProp].length === 1) {
                        var detailedObj = restriction[detailedProp][0];
                        if(onPropertyObj && _.isArray(onPropertyObj) && onPropertyObj.length === 1) {
                            _.assign(ontology.matonto.propertyExpressions, getRestrictionObject(onPropertyObj, detailedProp, detailedObj, id));
                        }
                        if(onClassObj && _.isArray(onClassObj) && onClassObj.length === 1) {
                            _.assign(ontology.matonto.classExpressions, getRestrictionObject(onPropertyObj, detailedProp, detailedObj, id));
                        }
                        console.log('Properly handled\n', restriction);
                    } else {
                        console.warn('Improperly handled\n', restriction);
                    }
                    ontology.matonto.blankNodes.push(restriction);
                    i++;
                }

                i = 0;
                while(i < properties.length) {
                    domain = properties[i][prefixes.rdfs + 'domain'];

                    if(domain) {
                        if(_.isArray(domain)) {
                            j = domain.length;
                            var item;
                            while(j--) {
                                item = domain[j]['@id'];
                                if(item.includes('_:b')) {
                                    ontology.matonto.noDomains.push(properties[i]);
                                } else {
                                    addToClass(domain[j]['@id'], properties[i], classes);
                                }
                            }
                        } else if(!domain['@id'].includes('_:b')) {
                            addToClass(domain['@id'], properties[i], classes);
                        } else {
                            ontology.matonto.noDomains.push(properties[i]);
                        }
                    } else {
                        ontology.matonto.noDomains.push(properties[i]);
                    }
                    i++;
                }

                ontology.matonto.classes = classes;
                ontology.matonto.context = objToArr(context);
                ontology.matonto.others = others;

                return ontology;
            }

            function fullRestructure(flattened, ontologyId, context, prefixes) {
                var deferred = $q.defer(),
                    ontology = restructure(flattened, context, prefixes);

                $q.all([
                        $http.get(prefix + '/' + encodeURIComponent(ontologyId) + '/iris'),
                        $http.get(prefix + '/' + encodeURIComponent(ontologyId) + '/imported-iris')
                    ]).then(function(response) {
                        var ontologyIris = response[0],
                            importedOntologyIris = response[1],
                            annotations = ontologyIris.data.annotationProperties,
                            classes = ontologyIris.data.classes,
                            dataProperties = ontologyIris.data.dataProperties,
                            objectProperties = ontologyIris.data.objectProperties,
                            datatypes = ontologyIris.data.datatypes;

                        if(importedOntologyIris.status === 200) {
                            var importedClasses = importedDataProperties = importedObjectProperties = [];

                            _.forEach(importedOntologyIris.data, function(item) {
                                importedClasses = _.concat(importedClasses, addOntologyIriToElements(item.classes, item.id));
                                importedDataProperties = _.concat(importedDataProperties, addOntologyIriToElements(item.dataProperties, item.id));
                                importedObjectProperties = _.concat(importedObjectProperties, addOntologyIriToElements(item.objectProperties, item.id));
                            });

                            classes = _.concat(classes, importedClasses);
                            dataProperties = _.concat(dataProperties, importedDataProperties);
                            objectProperties = _.concat(objectProperties, importedObjectProperties);
                        }

                        ontology.matonto.annotations = _.unionWith(annotations, defaultAnnotations, _.isMatch);
                        ontology.matonto.subClasses = classes;
                        ontology.matonto.subDataProperties = dataProperties;
                        ontology.matonto.subObjectProperties = objectProperties;
                        ontology.matonto.dataPropertyRange = _.unionWith(datatypes, defaultDatatypes, _.isMatch);

                        deferred.resolve(ontology);
                    }, function(response) {
                        deferred.reject(response);
                    });

                return deferred.promise;
            }

            function createEntityJson(entity) {
                var copy = angular.copy(entity);
                var context = _.get(copy.matonto, 'context', []);

                delete copy.matonto;

                if(context.length) {
                    return {
                        '@context': arrToObj(context),
                        '@graph': [copy]
                    }
                } else {
                    return copy;
                }
            }

            function getRestfulPropertyType(types) {
                if(self.isObjectProperty(types)) {
                    return 'object-properties';
                } else {
                    return 'data-properties';
                }
            }

            function initEntity(entity, iri, label, description) {
                var copy = angular.copy(entity);

                copy['@id'] = iri;
                copy.matonto.originalId = iri;
                copy[prefixes.dc + 'title'] = [{'@value': label}];
                copy[prefixes.rdfs + 'label'] = [{'@value': label}];

                if(description) {
                    copy[prefixes.dc + 'description'] = [{'@value': description}];
                    copy[prefixes.rdfs + 'comment'] = [{'@value': description}];
                }

                return copy;
            }

            self.createOntology = function(ontologyIri, label, description) {
                $rootScope.showSpinner = true;

                var deferred = $q.defer();
                var newOntology = angular.copy(ontologyTemplate);

                newOntology = initEntity(newOntology, ontologyIri, label, description);

                var config = {
                        params: {
                            ontologyjson: createEntityJson(newOntology)
                        }
                    };

                $http.post(prefix, null, config)
                    .then(function(response) {
                        if(response.data.persisted) {
                            console.log('Successfully created ontology');
                            ontologies.push(newOntology);
                            deferred.resolve(response);
                        } else {
                            console.warn('Ontology not created');
                            deferred.reject(response.statusText);
                        }
                    }, function(response) {
                        console.error('Error in createOntology() function');
                        deferred.reject(response.statusText);
                    })
                    .then(function() {
                        $rootScope.showSpinner = false;
                    });

                return deferred.promise;
            }

            self.createClass = function(ontology, classIri, label, description) {
                $rootScope.showSpinner = true;

                var deferred = $q.defer();
                var newClass = angular.copy(classTemplate);

                newClass = initEntity(newClass, classIri, label, description);

                var config = {
                        params: {
                            resourcejson: createEntityJson(newClass)
                        }
                    }

                $http.post(prefix + '/' + encodeURIComponent(ontology['@id']) + '/classes', null, config)
                    .then(function(response) {
                        if(response.data.added) {
                            console.log('Successfully added class');
                            ontology.matonto.classes.push(newClass);
                            var split = $filter('splitIRI')(newClass['@id']);
                            ontology.matonto.subClasses.push({namespace: split.begin + split.then, localName: split.end});
                            deferred.resolve(response);
                        } else {
                            console.warn('Class not added');
                            deferred.reject(response);
                        }
                    }, function(response) {
                        console.error('Error in createClass() function');
                        deferred.reject(response);
                    })
                    .then(function() {
                        $rootScope.showSpinner = false;
                    });

                return deferred.promise;
            }

            self.createProperty = function(ontology, propertyIri, label, types, ranges, domains, description) {
                $rootScope.showSpinner = true;

                var deferred = $q.defer();
                var pathVariable = getRestfulPropertyType(types);
                var newProperty = angular.copy(propertyTemplate);

                newProperty = initEntity(newProperty, propertyIri, label, description);
                newProperty['@type'] = types;

                if(domains.length) {
                    newProperty[prefixes.rdfs + 'domain'] = domains;
                }

                if(ranges.length) {
                    newProperty[prefixes.rdfs + 'range'] = ranges;
                    newProperty.matonto.icon = chooseIcon(newProperty);
                }

                var config = {
                        params: {
                            resourcejson: createEntityJson(newProperty)
                        }
                    }

                $http.post(prefix + '/' + encodeURIComponent(ontology['@id']) + '/' + pathVariable, null, config)
                    .then(function(response) {
                        if(response.data.added) {
                            console.log('Successfully added property');
                            var classIndex = -1;
                            if(domains.length) {
                                _.forEach(domains, function(domain) {
                                    classIndex = _.findIndex(self.getClasses(ontology), domain);
                                    ontology.matonto.classes[classIndex].matonto.properties.push(newProperty);
                                });
                            } else {
                                ontology.matonto.noDomains.push(newProperty);
                            }

                            var split = $filter('splitIRI')(newProperty['@id']);
                            var subObject = {namespace: split.begin + split.then, localName: split.end};

                            if(pathVariable === 'object-properties') {
                                ontology.matonto.subObjectProperties.push(subObject);
                            } else {
                                ontology.matonto.subDataProperties.push(subObject);
                            }

                            deferred.resolve(classIndex !== -1 ? classIndex : undefined);
                        } else {
                            console.warn('Property not added');
                            deferred.reject(response);
                        }
                    }, function(response) {
                        console.error('Error in createProperty() function');
                        deferred.reject(response);
                    })
                    .then(function() {
                        $rootScope.showSpinner = false;
                    });

                return deferred.promise;
            }

            self.getOntologyIds = function() {
                return ontologyIds;
            }

            self.getItemNamespace = function(item) {
                if(item.hasOwnProperty('namespace')) {
                    return item.namespace;
                }
                return 'No Namespace';
            }

            self.getList = function() {
                return ontologies;
            }

            self.getPropertyTypes = function() {
                return propertyTypes;
            }

            self.getObjectCopyByIri = function(iri, ontologyIndex) {
                var result = {};

                if(ontologyIndex !== undefined) {
                    var ontology = ontologies[ontologyIndex];
                    // Checks if iri is a class or a domain-less property
                    var obj = _.find(ontology.matonto.classes, {'@id': iri}, undefined) || _.find(ontology.matonto.noDomains, {'@id': iri}, undefined);
                    if(obj) {
                        result = angular.copy(obj);
                    } else {
                        // If not, we must check the properties of each class
                        _.forEach(ontology.matonto.classes, function(classObj) {
                            var property = _.find(classObj.matonto.properties, {'@id': iri}, undefined);
                            if(property) {
                                result = angular.copy(property);
                                return false;
                            }
                        });
                    }
                }

                return result;
            }

            self.getObject = function(state) {
                var oi = state.oi,
                    ci = state.ci,
                    pi = state.pi,
                    tab = state.tab,
                    result = {};

                if(pi !== undefined && ci !== undefined) {
                    result = ontologies[oi].matonto.classes[ci].matonto.properties[pi];
                } else if(pi !== undefined && ci === undefined) {
                    result = ontologies[oi].matonto.noDomains[pi];
                } else if(ci !== undefined) {
                    result = ontologies[oi].matonto.classes[ci];
                } else if(oi !== undefined) {
                    result = ontologies[oi];
                }

                return result;
            }

            self.delete = function(ontologyId, entityId, state) {
                if(state.pi !== undefined) {
                    return deleteProperty(ontologyId, entityId, state);
                } else if(state.ci !== undefined) {
                    return deleteClass(ontologyId, entityId, state);
                } else {
                    return deleteOntology(ontologyId, state);
                }
            }

            self.upload = function(file) {
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

            self.download = function(ontologyId, rdfFormat, fileName) {
                var deferred = $q.defer();
                var config = {
                        headers: {
                            Accept: 'application/octet-stream'
                        },
                        params: {
                            rdfformat: rdfFormat
                        }
                    };

                $http.get(prefix + '/' + encodeURIComponent(ontologyId), config)
                    .then(function(response) {
                        if(_.get(response, 'status') === 200) {
                            console.log('Successfully downloaded ontology');
                            var suffix = (rdfFormat === 'turtle') ? 'ttl' : 'xml';
                            var ontology = new Blob([_.get(response, 'data', '')], {type: 'text/plain'});
                            FileSaver.saveAs(ontology, fileName + '.' + suffix);
                            deferred.resolve(response);
                        } else {
                            console.warn('Something went wrong with the ontology download');
                            deferred.reject(response);
                        }
                    }, function(response) {
                        console.error('error in ontologyManager.download()');
                        deferred.reject(response);
                    });

                return deferred.promise;
            }

            self.get = function(ontologyId, rdfFormat) {
                var config = {
                        params: {
                            rdfformat: rdfFormat
                        }
                    };

                return $http.get(prefix + '/' + encodeURIComponent(ontologyId), config);
            }

            self.getThenRestructure = function(ontologyId) {
                $rootScope.showSpinner = true;
                var deferred = $q.defer();
                var onError = function(response) {
                    deferred.reject(response);
                    $rootScope.showSpinner = false;
                }

                var onGetSuccess = function(response) {
                    fullRestructureOntology(response.data.ontology, ontologyId).then(function(response) {
                        deferred.resolve(response);
                        $rootScope.showSpinner = false;
                    });
                }

                self.get(ontologyId, 'jsonld').then(function(response) {
                    if(_.has(response, 'data') && !_.has(response, 'error')) {
                        onGetSuccess(response);
                    } else {
                        onError();
                    }
                }, onError);

                return deferred.promise;
            }

            self.uploadThenGet = function(file) {
                $rootScope.showSpinner = true;

                var ontologyId, onUploadSuccess, onGetSuccess, onError,
                    deferred = $q.defer();

                onError = function(response) {
                    deferred.reject(response);
                    $rootScope.showSpinner = false;
                }

                onGetSuccess = function(response) {
                    addOntology(response.data.ontology, ontologyId)
                        .then(function(response) {
                            deferred.resolve(response);
                            $rootScope.showSpinner = false;
                        });
                }

                onUploadSuccess = function() {
                    self.get(ontologyId, 'jsonld')
                        .then(function(response) {
                            if(_.has(response, 'data') && !_.has(response, 'error')) {
                                onGetSuccess(response);
                            } else {
                                onError(response);
                            }
                        }, function(response) {
                            onError(response);
                        });
                }

                self.upload(file)
                    .then(function(response) {
                        if(_.get(response, 'data.persisted')) {
                            ontologyId = response.data.ontologyId;
                            onUploadSuccess();
                        } else {
                            onError(response);
                        }
                    }, function(response) {
                        onError(response);
                    });

                return deferred.promise;
            }

            self.edit = function(ontologyId, currentState) {
                var deferred = $q.defer();

                if(changedEntries.length) {
                    $rootScope.showSpinner = true;

                    var config, entityjson, obj, copy, ontology,
                        changedProperties = [],
                        promises = [];

                    _.forEach(_.filter(changedEntries, { ontologyId: ontologyId }), function(changedEntry) {
                        var state = angular.copy(changedEntry.state);
                        obj = self.getObject(state);
                        obj.matonto.unsaved = false;
                        copy = angular.copy(obj);

                        if(!ontology) {
                            ontology = ontologies[state.oi];
                        }

                        delete copy.matonto;

                        if(_.get(ontology.matonto, 'context', []).length) {
                            entityjson = {
                                '@context': arrToObj(ontology.matonto.context),
                                '@graph': [copy]
                            }
                        } else {
                            entityjson = copy;
                        }

                        config = {
                            params: {
                                resourceid: changedEntry.entityId,
                                resourcejson: entityjson
                            }
                        }

                        if(isProperty(_.get(obj, '@type', []))) {
                            changedProperties.push({ property: obj, state: state });
                        }

                        promises.push($http.post(prefix + '/' + encodeURIComponent(changedEntry.ontologyId), null, config));
                    });

                    $q.all(promises)
                        .then(function(response) {
                            if(!_.find(response.data, { updated: false })) {
                                self.clearChangedList(ontologyId);
                                _.forEach(changedProperties, function(item) {
                                    var domains = _.get(item.property, prefixes.rdfs + 'domain', []);
                                    var classId = _.get(ontology, 'matonto.classes[' + item.state.ci + "]['@id']");
                                    var domainHasClass = _.findIndex(domains, {'@id': classId}) !== -1;
                                    var inNoDomains = _.findIndex(ontology.matonto.noDomains, {'@id': item.property['@id']}) !== -1;

                                    item.property.matonto.icon = chooseIcon(item.property);

                                    // property has no domains, but used to
                                    if(domains.length === 0 && classId) {
                                        ontology.matonto.classes[item.state.ci].matonto.properties.splice(item.state.pi, 1);
                                        if(!inNoDomains) {
                                            ontology.matonto.noDomains.push(item.property);
                                            // if property is currently selected
                                            if(currentState.pi === item.state.pi) {
                                                currentState.ci = undefined;
                                                currentState.pi = ontology.matonto.noDomains.length - 1;
                                            }
                                        }
                                    }
                                    // property has domains, but not this class anymore
                                    else if(domains.length > 0 && !domainHasClass) {
                                        if(inNoDomains) {
                                            ontology.matonto.noDomains.splice(item.state.pi, 1);
                                        } else {
                                            ontology.matonto.classes[item.state.ci].matonto.properties.splice(item.state.pi, 1);
                                        }
                                    }
                                    // checks all domains and makes sure the classes have them listed
                                    _.forEach(domains, function(classItem) {
                                        var classId = classItem['@id'];
                                        if(!classId.includes('_:b')) {
                                            var newClassIndex = _.findIndex(ontology.matonto.classes, {'@id': classId});

                                            if(newClassIndex !== -1) {
                                                var hasProperty = _.findIndex(ontology.matonto.classes[newClassIndex].matonto.properties, {'@id':item.property['@id']}) !== -1;
                                                if(!hasProperty) {
                                                    var classObj = ontology.matonto.classes[newClassIndex];
                                                    classObj.matonto.properties.push(item.property);
                                                    // if property is currently selected
                                                    if(currentState.pi === item.state.pi) {
                                                        currentState.ci = newClassIndex;
                                                        currentState.pi = classObj.matonto.properties.length - 1;
                                                    }
                                                }
                                            }
                                        }
                                    });
                                    // removes all property references from classes that are no longer domains
                                    _.forEach(ontology.matonto.classes, function(classObj, index) {
                                        var domainHasClass = _.findIndex(domains, {'@id': classObj['@id']}) !== -1;
                                        var propertyIndex = _.findIndex(classObj.matonto.properties, {'@id': item.property['@id']});
                                        if(!domainHasClass && propertyIndex !== -1) {
                                            ontology.matonto.classes[index].matonto.properties.splice(propertyIndex, 1);
                                        }
                                    });
                                });
                                ontology.matonto.originalId = angular.copy(ontology['@id']);
                                console.log('Ontology successfully updated');
                                deferred.resolve(currentState);
                            } else {
                                console.warn("Something wasn't updated properly in the ontology");
                                deferred.reject();
                            }
                        }, function(response) {
                            console.error('Error during edit');
                            deferred.reject();
                        })
                        .then(function() {
                            $rootScope.showSpinner = false;
                        });
                } else {
                    deferred.reject('Nothing has been changed.');
                }

                return deferred.promise;
            }

            self.getImportedOntologies = function(ontologyId) {
                $rootScope.showSpinner = true;
                var deferred = $q.defer();
                var config = {
                        params: {
                            rdfformat: 'jsonld'
                        }
                    };
                var onError = function(response) {
                    deferred.reject(response);
                    $rootScope.showSpinner = false;
                }
                var onGetSuccess = function(response) {
                    var restructured = _.map(response, function(ontology) {
                        var restructuredOntology = _.find(ontologies, {'@id': ontology.id});
                        return restructuredOntology ? restructuredOntology : restructureOntology(ontology.ontology);
                    });
                    deferred.resolve(restructured);
                    $rootScope.showSpinner = false;
                }

                $http.get(prefix + '/' + encodeURIComponent(ontologyId) + '/imported-ontologies', config).then(function(response) {
                    if(_.get(response, 'status') === 200 && _.has(response, 'data')) {
                        onGetSuccess(response.data);
                    } else if (_.get(response, 'status') === 204) {
                        console.log('No imported ontologies found');
                        deferred.resolve([]);
                        $rootScope.showSpinner = false;
                    } else {
                        onError(response);
                    }
                }, onError);

                return deferred.promise;
            }

            self.getClassIris = function(ontologyId) {
                var deferred = $q.defer();
                var onError = function(response) {
                    deferred.reject(response);
                    $rootScope.showSpinner = false;
                }
                $http.get(prefix + '/' + encodeURIComponent(ontologyId) + '/classes').then(function(response) {
                    deferred.resolve(_.get(response, 'data.classes', []));
                }, onError);
                return deferred.promise;
            }

            self.getPropertyIris = function(ontologyId) {
                var deferred = $q.defer();
                var onError = function(response) {
                    deferred.reject(response);
                    $rootScope.showSpinner = false;
                }

                $q.all([
                    $http.get(prefix + '/' + encodeURIComponent(ontologyId) + '/object-properties'),
                    $http.get(prefix + '/' + encodeURIComponent(ontologyId) + '/data-properties')
                ]).then(function(responses) {
                    deferred.resolve(_.concat(_.get(responses[0], 'data.objectProperties', []), _.get(responses[1], 'data.dataProperties', [])));
                }, onError);
                return deferred.promise;
            }

            self.editIRI = function(begin, then, end, selected, ontology) {
                var fresh = begin + then + end;
                updateRefsService.update(ontology, selected['@id'], fresh);
                selected['@id'] = fresh;
            }

            self.isObjectProperty = function(types) {
                return _.indexOf(types, prefixes.owl + 'ObjectProperty') !== -1;
            }

            self.getOntology = function(oi) {
                var state = {
                    oi: oi,
                    ci: undefined,
                    pi: undefined,
                    tab: undefined
                }
                return self.getObject(state);
            }

            self.getOntologyProperty = function(ontology, prop) {
                if(ontology && ontology.hasOwnProperty('matonto') && ontology.matonto.hasOwnProperty(prop)) {
                    return ontology.matonto[prop];
                }
                return undefined;
            }

            self.addToChangedList = function(ontologyId, entityId, state) {
                var changedEntry = {
                    ontologyId: angular.copy(ontologyId),
                    entityId: angular.copy(entityId),
                    state: angular.copy(state)
                }
                if(entityId && !_.find(changedEntries, changedEntry)) {
                    changedEntries.push(changedEntry);
                }
            }

            self.clearChangedList = function(ontologyId) {
                changedEntries = _.reject(changedEntries, { ontologyId: ontologyId });
            }

            self.getClasses = function(ontology) {
                return _.get(ontology, 'matonto.classes', []);
            }

            self.getClass = function(ontology, classId) {
                return _.find(self.getClasses(ontology), {'@id': classId});
            }

            self.getClassProperties = function(ontology, classId) {
                return _.get(self.getClass(ontology, classId), 'matonto.properties', []);
            }

            self.getClassProperty = function(ontology, classId, propId) {
                return _.find(self.getClassProperties(ontology, classId), {'@id': propId});
            }

            self.findOntologyWithClass = function(ontologyList, classId) {
                return _.find(ontologyList, function(ontology) {
                    return _.findIndex(self.getClasses(ontology), {'@id': classId}) >= 0;
                });
            }

            self.getBeautifulIRI = function(iri) {
                var splitEnd = $filter('splitIRI')(iri).end;
                return splitEnd ? $filter('beautify')(splitEnd) : iri;
            }

            self.getEntityName = function(entity) {
                var result = _.get(entity, "['" + prefixes.rdfs + "label'][0]['@value']") || _.get(entity, "['" + prefixes.dc + "title'][0]['@value']");
                if (!result) {
                    result = self.getBeautifulIRI(_.get(entity, '@id', ''));
                }
                return result;
            }

            self.getPreview = function(ontologyId, rdfFormat) {
                $rootScope.showSpinner = true;

                var deferred = $q.defer();

                self.get(ontologyId, rdfFormat)
                    .then(function(response) {
                        var ontology = _.get(response.data, 'ontology');
                        if(ontology) {
                            console.log('Preview has been successfully retrieved');
                            deferred.resolve((rdfFormat === 'jsonld') ? $filter('json')(ontology) : ontology);
                        } else {
                            console.warn('getPreview did not return anything in the response.data.ontology');
                            deferred.reject('No data was returned. This typically happens whenever you try to preview a new, unsaved ontology. Please try again after you save the ontology.');
                        }
                    }, function(response) {
                        console.error('Error in getPreview()');
                        deferred.reject('An error has occurred, please try again later');
                    })
                    .then(function() {
                        $rootScope.showSpinner = false;
                    });

                return deferred.promise;
            }

            self.closeOntology = function(oi, ontologyId) {
                ontologies.splice(oi, 1);
                addOntologyId(ontologyId);
            }

            self.openOntology = function(ontologyId) {
                $rootScope.showSpinner = true;

                var deferred = $q.defer();

                self.get(ontologyId, 'jsonld')
                    .then(function(response) {
                        var ontology = _.get(response.data, 'ontology');
                        if(ontology) {
                            console.log('Successfully opened ontology');
                            addOntology(ontology, ontologyId)
                                .then(function(response) {
                                    removeOntologyId(ontologyId);
                                    deferred.resolve({});
                                })
                                .then(function() {
                                    $rootScope.showSpinner = false;
                                });
                        } else {
                            console.warn('Ontology was not found or opened for some reason');
                            deferred.reject(response.statusText);
                        $rootScope.showSpinner = false;
                        }
                    }, function(response) {
                        console.error('We were unable to retrieve the ontology to open it.')
                        deferred.reject(response.statusText);
                        $rootScope.showSpinner = false;
                    });

                return deferred.promise;
            }
        }
})();

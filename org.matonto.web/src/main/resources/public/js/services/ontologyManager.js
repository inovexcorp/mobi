(function() {
    'use strict';

    angular
        .module('ontologyManager', ['splitIRI', 'beautify', 'updateRefs', 'camelCase', 'responseObj', 'prefixes'])
        .service('ontologyManagerService', ontologyManagerService);

        ontologyManagerService.$inject = ['$rootScope', '$http', '$q', '$timeout', '$filter', 'FileSaver', 'Blob', 'updateRefsService', 'responseObj', 'prefixes', 'uuid'];

        function ontologyManagerService($rootScope, $http, $q, $timeout, $filter, FileSaver, Blob, updateRefsService, responseObj, prefixes, uuid) {
            var self = this,
                prefix = '/matontorest/ontologies',
                defaultAnnotations = [
                    {
                        'namespace': prefixes.rdfs,
                        'localName': 'seeAlso'
                    },
                    {
                        'namespace': prefixes.rdfs,
                        'localName': 'isDefinedBy'
                    },
                    {
                        'namespace': prefixes.owl,
                        'localName': 'deprecated'
                    },
                    {
                        'namespace': prefixes.owl,
                        'localName': 'versionInfo'
                    },
                    {
                        'namespace': prefixes.owl,
                        'localName': 'priorVersion'
                    },
                    {
                        'namespace': prefixes.owl,
                        'localName': 'backwardCompatibleWith'
                    },
                    {
                        'namespace': prefixes.owl,
                        'localName': 'incompatibleWith'
                    },
                    {
                        'namespace': prefixes.dc,
                        'localName': 'description'
                    },
                    {
                        'namespace': prefixes.dc,
                        'localName': 'title'
                    }
                ],
                changedEntries = [],
                newItems = {},
                ontologies = [],
                propertyTypes = [
                    prefixes.owl + 'DatatypeProperty',
                    prefixes.owl + 'ObjectProperty'
                ],
                ontologyIds = [];

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
                            // TODO: pick better icon for Literal? since it can be for Integers as well
                            case prefixes.xsd + 'string':
                            case prefixes.rdfs + 'Literal':
                                icon = 'fa-font';
                                break;
                            case prefixes.xsd + 'double':
                            case prefixes.xsd + 'nonNegativeInteger':
                                icon = 'fa-calculator';
                                break;
                            default:
                                icon = 'fa-link';
                                break;
                        }
                    }
                    // TODO: icon for multiple ranges
                    else {
                        icon = 'fa-cubes';
                    }
                }
                // TODO: figure out what to do if there isn't a range
                else {
                    icon = 'fa-question';
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

            function addDefaultAnnotations(annotations) {
                var itemIri, index, split,
                    i = 1,
                    exclude = [
                        'http://www.w3.org/2000/01/rdf-schema#label',
                        'http://www.w3.org/2000/01/rdf-schema#comment'
                    ],
                    defaults = responseObj.stringify(defaultAnnotations),
                    arr = angular.copy(annotations);

                arr.splice(0, 0, { namespace: 'Create ', localName: 'New Annotation' });

                while(i < arr.length) {
                    itemIri = responseObj.getItemIri(arr[i]);
                    if(exclude.indexOf(itemIri) !== -1) {
                        arr.splice(i--, 1);
                    }
                    index = defaults.indexOf(itemIri);
                    if(index !== -1) {
                        defaults.splice(index, 1);
                    }
                    i++;
                }

                i = 0;
                while(i < defaults.length) {
                    split = $filter('splitIRI')(defaults[i]);
                    arr.push({ namespace: split.begin + split.then, localName: split.end });
                    i++;
                }

                return arr;
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

            function setId(obj, type, rdfs) {
                var copy = angular.copy(obj);

                if(copy.matonto.hasOwnProperty('namespace')) {
                    var localName = '';
                    var label = _.get(copy, rdfs + 'label', '');
                    if(label) {
                        localName = $filter('camelCase')(label[0]['@value'], type);
                    } else {
                        localName = type + '_' + uuid.v4();
                    }
                    copy['@id'] = copy.matonto.namespace + localName;
                    delete copy.matonto.namespace;
                }
                copy.matonto.originalId = copy['@id'];

                return copy;
            }

            function restructureLabelAndComment(obj) {
                var copy = angular.copy(obj);
                var comment = _.get(obj, prefixes.rdfs + 'comment', null);
                var label = _.get(obj, prefixes.rdfs + 'label', null);

                if(comment && !_.isArray(comment)) {
                    copy[prefixes.rdfs + 'comment'] = [comment[0]];
                }
                if(label && !_.isArray(label)) {
                    copy[prefixes.rdfs + 'label'] = [label[0]];
                }

                return copy;
            }

            function createEntityJson(ontologyMatonto, entity) {
                var copy = angular.copy(entity);

                delete copy.matonto;

                if(_.get(ontologyMatonto, 'context', []).length) {
                    return {
                        '@context': arrToObj(ontologyMatonto.context),
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

            function createOntology(ontology) {
                var deferred = $q.defer();
                ontology.matonto.originalId = ontology['@id'];
                ontology = restructureLabelAndComment(ontology);

                var copy = angular.copy(ontology);
                delete copy.matonto;

                var config = {
                        params: {
                            ontologyjson: createEntityJson(ontology.matonto, copy)
                        }
                    };

                $http.post(prefix, null, config)
                    .then(function(response) {
                        if(response.data.persisted) {
                            console.log('Successfully created ontology');
                            ontology.matonto.isValid = true;
                            ontologies.push(ontology);
                            deferred.resolve(response);
                        } else {
                            console.warn('Ontology not created');
                            deferred.reject(response);
                        }
                    }, function(response) {
                        console.error('Error in createOntology() function');
                        deferred.reject(response);
                    })
                    .then(function() {
                        $rootScope.showSpinner = false;
                    });

                return deferred.promise;
            }

            function createClass(ontology, classObj) {
                var deferred = $q.defer();

                classObj = restructureLabelAndComment(classObj);

                var config = {
                        params: {
                            resourcejson: createEntityJson(ontology.matonto, classObj)
                        }
                    }

                $http.post(prefix + '/' + encodeURIComponent(ontology['@id']) + '/classes', null, config)
                    .then(function(response) {
                        if(response.data.added) {
                            console.log('Successfully added class');
                            ontology.matonto.classes.push(classObj);
                            var classIRI = $filter('splitIRI')(classObj['@id']);
                            ontology.matonto.subClasses.push({namespace: classIRI.begin + classIRI.then, localName: classIRI.end});
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

            function createProperty(ontology, classObj, property) {
                var deferred = $q.defer();
                var types = _.get(property, '@type', []);
                var pathVariable = getRestfulPropertyType(types);

                if(!types.length) {
                    property['@type'].push(prefixes.owl + 'DatatypeProperty')
                }
                property = restructureLabelAndComment(property);

                var config = {
                        params: {
                            resourcejson: createEntityJson(ontology.matonto, property)
                        }
                    }

                $http.post(prefix + '/' + encodeURIComponent(ontology['@id']) + '/' + pathVariable, null, config)
                    .then(function(response) {
                        if(response.data.added) {
                            console.log('Successfully added property');
                            classObj.matonto.properties.push(property);
                            var propertyIRI = $filter('splitIRI')(property['@id']);
                            var subObject = {namespace: propertyIRI.begin + propertyIRI.then, localName: propertyIRI.end};
                            if(self.isObjectProperty(property['@type'])) {
                                ontology.matonto.subObjectProperties.push(subObject);
                            } else {
                                ontology.matonto.subDataProperties.push(subObject);
                            }
                            deferred.resolve(response);
                        } else {
                            console.warn('Property not added');
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

            function deleteOntology(ontologyId, state) {
                $rootScope.showSpinner = true;

                var deferred = $q.defer();

                $http.delete(prefix + '/' + encodeURIComponent(ontologyId))
                    .then(function(response) {
                        if(response.data.deleted) {
                            console.log('Successfully deleted ontology');
                            ontologies.splice(state.oi, 1);
                            deferred.resolve(response);
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
                            ontologies[state.oi].matonto.classes.splice(state.ci, 1);
                            deferred.resolve(response);
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

                            deferred.resolve(response);
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
                            originalId: obj['@id'],
                            currentAnnotationSelect: null
                        };
                        classes.push(obj);
                    } else if(_.indexOf(types, prefixes.owl + 'DatatypeProperty') !== -1 || _.indexOf(types, prefixes.owl + 'ObjectProperty') !== -1 || _.indexOf(types, prefixes.rdf + 'Property') !== -1) {
                        obj.matonto = {
                            icon: chooseIcon(obj, prefixes),
                            originalId: obj['@id'],
                            currentAnnotationSelect: null
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
                            var data = importedOntologyIris.data,
                                importedClasses = [],
                                importedDataProperties = [],
                                importedObjectProperties = [],
                                i = 0;

                            while(i < data.length) {
                                importedClasses = importedClasses.concat(addOntologyIriToElements(data[i].classes, data[i].id));
                                importedDataProperties = importedDataProperties.concat(addOntologyIriToElements(data[i].dataProperties, data[i].id));
                                importedObjectProperties = importedObjectProperties.concat(addOntologyIriToElements(data[i].objectProperties, data[i].id));
                                i++;
                            }

                            classes = $filter('orderBy')(classes.concat(importedClasses), 'localName');
                            dataProperties = $filter('orderBy')(dataProperties.concat(importedDataProperties), 'localName');
                            objectProperties = $filter('orderBy')(objectProperties.concat(importedObjectProperties), 'localName');
                        } else {
                            classes = $filter('orderBy')(classes, 'localName');
                            dataProperties = $filter('orderBy')(dataProperties, 'localName');
                            objectProperties = $filter('orderBy')(objectProperties, 'localName');
                        }

                        ontology.matonto.annotations = addDefaultAnnotations(annotations);
                        ontology.matonto.subClasses = classes;
                        ontology.matonto.subDataProperties = dataProperties;
                        ontology.matonto.subObjectProperties = objectProperties;

                        // For now, these just point to classes. They will eventually have some way to link back to class expressions
                        ontology.matonto.propertyDomain = classes;
                        ontology.matonto.dataPropertyRange = $filter('orderBy')(classes.concat(datatypes), 'localName');
                        ontology.matonto.objectPropertyRange = classes;

                        deferred.resolve(ontology);
                    }, function(response) {
                        deferred.reject(response);
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
                var current, newEntity, existingEntity, setDefaults,
                    oi = state.oi,
                    ci = state.ci,
                    pi = state.pi,
                    tab = state.tab,
                    result = {},
                    newOntology = {
                        '@id': '',
                        '@type': [prefixes.owl + 'Ontology'],
                        matonto: {
                            rdfs: prefixes.rdfs,
                            owl: prefixes.owl,
                            delimiter: '#',
                            classes: [],
                            annotations: defaultAnnotations,
                            currentAnnotationSelect: null,
                            isValid: false
                        }
                    },
                    newClass = {
                        '@id': '',
                        '@type': [prefixes.owl + 'Class'],
                        matonto: {
                            properties: [],
                            currentAnnotationSelect: null
                        }
                    },
                    newProperty = {
                        '@id': '',
                        '@type': [],
                        matonto: {
                            currentAnnotationSelect: null
                        }
                    };

                existingEntity = function() {
                    if(pi !== undefined && ci !== undefined) {
                        result = ontologies[oi].matonto.classes[ci].matonto.properties[pi];
                    } else if(pi !== undefined && ci === undefined) {
                        result = ontologies[oi].matonto.noDomains[pi];
                    } else if(ci !== undefined) {
                        result = ontologies[oi].matonto.classes[ci];
                    } else if(oi !== undefined) {
                        result = ontologies[oi];
                    }
                }

                setDefaults = function(ontology, obj) {
                    var result = angular.copy(obj);
                    result.matonto.namespace = ontology['@id'] + ontology.matonto.delimiter;
                    return result;
                }

                newEntity = function() {
                    var ontology = (oi !== -1) ? ontologies[oi] : null,
                        unique = tab + oi + ci + pi;
                    if(newItems[unique]) {
                        result = newItems[unique];
                    } else {
                        if(pi === -1) {
                            result = setDefaults(ontology, angular.copy(newProperty));
                            if(_.has(ontologies, '[' + oi + '].matonto.classes[' + ci + "]['@id']")) {
                                result[prefixes.rdfs + 'domain'] = [{'@id': angular.copy(ontologies[oi].matonto.classes[ci]['@id'])}];
                            }
                        } else if(ci === -1) {
                            result = setDefaults(ontology, angular.copy(newClass));
                        } else {
                            result = angular.copy(newOntology);
                        }
                        newItems[unique] = result;
                    }
                }

                if(pi === -1 || ci === -1 || oi === -1) {
                    newEntity();
                } else {
                    existingEntity();
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

            self.download = function(ontologyId, rdfFormat) {
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
                            var ontology = new Blob([_.get(response, 'data', '')], {type: 'text/plain;charset=utf-8'});
                            FileSaver.saveAs(ontology, ontologyId + '.' + suffix);
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

                        copy = restructureLabelAndComment(copy);

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
                                    var domains = _.get(item.property, prefixes.owl + 'domain', []);
                                    var classId = _.get(ontology, 'matonto.classes[' + item.state.ci + "]['@id']");
                                    var domainHasClass = _.indexOf(domains, classId) !== -1;

                                    if((domains.length === 0 && classId) || (!domainHasClass && domains.length > 0)) {
                                        ontology.matonto.classes[item.state.ci].matonto.properties.splice(item.state.pi, 1);
                                    }
                                    if(domains.length === 0) {
                                        ontology.matonto.noDomains.push(item.property);
                                    } else {
                                        ontology.matonto.classes[item.state.ci].matonto.properties.push(item.property);
                                    }
                                });
                                console.log('Ontology successfully updated');
                                deferred.resolve();
                            } else {
                                console.warn('Something wasn\'t updated properly in the ontology');
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
                    } else {
                        onError(response);
                    }
                }, onError);

                return deferred.promise;
            }

            self.create = function(obj, state) {
                $rootScope.showSpinner = true;

                var ontology,
                    oi = state.oi,
                    ci = state.ci,
                    pi = state.pi,
                    tab = state.tab,
                    unique = tab + oi + ci + pi;
                obj.matonto.unsaved = false;

                delete newItems[unique];

                if(oi === -1) {
                    return createOntology(obj);
                } else {
                    ontology = ontologies[oi];
                    if(ci === -1) {
                        obj = setId(obj, 'class', ontology.matonto.rdfs);
                        return createClass(ontology, obj);
                    } else {
                        obj = setId(obj, 'property', ontology.matonto.rdfs);
                        obj.matonto.icon = chooseIcon(obj);
                        return createProperty(ontology, ontology.matonto.classes[ci], obj);
                    }
                }
            }

            self.editIRI = function(begin, then, end, selected, ontology) {
                var fresh = begin + then + end;

                if(selected.matonto.hasOwnProperty('namespace')) {
                    delete selected.matonto.namespace;
                } else {
                    updateRefsService.update(ontology, selected['@id'], fresh);
                }
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
                    return _.findIndex(self.getClasses(ontology), function(classObj) {
                        return classObj['@id'] === classId;
                    }) >= 0;
                });
            }

            self.getBeautifulIRI = function(iri) {
                var splitEnd = $filter('splitIRI')(iri).end;
                return splitEnd ? $filter('beautify')(splitEnd) : iri;
            }

            self.getEntityName = function(entity) {
                var result = _.get(entity, "['" + prefixes.rdfs + "label'][0]['@value']");
                if (!result) {
                    result = self.getBeautifulIRI(_.get(entity, '@id', ''));
                }
                return result;
            }

            self.getPreview = function(ontologyId, rdfFormat) {
                $rootScope.showSpinner = true;

                var deferred = $q.defer();
                var errorMessage = 'An error has occurred, please try again later';

                self.get(ontologyId, rdfFormat)
                    .then(function(response) {
                        var ontology = _.get(response.data, 'ontology');
                        if(ontology) {
                            console.log('Preview has been successfully retrieved');
                            deferred.resolve(ontology);
                        } else {
                            console.warn('getPreview did not return anything in the response.data.ontology');
                            deferred.reject(errorMessage);
                        }
                    }, function(response) {
                        console.error('Error in getPreview()');
                        deferred.reject(errorMessage);
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

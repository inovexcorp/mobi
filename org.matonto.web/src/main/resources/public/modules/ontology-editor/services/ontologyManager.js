(function() {
    'use strict';

    angular
        .module('ontologyManager', ['splitIRI', 'beautify', 'updateRefs', 'camelCase', 'responseObj'])
        .service('ontologyManagerService', ontologyManagerService);

        ontologyManagerService.$inject = ['$rootScope', '$http', '$q', '$timeout', '$filter', 'updateRefsService', 'responseObj'];

        function ontologyManagerService($rootScope, $http, $q, $timeout, $filter, updateRefsService, responseObj) {
            var self = this,
                prefix = '/matontorest/ontologies',
                defaultOwl = 'http://www.w3.org/2002/07/owl#',
                defaultRdfs = 'http://www.w3.org/2000/01/rdf-schema#',
                defaultXsd = 'http://www.w3.org/2001/XMLSchema#',
                defaultAnnotations = [
                    {
                        'namespace': 'http://www.w3.org/2000/01/rdf-schema#',
                        'localName': 'seeAlso'
                    },
                    {
                        'namespace': 'http://www.w3.org/2000/01/rdf-schema#',
                        'localName': 'isDefinedBy'
                    },
                    {
                        'namespace': 'http://www.w3.org/2002/07/owl#',
                        'localName': 'deprecated'
                    },
                    {
                        'namespace': 'http://www.w3.org/2002/07/owl#',
                        'localName': 'versionInfo'
                    },
                    {
                        'namespace': 'http://www.w3.org/2002/07/owl#',
                        'localName': 'priorVersion'
                    },
                    {
                        'namespace': 'http://www.w3.org/2002/07/owl#',
                        'localName': 'backwardCompatibleWith'
                    },
                    {
                        'namespace': 'http://www.w3.org/2002/07/owl#',
                        'localName': 'incompatibleWith'
                    },
                    {
                        'namespace': 'http://purl.org/dc/elements/1.1/',
                        'localName': 'description'
                    },
                    {
                        'namespace': 'http://purl.org/dc/elements/1.1/',
                        'localName': 'title'
                    }
                ],
                changedEntries = [],
                newItems = {},
                ontologies = [],
                propertyTypes = [
                    'http://www.w3.org/2002/07/owl#DatatypeProperty',
                    'http://www.w3.org/2002/07/owl#ObjectProperty'
                ];


            initialize();

            function initialize() {
                $rootScope.showSpinner = true;

                var promises = [];

                $http.get(prefix)
                    .then(function(response) {
                        var i = 0;

                        while(i < response.data.length) {
                            promises.push(addOntology(response.data[i].ontology, response.data[i].ontologyId));
                            i++;
                        }
                        $q.all(promises)
                            .then(function(response) {
                                console.log('Successfully loaded ontologies');
                            }, function(response) {
                                console.warn('Not able to load ontologies');
                            })
                            .then(function() {
                                $rootScope.showSpinner = false;
                            });
                    }, function(response) {
                        console.error('Error in initialize() function');
                        $rootScope.showSpinner = false;
                    });
            }

            function initOntology(ontology, obj) {
                var len = obj['@id'].length,
                    delimiter = obj['@id'].charAt(len - 1);

                obj.matonto = {
                    originalId: obj['@id']
                }

                if(delimiter === '#' || delimiter === ':' || delimiter === '/') {
                    obj.matonto.delimiter = delimiter;
                    obj['@id'] = obj['@id'].substring(0, len - 1);
                } else {
                    obj.matonto.delimiter = '#';
                }

                angular.merge(ontology, obj);
            }

            function chooseIcon(property, prefixes) {
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
                for(prop in obj) {
                    if(obj.hasOwnProperty(prop)) {
                        result.push({key: prop, value: obj[prop]});
                    }
                }
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

            function restructure(flattened, ontologyId, context, prefixes) {
                var j, obj, type, domain, annotations,
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
                    list = flattened['@graph'] ? flattened['@graph'] : flattened,
                    i = 0,
                    deferred = $q.defer();

                while(i < list.length) {
                    obj = list[i];
                    type = obj['@type'] ? obj['@type'][0] : undefined;

                    switch(type) {
                        case prefixes.owl + 'Ontology':
                            initOntology(ontology, obj);
                            break;
                        case prefixes.owl + 'Class':
                            obj.matonto = {
                                properties: [],
                                originalId: obj['@id'],
                                currentAnnotationSelect: null
                            };
                            classes.push(obj);
                            break;
                        case prefixes.owl + 'DatatypeProperty':
                        case prefixes.owl + 'ObjectProperty':
                        case prefixes.rdfs + 'Property':
                            obj.matonto = {
                                icon: chooseIcon(obj, prefixes),
                                originalId: obj['@id'],
                                currentAnnotationSelect: null
                            };
                            properties.push(obj);
                            break;
                        default:
                            others.push(obj);
                            break;
                    }
                    i++;
                }

                i = 0;
                while(i < properties.length) {
                    domain = properties[i][prefixes.rdfs + 'domain'];

                    if(domain) {
                        if(Object.prototype.toString.call(domain) === '[object Array]') {
                            j = domain.length;
                            while(j--) {
                                addToClass(domain[j]['@id'], properties[i], classes);
                            }
                        } else {
                            addToClass(domain['@id'], properties[i], classes);
                        }
                    } else {
                        ontology.matonto.noDomains.push(properties[i]);
                    }
                    i++;
                }

                ontology.matonto.classes = classes;
                ontology.matonto.context = objToArr(context);
                ontology.matonto.others = others;

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

            function addOntology(ontology, ontologyId) {
                var getPrefixes,
                    context = ontology['@context'] || {},
                    deferred = $q.defer();
                ontology = ontology['@graph'] || ontology;

                getPrefixes = function(context) {
                    var prop,
                        result = {
                            owl: defaultOwl,
                            rdfs: defaultRdfs,
                            xsd: defaultXsd
                        };

                    for(prop in context) {
                        if(context.hasOwnProperty(prop)) {
                            switch(context[prop]) {
                                case defaultOwl:
                                    result.owl = prop + ':';
                                    break;
                                case defaultRdfs:
                                    result.rdfs = prop + ':';
                                    break;
                                case defaultXsd:
                                    result.xsd = prop + ':';
                                    break;
                            }
                        }
                    }
                    return result;

                }

                restructure(ontology, ontologyId, context, getPrefixes(context))
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
                if(obj.matonto.hasOwnProperty('namespace')) {
                    obj['@id'] = obj.matonto.namespace + $filter('camelCase')(obj[rdfs + 'label'][0]['@value'], type);
                    delete obj.matonto.namespace;
                }
                obj.matonto.originalId = obj['@id'];
            }

            function restructureLabelAndComment(obj, rdfs) {
                var copy = angular.copy(obj);

                copy[rdfs + 'comment'] = [obj[rdfs + 'comment'][0]];
                copy[rdfs + 'label'] = [obj[rdfs + 'label'][0]];

                return copy;
            }

            function createOntology(ontology) {
                var ontologyjson,
                    copy = angular.copy(ontology),
                    deferred = $q.defer();

                ontology.matonto.originalId = ontology['@id'];
                ontology = restructureLabelAndComment(ontology, ontology.matonto.rdfs);
                ontologies.push(ontology);

                delete copy.matonto;

                if(ontology.matonto.hasOwnProperty('context') && ontology.matonto.context.length) {
                    ontologyjson = {
                        '@context': arrToObj(ontology.matonto.context),
                        '@graph': [copy]
                    }
                } else {
                    ontologyjson = copy;
                }

                var config = {
                        params: {
                            ontologyjson: ontologyjson
                        }
                    };

                $http.post(prefix, null, config)
                    .then(function(response) {
                        if(response.data.persisted) {
                            console.log('Successfully persisted');
                            deferred.resolve(response);
                        } else {
                            console.warn('Not persisted');
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

            function createClass(classObj) {
                var copy = angular.copy(classObj);


            }

            function createProperty(property) {
                var copy = angular.copy(property);


            }

            function deleteOntology(ontologyId, state) {
                $rootScope.showSpinner = true;

                var deferred = $q.defer();

                $http.delete(prefix + '/' + encodeURIComponent(ontologyId))
                    .then(function(response) {
                        if(response.data.deleted) {
                            console.log('Successfully deleted');
                            ontologies.splice(state.oi, 1);
                            deferred.resolve(response);
                        } else {
                            console.log('Not deleted');
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

                            console.log('Successfully deleted');

                            console.log(response.data.changedEntities);

                            ontology.matonto.classes.splice(state.ci, 1);
                            deferred.resolve(response);
                        } else {
                            console.log('Not deleted');
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

                var type, ontology, property,
                    classObj = undefined,
                    deferred = $q.defer();

                if(state.ci === undefined) {
                    ontology = ontologies[state.oi];
                    property = ontology.matonto.noDomains[state.pi];
                } else {
                    ontology = ontologies[state.oi];
                    classObj = ontology.matonto.classes[state.ci];
                    property = classObj.matonto.properties[state.pi];
                }

                if(self.isObjectProperty(property['@type'], ontology.matonto.owl)) {
                    type = 'object-properties';
                } else {
                    type = 'data-properties';
                }

                $http.delete(prefix + '/' + encodeURIComponent(ontologyId) + '/' + type + '/' + encodeURIComponent(propertyId))
                    .then(function(response) {
                        if(response.data.deleted) {
                            console.log('Successfully deleted');

                            console.log(response.data.changedEntities);

                            if(classObj) {
                                classObj.matonto.properties.splice(state.pi, 1);
                            } else {
                                ontology.matonto.noDomains.splice(state.pi, 1);
                            }
                            deferred.resolve(response);
                        } else {
                            console.log('Not deleted');
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

            self.getObject = function(state) {
                var current, editEntity, createEntity, setDefaults,
                    oi = state.oi,
                    ci = state.ci,
                    pi = state.pi,
                    tab = state.tab,
                    result = {},
                    newOntology = {
                        '@id': '',
                        '@type': ['owl:Ontology'],
                        'rdfs:label': [{'@value': ''}],
                        'rdfs:comment': [{'@value': ''}],
                        matonto: {
                            rdfs: 'rdfs:',
                            owl: 'owl:',
                            delimiter: '#',
                            classes: [],
                            annotations: defaultAnnotations,
                            currentAnnotationSelect: null,
                            context: [
                                { key: 'owl', value: defaultOwl },
                                { key: 'rdfs', value: defaultRdfs },
                                { key: 'xsd', value: defaultXsd }
                            ]
                        }
                    },
                    newClass = {
                        '@id': '',
                        matonto: {
                            properties: [],
                            currentAnnotationSelect: null
                        }
                    },
                    newProperty = {
                        '@id': '',
                        matonto: {
                            currentAnnotationSelect: null
                        }
                    };

                editEntity = function() {
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

                createEntity = function() {
                    var ontology = (oi !== -1) ? ontologies[oi] : null,
                        unique = tab + oi + ci + pi;
                    if(newItems[unique]) {
                        result = newItems[unique];
                    } else {
                        if(pi === -1) {
                            result = setDefaults(ontology, angular.copy(newProperty));
                        } else if(ci === -1) {
                            result = setDefaults(ontology, angular.copy(newClass));
                            result['@type'] = [ontology.matonto.owl + 'Class'];
                        } else {
                            result = angular.copy(newOntology);
                        }
                        newItems[unique] = result;
                    }
                }

                if(pi === -1 || ci === -1 || oi === -1) {
                    createEntity();
                } else {
                    editEntity();
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

            self.upload = function(isValid, file) {
                if(isValid && file) {
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
            }

            self.get = function(ontologyId) {
                var config = {
                        params: {
                            rdfFormat: 'jsonld'
                        }
                    };

                return $http.get(prefix + '/' + encodeURIComponent(ontologyId), config);
            }

            self.uploadThenGet = function(isValid, file) {
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
                    self.get(ontologyId)
                        .then(function(response) {
                            if(response.hasOwnProperty('data') && !response.data.hasOwnProperty('error')) {
                                onGetSuccess(response);
                            } else {
                                onError(response);
                            }
                        }, function(response) {
                            onError(response);
                        });
                }

                self.upload(isValid, file)
                    .then(function(response) {
                        if(response.hasOwnProperty('data') && response.data.hasOwnProperty('persisted') && response.data.persisted) {
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

            self.edit = function(ontologyId) {
                if(changedEntries.length) {
                    $rootScope.showSpinner = true;

                    var config, entityjson, obj, copy, ontology,
                        promises = [];

                    _.forEach(_.filter(changedEntries, { ontologyId: ontologyId }), function(changedEntry) {
                        obj = self.getObject(changedEntry.state);
                        obj.matonto.unsaved = false;
                        copy = angular.copy(obj);
                        ontology = ontologies[changedEntry.state.oi];

                        delete copy.matonto;

                        if(ontology.matonto.hasOwnProperty('context') && ontology.matonto.context.length) {
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

                        promises.push($http.post(prefix + '/' + encodeURIComponent(changedEntry.ontologyId), null, config));
                    });

                    $q.all(promises)
                        .then(function(response) {
                            if(!_.find(response.data, { updated: false })) {
                                self.clearChangedList(ontologyId);
                                console.log('Successful update');
                            } else {
                                console.warn('Something wasn\'t updated properly');
                            }
                        }, function(response) {
                            console.error('Error during edit');
                        })
                        .then(function() {
                            $rootScope.showSpinner = false;
                        });
                }
            }

            self.create = function(obj, state) {
                $rootScope.showSpinner = true;

                var currentOntology,
                    oi = state.oi,
                    ci = state.ci,
                    pi = state.pi,
                    tab = state.tab,
                    unique = tab + oi + ci + pi;
                obj.matonto.unsaved = false;

                if(oi === -1) {
                    return createOntology(obj);
                } else {
                    currentOntology = ontologies[oi];
                    if(ci === -1) {
                        setId(obj, 'class', currentOntology.matonto.rdfs);
                        currentOntology.matonto.classes.push(obj);
                        return createClass(obj);
                    } else {
                        setId(obj, 'property', currentOntology.matonto.rdfs);
                        currentOntology.matonto.classes[ci].matonto.properties.push(obj);
                        return createProperty(obj);
                    }
                }
                delete newItems[unique];
            }

            self.editIRI = function(begin, then, end, update, selected, ontology) {
                var update = document.getElementById('iriUpdate').checked,
                    fresh = begin + then + end;

                if(selected.matonto.hasOwnProperty('namespace')) {
                    delete selected.matonto.namespace;
                } else if(update) {
                    updateRefsService.update(ontology, selected['@id'], fresh, ontology.matonto.owl);
                }
                selected['@id'] = fresh;
            }

            self.isObjectProperty = function(types, owl) {
                return types.indexOf(owl + 'ObjectProperty') !== -1;
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
        }
})();

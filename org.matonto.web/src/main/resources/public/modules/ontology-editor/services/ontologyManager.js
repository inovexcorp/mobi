(function() {
    'use strict';

    angular
        .module('ontologyManager', ['splitIRI', 'beautify', 'updateRefs', 'camelCase', 'responseObj'])
        .service('ontologyManagerService', ontologyManagerService);

        ontologyManagerService.$inject = ['$rootScope', '$http', '$q', '$timeout', '$filter', 'updateRefsService', 'responseObj'];

        function ontologyManagerService($rootScope, $http, $q, $timeout, $filter, updateRefsService, responseObj) {
            var self = this,
                prefix = '/matontorest/ontology',
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
                ];

            self.newItems = {};
            self.ontologies = [];
            self.propertyTypes = [
                'http://www.w3.org/2002/07/owl#DatatypeProperty',
                'http://www.w3.org/2002/07/owl#ObjectProperty'
            ];

            initialize();

            function initialize() {
                $rootScope.showSpinner = true;

                var promises = [],
                    config = {
                        params: {
                            rdfFormat: 'jsonld'
                        }
                    };

                $http.get(prefix + '/getAllOntologies', config)
                    .then(function(response) {
                        var i = 0;

                        while(i < response.data.length) {
                            promises.push(addOntology(response.data[i].ontology, response.data[i].ontologyId));
                            i++;
                        }
                        $q.all(promises)
                            .then(function(response) {
                                $rootScope.showSpinner = false;
                            });
                    }, function(response) {
                        console.log('Error in initialize:', response);
                    });
            }

            function restructure(flattened, ontologyId, context, prefixes) {
                var j, obj, type, domain, annotations,
                    addToClass, initOntology, chooseIcon, objToArr, addDefaultAnnotations,
                    ontology = {
                        matonto: {
                            noDomains: [],
                            owl: prefixes.owl,
                            rdfs: prefixes.rdfs,
                            annotations: [],
                            currentAnnotationSelect: null,
                            ontologyId: ontologyId
                        }
                    },
                    classes = [],
                    properties = [],
                    others = [],
                    list = flattened['@graph'] ? flattened['@graph'] : flattened,
                    i = 0,
                    deferred = $q.defer(),
                    config = {
                        params: {
                            ontologyIdStr: ontologyId
                        }
                    };

                initOntology = function(ontology, obj) {
                    var len = obj['@id'].length,
                        delimiter = obj['@id'].charAt(len - 1);

                    if(delimiter === '#' || delimiter === ':' || delimiter === '/') {
                        obj.matonto = {
                            delimiter: delimiter,
                            originalId: obj['@id']
                        }
                        obj['@id'] = obj['@id'].substring(0, len - 1);
                    } else {
                        obj.matonto = {
                            delimiter: '#',
                            originalId: ['@id']
                        }
                    }
                    angular.merge(ontology, obj);
                }

                chooseIcon = function(property) {
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
                                icon: chooseIcon(obj),
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

                addToClass = function(id, property) {
                    var i = 0;
                    while(i < classes.length) {
                        if(classes[i]['@id'] === id) {
                            classes[i].matonto.properties.push(property);
                            break;
                        }
                        i++;
                    }
                }

                i = 0;
                while(i < properties.length) {
                    domain = properties[i][prefixes.rdfs + 'domain'];

                    if(domain) {
                        if(Object.prototype.toString.call(domain) === '[object Array]') {
                            j = domain.length;
                            while(j--) {
                                addToClass(domain[j]['@id'], properties[i]);
                            }
                        } else {
                            addToClass(domain['@id'], properties[i]);
                        }
                    } else {
                        ontology.matonto.noDomains.push(properties[i]);
                    }
                    i++;
                }

                objToArr = function(obj) {
                    var prop,
                        temp = [];
                    for(prop in obj) {
                        if(obj.hasOwnProperty(prop)) {
                            temp.push({key: prop, value: obj[prop]});
                        }
                    }
                    return temp;
                }

                ontology.matonto.classes = classes;
                ontology.matonto.context = objToArr(context);
                ontology.matonto.others = others;

                addDefaultAnnotations = function(annotations) {
                    var temp, item, index, split,
                        i = 1,
                        exclude = [
                            'http://www.w3.org/2000/01/rdf-schema#label',
                            'http://www.w3.org/2000/01/rdf-schema#comment'
                        ],
                        defaults = responseObj.stringify(defaultAnnotations),
                        arr = angular.copy(annotations);

                    arr.splice(0, 0, { namespace: 'Create ', localName: 'New Annotation' });

                    while(i < arr.length) {
                        item = arr[i];
                        if(responseObj.validateItem(item)) {
                            temp = item.namespace + item.localName;
                            if(exclude.indexOf(temp) !== -1) {
                                arr.splice(i--, 1);
                            }
                            index = defaults.indexOf(temp);
                            if(index !== -1) {
                                defaults.splice(index, 1);
                            }
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

                $http.get(prefix + '/getAllIRIs', config)
                    .then(function(response) {
                        ontology.matonto.annotations = addDefaultAnnotations(response.data.annotationProperties);
                        ontology.matonto.subClasses = $filter('orderBy')(response.data.classes, 'localName');
                        ontology.matonto.subDataProperties = $filter('orderBy')(response.data.dataProperties, 'localName');
                        ontology.matonto.subObjectProperties = $filter('orderBy')(response.data.objectProperties, 'localName');
                        ontology.matonto.propertyDomain = $filter('orderBy')(response.data.classes, 'localName');
                        ontology.matonto.dataPropertyRange = $filter('orderBy')(response.data.classes.concat(response.data.datatypes), 'localName');
                        ontology.matonto.objectPropertyRange = $filter('orderBy')(response.data.classes, 'localName');
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
                        self.ontologies.push(response);
                        deferred.resolve(response);
                    }, function(response) {
                        //TODO: handle error scenario
                        deferred.reject('something went wrong');
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
                return self.ontologies;
            }

            self.getPropertyTypes = function() {
                return self.propertyTypes;
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
                        '@type': 'owl:Ontology',
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
                        result = self.ontologies[oi].matonto.classes[ci].matonto.properties[pi];
                    } else if(pi !== undefined && ci === undefined) {
                        result = self.ontologies[oi].matonto.noDomains[pi];
                    } else if(ci !== undefined) {
                        result = self.ontologies[oi].matonto.classes[ci];
                    } else if(oi !== undefined) {
                        result = self.ontologies[oi];
                    }
                }

                setDefaults = function(ontology, obj) {
                    var result = angular.copy(obj);
                    result.matonto.namespace = ontology['@id'] + ontology.matonto.delimiter;
                    return result;
                }

                createEntity = function() {
                    var ontology = (oi !== -1) ? self.ontologies[oi] : null,
                        unique = tab + oi + ci + pi;
                    if(self.newItems[unique]) {
                        result = self.newItems[unique];
                    } else {
                        if(pi === -1) {
                            result = setDefaults(ontology, angular.copy(newProperty));
                        } else if(ci === -1) {
                            result = setDefaults(ontology, angular.copy(newClass));
                            result['@type'] = [ontology.matonto.owl + 'Class'];
                        } else {
                            result = angular.copy(newOntology);
                        }
                        self.newItems[unique] = result;
                    }
                }

                if(pi === -1 || ci === -1 || oi === -1) {
                    createEntity();
                } else {
                    editEntity();
                }
                return result;
            }

            self.delete = function(selected, state) {
                var deferred = $q.defer();

                if(state.editor === 'ontology-editor' && state.oi !== -1) {
                    $rootScope.showSpinner = true;
                    var config = {
                            params: {
                                ontologyIdStr: selected.matonto.ontologyId
                            }
                        },
                        onError = function(response) {
                            deferred.reject(response.data.error);
                            $rootScope.showSpinner = false;
                        };

                    $http.get(prefix + '/deleteOntology', config)
                        .then(function(response) {
                            if(response.hasOwnProperty('data') && response.data.hasOwnProperty('deleted') && response.data.deleted) {
                                self.ontologies.splice(state.oi, 1);
                                deferred.resolve(response);
                                $rootScope.showSpinner = false;
                            } else {
                                onError(response);
                            }
                        }, function(response) {
                            onError(response);
                        });

                } else {
                    deferred.reject();
                }

                return deferred.promise;
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

                    return $http.post(prefix + '/uploadOntology', fd, config);
                }
            }

            self.get = function(ontologyId) {
                var config = {
                        params: {
                            ontologyIdStr: ontologyId,
                            rdfFormat: 'jsonld'
                        }
                    };

                return $http.get(prefix + '/getOntology', config);
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

            self.edit = function(isValid, obj, state) {
                var oi = state.oi,
                    ci = state.ci,
                    pi = state.pi,
                    tab = state.tab,
                    current = self.ontologies[oi],
                    namespace = current.matonto.originalId + current.matonto.delimiter,
                    result = angular.copy(obj);

                if(isValid) {
                    if(pi !== undefined || ci !== undefined) {
                        result['@id'] = namespace + result['@id'];
                    } else {
                        result['@id'] = result['@id'] + result.matonto.delimiter;
                    }
                    delete result.matonto;
                    obj.matonto.unsaved = false;
                }

                // TODO: update obj.matonto.originalId in .then() after API call to update the @id if it changed
                console.log('edit', result, obj.matonto.originalId, obj);
            }

            self.create = function(isValid, obj, state) {
                var arrToObj, setId,
                    oi = state.oi,
                    ci = state.ci,
                    pi = state.pi,
                    tab = state.tab,
                    item = angular.copy(obj),
                    result = angular.copy(obj),
                    unique = tab + oi + ci + pi;
                obj.matonto.unsaved = false;

                // TODO: get this involved with passing the context back to joy
                arrToObj = function(context) {
                    var temp = {},
                        i = context.length;
                    while(i--) {
                        temp[context[i].key] = context[i].value;
                    }
                    return temp;
                }

                setId = function(obj, type, rdfs) {
                    if(obj.matonto.hasOwnProperty('namespace')) {
                        obj['@id'] = obj.matonto.namespace + $filter('camelCase')(obj[rdfs + 'label'][0]['@value'], type);
                        delete obj.matonto.namespace;
                    }
                    obj.matonto.originalId = obj['@id'];
                }

                if(isValid) {
                    if(oi === -1) {
                        obj.matonto.originalId = obj['@id'] + obj.matonto.delimiter;
                        self.ontologies.push(obj);
                    } else {
                        var current = self.ontologies[oi];
                        if(ci === -1) {
                            setId(obj, 'class', current.matonto.rdfs);
                            current.matonto.classes.push(obj);
                        } else {
                            setId(obj, 'property', current.matonto.rdfs);
                            current.matonto.classes[ci].matonto.properties.push(obj);
                        }
                    }
                    delete self.newItems[unique];
                    delete result.matonto;
                }

                console.log('create', result, obj);
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

            self.isObjectProperty = function(property, ontology) {
                var result = false;

                if(property.hasOwnProperty('@type') && ontology.hasOwnProperty('matonto') && ontology.matonto.hasOwnProperty('rdfs') && property['@type'].indexOf(ontology.matonto.owl + 'ObjectProperty') !== -1) {
                    result = true;
                }

                return result;
            }

            self.getOntology = function(oi) {
                if(oi !== undefined && oi !== -1) {
                    return self.ontologies[oi];
                }
                return undefined;
            }

            self.getOntologyProperty = function(ontology, prop) {
                if(ontology && ontology.hasOwnProperty('matonto') && ontology.matonto.hasOwnProperty(prop)) {
                    return ontology.matonto[prop];
                }
                return undefined;
            }
        }
})();
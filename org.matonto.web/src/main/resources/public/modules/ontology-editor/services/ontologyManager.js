(function() {
    'use strict';

    angular
        .module('ontologyManager', ['splitIRI', 'beautify', 'updateRefs'])
        .service('ontologyManagerService', ontologyManagerService);

        ontologyManagerService.$inject = ['$rootScope', '$http', '$q', '$timeout', 'updateRefsService'];

        function ontologyManagerService($rootScope, $http, $q, $timeout, updateRefsService) {
            var self = this,
                prefix = '/matontorest/ontology',
                defaultOwl = 'http://www.w3.org/2002/07/owl#',
                defaultRdfs = 'http://www.w3.org/2000/01/rdf-schema#',
                defaultXsd = 'http://www.w3.org/2001/XMLSchema#',
                defaultAnnotations = {
                    'http://www.w3.org/2000/01/rdf-schema#': [
                        'seeAlso',
                        'isDefinedBy'
                    ],
                    'http://www.w3.org/2002/07/owl#': [
                        'deprecated',
                        'versionInfo',
                        'priorVersion',
                        'backwardCompatibleWith',
                        'incompatibleWith'
                    ],
                    'http://purl.org/dc/elements/1.1/': [
                        'description',
                        'title'
                    ]
                };

            self.newItems = {};
            self.ontologies = [];

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
                            currentAnnotationSelect: 'default',
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
                                currentAnnotationSelect: 'default'
                            };
                            classes.push(obj);
                            break;
                        case prefixes.owl + 'DatatypeProperty':
                        case prefixes.owl + 'ObjectProperty':
                        case prefixes.rdfs + 'Property':
                            obj.matonto = {
                                icon: chooseIcon(obj),
                                originalId: obj['@id'],
                                currentAnnotationSelect: 'default'
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
                    var index, prop, i,
                        exclude = {
                            'http://www.w3.org/2000/01/rdf-schema#': [
                                'label',
                                'comment'
                            ]
                        };

                    for(prop in exclude) {
                        i = 0;
                        while(i < exclude[prop].length) {
                            if(annotations.hasOwnProperty(prop)) {
                                index = annotations[prop].indexOf(exclude[prop][i]);
                                if(index !== -1) {
                                    annotations[prop].splice(index, 1);
                                }
                            }
                            i++;
                        }
                    }

                    for(prop in defaultAnnotations) {
                        i = 0;
                        while(i < defaultAnnotations[prop].length) {
                            if(annotations.hasOwnProperty(prop)) {
                                index = annotations[prop].indexOf(defaultAnnotations[prop][i]);
                                if(index === -1) {
                                    annotations[prop].push(defaultAnnotations[prop][i]);
                                }
                            } else {
                                annotations[prop] = defaultAnnotations[prop];
                                break;
                            }
                            i++;
                        }
                    }

                    return annotations;
                }

                $http.get(prefix + '/getAllIRIs', config)
                    .then(function(response) {
                        ontology.matonto.annotations = addDefaultAnnotations(response.data[0].annotationProperties);
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

            self.getList = function() {
                return self.ontologies;
            }

            self.getObject = function(state) {
                var current, editing, creating,
                    oi = state.oi,
                    ci = state.ci,
                    pi = state.pi,
                    tab = state.tab,
                    result = {},
                    newOntology = {
                        '@id': '',
                        '@type': 'owl:Ontology',
                        matonto: {
                            rdfs: 'rdfs:',
                            owl: 'owl:',
                            delimiter: '#',
                            classes: [],
                            annotations: defaultAnnotations,
                            currentAnnotationSelect: 'default',
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
                            currentAnnotationSelect: 'default'
                        }
                    },
                    newProperty = {
                        '@id': '',
                        matonto: {
                            currentAnnotationSelect: 'default'
                        }
                    };

                editing = function() {
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

                creating = function() {
                    var unique = tab + oi + ci + pi;
                    if(self.newItems[unique]) {
                        result = self.newItems[unique];
                    } else {
                        if(pi === -1) {
                            result = angular.copy(newProperty);
                            // TODO: let them pick from a drop down list of provided property options
                            // result['@type'] = [self.ontologies[oi].matonto.owl + 'DataTypeProperty'];
                            result.matonto.namespace = self.ontologies[oi]['@id'] + self.ontologies[oi].matonto.delimiter;
                        } else if(ci === -1) {
                            result = angular.copy(newClass);
                            result['@type'] = [self.ontologies[oi].matonto.owl + 'Class'];
                            result.matonto.namespace = self.ontologies[oi]['@id'] + self.ontologies[oi].matonto.delimiter;
                        } else {
                            result = angular.copy(newOntology);
                        }
                        self.newItems[unique] = result;
                    }
                }

                if(pi === -1 || ci === -1 || oi === -1) {
                    creating();
                } else {
                    editing();
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
                        error = function(response) {
                            deferred.reject(response.data.error);
                            $rootScope.showSpinner = false;
                        };

                    $http.get(prefix + '/deleteOntology', config)
                        .then(function(response) {
                            if(response.data.deleted) {
                                self.ontologies.splice(state.oi, 1);
                                deferred.resolve(response);
                                $rootScope.showSpinner = false;
                            } else {
                                error(response);
                            }
                        }, function(response) {
                            error(response);
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

                var ontologyId,
                    deferred = $q.defer(),
                    error = function(response) {
                        deferred.reject(response);
                        $rootScope.showSpinner = false;
                    };

                self.upload(isValid, file)
                    .then(function(response) {
                        if(response.data.persisted) {
                            ontologyId = response.data.ontologyId;
                            self.get(ontologyId)
                                .then(function(response) {
                                    if(!response.data.error) {
                                        addOntology(response.data.ontology, ontologyId)
                                            .then(function(response) {
                                                deferred.resolve(response);
                                                $rootScope.showSpinner = false;
                                            });
                                    } else {
                                        error(response);
                                    }
                                }, function(response) {
                                    error(response);
                                });
                        } else {
                            error(response);
                        }
                    }, function(response) {
                        error(response);
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
                var arrToObj,
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

                if(isValid) {
                    if(oi === -1) {
                        obj.matonto.originalId = obj['@id'] + obj.matonto.delimiter;
                        self.ontologies.push(obj);
                    } else {
                        var current = self.ontologies[oi];
                        obj['@id'] = obj.matonto.namespace + obj['@id'];
                        obj.matonto.originalId = obj['@id'];
                        delete obj.matonto.namespace;

                        if(ci === -1) {
                            current.matonto.classes.push(obj);
                        } else {
                            current.matonto.classes[ci].matonto.properties.push(obj);
                        }
                    }
                    delete self.newItems[unique];
                    delete result.matonto;
                }

                console.log('create', result, obj);
            }

            self.editIRI = function(selected, ontology) {
                var begin = document.getElementById('iri-begin').value,
                    then = document.getElementById('iri-then').value,
                    end = document.getElementById('iri-end').value,
                    update = document.getElementById('iri-update').checked,
                    fresh = begin + then + end;

                // New entity iri is being edited
                if(selected.matonto.namespace) {
                    selected.matonto.namespace = begin + then;
                    selected['@id'] = end;
                } else if(update) {
                    updateRefsService.update(ontology, selected['@id'], fresh, ontology.matonto.owl);
                } else {
                    selected['@id'] = fresh;
                }
            }

            self.typeMatch = function(property, owl, type) {
                return property['@type'].indexOf(owl + type) !== -1;
            }
        }
})();
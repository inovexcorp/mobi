(function() {
    'use strict';

    angular
        .module('ontologyManager', [])
        .service('ontologyManagerService', ontologyManagerService);

        ontologyManagerService.$inject = ['$rootScope', '$http', '$q', '$timeout'];

        function ontologyManagerService($rootScope, $http, $q, $timeout) {
            var self = this,
                prefix = '/matontorest/ontology',
                defaultOwl = 'http://www.w3.org/2002/07/owl#',
                defaultRdfs = 'http://www.w3.org/2000/01/rdf-schema#',
                defaultXsd = 'http://www.w3.org/2001/XMLSchema#';

            self.newItems = {};
            self.ontologies = [];

            initialize();

            function initialize() {
                $rootScope.showSpinner = true;

                $http.get(prefix + '/getAllOntologies')
                    .then(function(response) {
                        var i = response.data.length;
                        while(i--) {
                            addOntology(response.data[i]);
                        }
                    }, function(response) {
                        console.log('Error in initialize:', response);
                    })
                    .finally(function() {
                        $rootScope.showSpinner = false;
                    });
            }

            function restructure(flattened, context, prefixes) {
                var j, obj, type, domain, addToClass, removeNamespace, initOntology, chooseIcon, objToArr, annotations,
                    ontology = {
                        matonto: {
                            noDomains: [],
                            owl: prefixes.owl,
                            rdfs: prefixes.rdfs,
                            annotations: [],
                            currentAnnotationSelect: 'default'
                        }
                    },
                    classes = [],
                    properties = [],
                    others = [],
                    list = flattened['@graph'] ? flattened['@graph'] : flattened,
                    i = list.length;

                initOntology = function(ontology, obj) {
                    var len = obj['@id'].length,
                        delimiter = obj['@id'].charAt(len - 1);

                    if(delimiter == '#' || delimiter == ':' || delimiter == '/') {
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
                    // TODO: replace with actual annotation list from web service
                    obj.matonto.annotations = [
                        prefixes.rdfs + 'seeAlso',
                        prefixes.rdfs + 'isDefinedBy',
                        prefixes.owl + 'deprecated',
                        prefixes.owl + 'versionInfo',
                        prefixes.owl + 'priorVersion',
                        prefixes.owl + 'backwardCompatibleWith',
                        prefixes.owl + 'incompatibleWith',
                        'http://purl.org/dc/elements/1.1/description',
                        'http://purl.org/dc/elements/1.1/title'
                    ];
                    angular.merge(ontology, obj);
                }

                removeNamespace = function(id) {
                    var colon = id.lastIndexOf(':') + 1,
                        result = id.substring(colon),
                        hash = id.indexOf('#') + 1,
                        slash = id.lastIndexOf('/') + 1;
                    if(hash !== 0) {
                        result = id.substring(hash);
                    } else if(slash !== 0) {
                        result = id.substring(slash);
                    }
                    return result;
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

                while(i--) {
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
                            obj['@id'] = removeNamespace(obj['@id']);
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
                            obj['@id'] = removeNamespace(obj['@id']);
                            properties.push(obj);
                            break;
                        default:
                            others.push(obj);
                            break;
                    }
                }

                addToClass = function(id, property) {
                    var i = classes.length;
                    while(i--) {
                        if(classes[i]['@id'] === id) {
                            classes[i].matonto.properties.push(property);
                            break;
                        }
                    }
                }

                i = properties.length;
                while(i--) {
                    domain = properties[i][prefixes.rdfs + 'domain'];

                    if(domain) {
                        if(Object.prototype.toString.call(domain) === '[object Array]') {
                            j = domain.length;
                            while(j--) {
                                addToClass(removeNamespace(domain[j]['@id']), properties[i]);
                            }
                        } else {
                            addToClass(removeNamespace(domain['@id']), properties[i]);
                        }
                    } else {
                        ontology.matonto.noDomains.push(properties[i]);
                    }
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
                return ontology;
            }

            function addOntology(ontology) {
                var getPrefixes,
                    context = ontology['@context'] || {};
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

                // TODO: integrate with latest develop ontology changes which flatten the JSON in the service layer
                self.ontologies.push(restructure(ontology, context, getPrefixes(context)));
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
                            // TODO: get actual annotations from webservice
                            annotations: [
                                'rdfs:seeAlso',
                                'rdfs:isDefinedBy',
                                'owl:deprecated',
                                'owl:versionInfo',
                                'owl:priorVersion',
                                'owl:backwardCompatibleWith',
                                'owl:incompatibleWith',
                                'http://purl.org/dc/elements/1.1/description',
                                'http://purl.org/dc/elements/1.1/title'
                            ],
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
                            // TODO: need to figure out what type of property
                            result['@type'] = self.ontologies[oi].matonto.owl + 'DataTypeProperty';
                        } else if(ci === -1) {
                            result = angular.copy(newClass);
                            result['@type'] = self.ontologies[oi].matonto.owl + 'Class';
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

            self.delete = function(ontologyId, state) {
                if(state.editor === 'ontology-editor' && state.oi !== -1) {
                    $rootScope.showSpinner = true;
                    var config = {
                            params: {
                                ontologyIdStr: ontologyId
                            }
                        },
                        deferred = $q.defer(),
                        error = function(response) {
                            deferred.reject(response.data.error);
                            $rootScope.showSpinner = false;
                        };

                    $http.get(prefix + '/deleteOntology', config)
                        .then(function(response) {
                            if(response.data.result) {
                                self.ontologies.splice(state.oi, 1);
                                deferred.resolve(response);
                                $rootScope.showSpinner = false;
                            } else {
                                error(response);
                            }
                        }, function(response) {
                            error(response);
                        });

                    return deferred.promise;
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

                var deferred = $q.defer(),
                    error = function(response) {
                        deferred.reject(response);
                        $rootScope.showSpinner = false;
                    };

                self.upload(isValid, file)
                    .then(function(response) {
                        if(response.data.result) {
                            // TODO: change this to just response.data['ontology id'] once the REST bundle is updated
                            self.get(response.data['ontology id'].namespace + response.data['ontology id'].localName)
                                .then(function(response) {
                                    if(!response.data.error) {
                                        addOntology(response.data.ontology);
                                        deferred.resolve(response);
                                        $rootScope.showSpinner = false;
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
                    namespace = current.matonto.prefix || (current['@id'] + current.matonto.delimiter),
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
                        var current = self.ontologies[oi],
                            namespace = current.matonto.prefix || current['@id'] + current.matonto.delimiter;
                        obj.matonto.originalId = namespace + obj['@id'];
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
        }
})();
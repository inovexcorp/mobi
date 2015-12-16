(function() {
    'use strict';

    angular
        .module('ontologyManager', [])
        .service('ontologyManagerService', ontologyManagerService);

        ontologyManagerService.$inject = ['$http'];

        function ontologyManagerService($http) {
            var self = this,
                prefix = '/matonto/rest/ontology',
                defaultOwl = 'http://www.w3.org/2002/07/owl#',
                defaultRdfs = 'http://www.w3.org/2000/01/rdf-schema#',
                defaultXsd = 'http://www.w3.org/2001/XMLSchema#',
                newOntology = {
                    '@id': '',
                    '@type': 'owl:Ontology',
                    matonto: {
                        rdfs: 'rdfs:',
                        owl: 'owl:',
                        delimiter: '#',
                        classes: [],
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
                        properties: []
                    }
                },
                newProperty = {
                    '@id': ''
                };

            self.newItems = {};
            self.ontologies = [];

            initialize();

            function initialize() {
                $http.get(prefix + '/getAllOntologyIds')
                    .then(function(response) {
                        if(!response.data.error) {
                            var prop, arr, getDelimiter;

                            getDelimiter = function(id) {
                                var result = ':',
                                    hash = id.indexOf('#') + 1,
                                    slash = id.lastIndexOf('/') + 1;
                                if(hash !== 0) {
                                    result = '#';
                                } else if(slash !== 0) {
                                    result = '/';
                                }
                                return result;
                            }

                            for(prop in response.data) {
                                arr = prop.split(getDelimiter(prop));
                                self.get(arr[0], arr[1]);
                            }
                        } else {
                            // TODO: handle error better
                            console.log(response.data.error);
                        }
                    });
            }

            function restructure(flattened, context, prefixes) {
                var obj, type, domain, addToClass, removeNamespace, initOntology, chooseIcon, objToArr,
                    ontology = {
                        matonto: {
                            noDomains: [],
                            owl: prefixes.owl,
                            rdfs: prefixes.rdfs
                        }
                    },
                    classes = [],
                    properties = [],
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

                chooseIcon = function(property, rdfs, xsd) {
                    var icon = '',
                        range = property[rdfs + 'range'];
                    // assigns the icon based on the range
                    if(range) {
                        switch(range['@id']) {
                            // TODO: pick better icon for Literal? since it can be for Integers as well
                            case xsd + 'string':
                            case rdfs + 'Literal':
                                icon = 'fa-font';
                                break;
                            default:
                                icon = 'fa-link';
                                break;
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
                    type = obj['@type'];

                    switch(type) {
                        case prefixes.owl + 'Ontology':
                            initOntology(ontology, obj);
                            break;
                        case prefixes.owl + 'Class':
                            obj.matonto = {
                                properties: [],
                                originalId: obj['@id']
                            };
                            obj['@id'] = removeNamespace(obj['@id']);
                            classes.push(obj);
                            break;
                        case prefixes.owl + 'DatatypeProperty':
                        case prefixes.owl + 'ObjectProperty':
                            obj.matonto = {
                                icon: chooseIcon(obj, prefixes.rdfs, prefixes.xsd),
                                originalId: obj['@id']
                            };
                            obj['@id'] = removeNamespace(obj['@id']);
                            properties.push(obj);
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
                jsonld.flatten(ontology, context, function(err, flattened) {
                    self.ontologies.push(restructure(flattened, context, getPrefixes(context)));
                });
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
                    result = {};

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
                    console.log(result);
                }

                if(pi === -1 || ci === -1 || oi === -1) {
                    creating();
                } else {
                    editing();
                }
                return result;
            }

            self.upload = function(isValid, file, namespace, localName) {
                if(isValid && file) {
                    // sets up the configurations for the post method
                    var fd = new FormData(),
                        config = {
                            transformRequest: angular.identity,
                            headers: {
                                'Content-Type': undefined
                            }
                        };
                    // adds the data to the FormData
                    fd.append('file', file);
                    fd.append('namespace', namespace);
                    fd.append('localName', localName);
                    // uploads the ontology file
                    return $http.post(prefix + '/uploadOntology', fd, config);
                }
            }

            self.get = function(namespace, localName) {
                var config = {
                        params: {
                            namespace: namespace,
                            localName: localName,
                            rdfFormat: 'json-ld'
                        }
                    };

                // TODO: look into how Joy is getting the json-ld format
                return $http.get(prefix + '/getOntology', config)
                    .then(function(response) {
                        if(!response.data.error) {
                            addOntology(JSON.parse(response.data.ontology));
                        } else {
                            // TODO: handle error better
                            console.warn(response.data.error);
                        }
                    });
            }

            self.uploadThenGet = function(isValid, file, namespace, localName) {
                return self.upload(isValid, file, namespace, localName)
                    .then(function(response) {
                        if(!response.data.error) {
                            return self.get(namespace, localName);
                        } else {
                            // TODO: handle error better
                            console.warn(response.data.error);
                        }
                    });
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
                console.log('for joy', result, 'original', obj.matonto.originalId, 'for me', obj);
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
                console.log('for joy', result, 'for me', obj);
            }
        }
})();
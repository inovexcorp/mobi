function createQueryString(obj) {
    var queryString = '';
    var keys = Object.keys(obj);
    keys.forEach(function(key) {
        if (keys.indexOf(key) === 0) {
            queryString = queryString.concat('?');
        }
        queryString = queryString.concat(key + '=' + obj[key]);
        if (keys.indexOf(key) !== keys.length - 1) {
            queryString = queryString.concat('&');
        }
    });
    return queryString;
}

function injectDirectiveTemplate(basePath) {
    beforeEach(function(done) {
        inject(function($templateCache) {
            var directiveTemplate = null;
            var req = new XMLHttpRequest();
            req.onload = function() {
                directiveTemplate = this.responseText;
                $templateCache.put(basePath, directiveTemplate);
                done();
            }
            // This path is dependent on the source path definied for the 
            // jasmine-maven-plugin in the pom.xml
            req.open('get', 'src/' + basePath);
            req.send();
        });
    });
}

function injectRegexConstant() {
    beforeEach(function() {
        module(function($provide) {
            $provide.constant('REGEX', {
                'IRI': new RegExp('[a-zA-Z]'),
                'LOCALNAME': new RegExp('[a-zA-Z]')
            });
        });
    });
}

function mockOntologyManager() {
    beforeEach(function() {
        angular.module('ontologyManager', []);

        module(function($provide) {
            $provide.service('ontologyManagerService', function($q) {
                this.getEntityName = jasmine.createSpy('getEntityName').and.callFake(function(entity) {
                    if (entity && entity.hasOwnProperty('@id')) {
                        return entity['@id'];
                    } else {
                        return '';
                    }
                });
                this.getBeautifulIRI = jasmine.createSpy('getBeautifulIRI').and.callFake(function(iri) {
                    return iri;
                });
                this.getList = jasmine.createSpy('getList').and.callFake(function() {
                    return [];
                });
                this.getClassProperty = jasmine.createSpy('getClassProperty').and.callFake(function(ontology, cId, pId) {
                    return {};
                });
                this.getClassProperties = jasmine.createSpy('getClassProperties').and.callFake(function(ontology, cId) {
                    return [];
                });
                this.getClass = jasmine.createSpy('getClass').and.callFake(function(ontology, cId) {
                    return {};
                });
                this.isObjectProperty = jasmine.createSpy('isObjectProperty').and.callFake(function(arr) {
                    return arr && arr.indexOf('ObjectProperty') >= 0 ? true : false;
                });
                this.getClasses = jasmine.createSpy('getClasses').and.callFake(function(ontology) {
                    if (ontology && ontology.hasOwnProperty('matonto') && ontology.matonto.hasOwnProperty('classes')) {
                        return ontology.matonto.classes;
                    }
                    return [];
                });
                this.getOntologyIds = jasmine.createSpy('getOntologyIds').and.callFake(function() {
                    return [];
                });
                this.getThenRestructure = jasmine.createSpy('getThenRestructure').and.callFake(function(ontologyId) {
                    if (ontologyId) {
                        return $q.when({'@id': ontologyId});                        
                    } else {
                        return $q.reject('Something went wrong');
                    }
                });
                this.findOntologyWithClass = jasmine.createSpy('findOntologyWithClass').and.callFake(function(ontologyList, classId) {
                    return {};
                });
            });
        });
    });
}

function mockMappingManager() {
    beforeEach(function() {
        angular.module('mappingManager', []);

        module(function($provide) {
            $provide.service('mappingManagerService', function() {
                this.previousMappingNames = [];
                this.isObjectMapping = jasmine.createSpy('isObjectMapping').and.callFake(function(entity) {
                    return entity && entity.hasOwnProperty('@type') && entity['@type'] === 'ObjectMapping' ? true : false;
                });
                this.isDataMapping = jasmine.createSpy('isDataMapping').and.callFake(function(entity) {
                    return entity && entity.hasOwnProperty('@type') && entity['@type'] === 'DataMapping' ? true : false;
                });
                this.getPropMappingsByClass = jasmine.createSpy('getPropMappingsByClass').and.callFake(function(mapping, classId) {
                    return [];
                });
                this.getSourceOntologyId = jasmine.createSpy('getSourceOntologyId').and.callFake(function(mapping) {
                    return '';
                });
                this.findClassWithObjectMapping = jasmine.createSpy('findClassWithObjectMapping').and.callFake(function(jsonld, mappingId) {
                    return {};
                });
                this.findClassWithDataMapping = jasmine.createSpy('findClassWithObjectMapping').and.callFake(function(jsonld, mappingId) {
                    return {};
                });
                this.getClassIdByMapping = jasmine.createSpy('getClassIdByMapping').and.callFake(function(entity) {
                    return '';
                });
                this.getPropIdByMapping = jasmine.createSpy('getPropIdByMapping').and.callFake(function(entity) {
                    return '';
                });
                this.getClassIdByMappingId = jasmine.createSpy('getClassIdByMappingId').and.callFake(function(entity) {
                    return '';
                });
                this.getPropIdByMappingId = jasmine.createSpy('getPropIdByMappingId').and.callFake(function(entity) {
                    return '';
                });
                this.getMappedColumns = jasmine.createSpy('getMappedColumns').and.callFake(function(mapping) {
                    return [];
                });
            });
        });
    });
}

function mockPrefixes() {
    beforeEach(function() {
        angular.module('prefixes', []);

        module(function($provide) {
            $provide.service('prefixes', function() {
                this.owl = this.rdfs = this.rdf = this.delim = this.delimData = this.data = this.mappings = '';
            });
        });
    });
}

function mockSparqlManager() {
    beforeEach(function() {
        angular.module('sparqlManager', []);

        module(function($provide) {
            $provide.service('sparqlService', function() {
                this.data = {
                    head: {
                        vars: ['var1', 'var2']
                    },
                    results: {
                        bindings: [
                            {
                                var1: {type: 'a-type1', value: 'a-value1'},
                                var2: {type: 'a-type2', value: 'a-value2'}
                            },
                            {
                                var1: {type: 'b-type1', value: 'b-value1'},
                                var2: {type: 'b-type2', value: 'b-value2'}
                            }
                        ]
                    }
                }
                this.prefixes = [];
                this.queryString = this.errorMessage = this.infoMessage = '';
            });
        });
    });
}
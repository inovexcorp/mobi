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

function mockOntologyManager() {
    beforeEach(function() {
        angular.module('ontologyManager', []);

        module(function($provide) {
            $provide.service('ontologyManagerService', function() {
                this.getEntityName = jasmine.createSpy('getEntityName').and.callFake(function(entity) {
                    if (entity && entity.hasOwnProperty('@id')) {
                        return entity['@id'];
                    } else {
                        return '';
                    }
                });
                this.getList = jasmine.createSpy('getList').and.callFake(function() {
                    return [];
                });
                this.getClassProperty = jasmine.createSpy('getClassProperty').and.callFake(function(oId, cId, pId) {
                    return {};
                });
                this.getClassProperties = jasmine.createSpy('getClassProperties').and.callFake(function(oId, cId) {
                    return [];
                });
                this.getClass = jasmine.createSpy('getClass').and.callFake(function(oId, cId) {
                    return {};
                });
                this.isObjectProperty = jasmine.createSpy('isObjectProperty').and.callFake(function(arr) {
                    return arr && arr.indexOf('ObjectProperty') >= 0 ? true : false;
                });
                this.getOntologyById = jasmine.createSpy('getOntologyById').and.callFake(function(oi) {
                    return {};
                });
                this.getClasses = jasmine.createSpy('getClasses').and.callFake(function(oId, cId) {
                    return [];
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
                this.owl = this.rdfs = this.rdf = this.delim = this.delimData = this.data = '';
            });
        });
    });
}
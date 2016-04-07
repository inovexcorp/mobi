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
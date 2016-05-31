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
    module(function($provide) {
        $provide.service('ontologyManagerService', function($q) {
            this.getEntityName = jasmine.createSpy('getEntityName').and.callFake(function(entity) {
                return (entity && entity.hasOwnProperty('@id')) ? entity['@id'] : '';
            });
            this.getBeautifulIRI = jasmine.createSpy('getBeautifulIRI').and.callFake(function(iri) {
                return iri;
            });
            this.getList = jasmine.createSpy('getList').and.returnValue([]);
            this.getClassProperty = jasmine.createSpy('getClassProperty').and.returnValue({});
            this.getClassProperties = jasmine.createSpy('getClassProperties').and.returnValue([]);
            this.getClass = jasmine.createSpy('getClass').and.returnValue({});
            this.isObjectProperty = jasmine.createSpy('isObjectProperty').and.callFake(function(arr) {
                return arr && arr.indexOf('ObjectProperty') >= 0 ? true : false;
            });
            this.getClasses = jasmine.createSpy('getClasses').and.callFake(function(ontology) {
                if (ontology && ontology.hasOwnProperty('matonto') && ontology.matonto.hasOwnProperty('classes')) {
                    return ontology.matonto.classes;
                }
                return [];
            });
            this.getOntologyIds = jasmine.createSpy('getOntologyIds').and.returnValue([]);
            this.getThenRestructure = jasmine.createSpy('getThenRestructure').and.callFake(function(ontologyId) {
                return ontologyId ? $q.when({'@id': ontologyId}) : $q.reject('Something went wrong');
            });
            this.findOntologyWithClass = jasmine.createSpy('findOntologyWithClass').and.returnValue({});
            this.getImportedOntologies = jasmine.createSpy('getImportedOntologies').and.callFake(function(ontologyId) {
                return ontologyId ? $q.when([]) : $q.reject('Something went wrong');
            });
        });
    });
}

function mockMappingManager() {
    module(function($provide) {
        $provide.service('mappingManagerService', function($q) {
            this.previousMappingNames = [];
            this.mapping = undefined;
            this.sourceOntologies = [];

            this.uploadPut = jasmine.createSpy('uploadPut').and.callFake(function(mapping, mappingName) {
                return mapping ? $q.when(mappingName) : $q.reject('Something went wrong');
            });
            this.uploadPost = jasmine.createSpy('uploadPost').and.callFake(function(mapping) {
                return mapping ? $q.when('mappingName') : $q.reject('Something went wrong');
            });
            this.getMapping = jasmine.createSpy('getMapping').and.callFake(function(mappingName) {
                return mappingName ? $q.when([]) : $q.reject('Something went wrong');
            });
            this.downloadMapping = jasmine.createSpy('downloadMapping');
            this.deleteMapping = jasmine.createSpy('deleteMapping').and.callFake(function(mappingName) {
                return mappingName ? $q.when() : $q.reject('Something went wrong');
            });
            this.createNewMapping = jasmine.createSpy('createNewMapping').and.returnValue([]);
            this.setSourceOntology = jasmine.createSpy('setSourceOntology').and.returnValue([]);
            this.addClass = jasmine.createSpy('addClass').and.returnValue([]);
            this.editIriTemplate = jasmine.createSpy('editIriTemplate').and.returnValue([]);
            this.addDataProp = jasmine.createSpy('addDataProp').and.returnValue([]);
            this.addObjectProp = jasmine.createSpy('addObjectProp').and.returnValue([]);
            this.removeProp = jasmine.createSpy('removeProp').and.returnValue([]);
            this.removeClass = jasmine.createSpy('removeClass').and.returnValue([]);
            this.isObjectMapping = jasmine.createSpy('isObjectMapping').and.callFake(function(entity) {
                return entity && entity.hasOwnProperty('@type') && entity['@type'] === 'ObjectMapping' ? true : false;
            });
            this.isDataMapping = jasmine.createSpy('isDataMapping').and.callFake(function(entity) {
                return entity && entity.hasOwnProperty('@type') && entity['@type'] === 'DataMapping' ? true : false;
            });
            this.isClassMapping = jasmine.createSpy('isClassMapping').and.callFake(function(entity) {
                return entity && entity.hasOwnProperty('@type') && entity['@type'] === 'ClassMapping' ? true : false;
            });
            this.getPropMappingsByClass = jasmine.createSpy('getPropMappingsByClass').and.returnValue([]);
            this.getSourceOntologyId = jasmine.createSpy('getSourceOntologyId').and.returnValue('');
            this.getSourceOntology = jasmine.createSpy('getSourceOntologyId').and.returnValue({});
            this.findClassWithObjectMapping = jasmine.createSpy('findClassWithObjectMapping').and.returnValue({});
            this.findClassWithDataMapping = jasmine.createSpy('findClassWithDataMapping').and.returnValue({});
            this.getClassIdByMapping = jasmine.createSpy('getClassIdByMapping').and.returnValue('');
            this.getPropIdByMapping = jasmine.createSpy('getPropIdByMapping').and.returnValue('');
            this.getClassIdByMappingId = jasmine.createSpy('getClassIdByMappingId').and.returnValue('');
            this.getPropIdByMappingId = jasmine.createSpy('getPropIdByMappingId').and.returnValue('');
            this.getAllClassMappings = jasmine.createSpy('getAllClassMappings').and.returnValue([]);
            this.getAllDataMappings = jasmine.createSpy('getAllDataMappings').and.returnValue([]);
            this.getDataMappingFromClass = jasmine.createSpy('getDataMappingFromClass').and.returnValue({});
        });
    });
}

function mockCsvManager() {
    module(function($provide) {
        $provide.service('csvManagerService', function($q) {
            this.fileObj = undefined;
            this.filePreview = undefined;
            this.fileName = '';
            this.separator = ',';
            this.containsHeaders = true;

            this.upload = jasmine.createSpy('upload').and.callFake(function(file) {
                return file ? $q.when('fileName') : $q.reject('Something went wrong');
            });
            this.previewFile = jasmine.createSpy('previewFile').and.callFake(function(rowCount) {
                return rowCount ? $q.when() : $q.reject('Something went wrong');
            });
            this.previewMap = jasmine.createSpy('previewMap').and.callFake(function(jsonld, format) {
                if (jsonld) {
                    return format === 'jsonld' ? $q.when([]) : $q.when('');
                } else {
                    return $q.reject('Something went wrong');
                }
            });
            this.map = jasmine.createSpy('map');
            this.reset = jasmine.createSpy('reset');
        });
    });
}

function mockMapperState() {
    module(function($provide) {
        $provide.service('mapperStateService', function() {
            this.editMapping = false;
            this.newMapping = false;
            this.step = 0;
            this.invalidProps = [];
            this.availableColumns = [];
            this.availableProps = [];
            this.editMappingName = false;
            this.displayCancelConfirm = false;
            this.displayNewMappingConfirm = false;
            this.changeOntology = false;
            this.displayDeleteEntityConfirm = false;
            this.displayDeleteMappingConfirm = false;
            this.previewOntology = false;
            this.editIriTemplate = false;
            this.selectedClassMappingId = '';
            this.selectedPropMappingId = '';
            this.selectedProp = undefined;
            this.selectedColumn = '';
            this.newProp = false;
            this.deleteId = '';

            this.initialize = jasmine.createSpy('initialize');
            this.resetEdit = jasmine.createSpy('resetEdit');
            this.createMapping = jasmine.createSpy('createMapping');
            this.cacheSourceOntologies = jasmine.createSpy('cacheSourceOntologies');
            this.clearCachedSourceOntologies = jasmine.createSpy('clearCachedSourceOntologies');
            this.restoreCachedSourceOntologies = jasmine.createSpy('restoreCachedSourceOntologies');
            this.getCachedSourceOntologyId = jasmine.createSpy('getCachedSourceOntologyId').and.returnValue('');
            this.updateAvailableColumns = jasmine.createSpy('updateAvailableColumns');
            this.updateAvailableProps = jasmine.createSpy('updateAvailableProps');
            this.changedMapping = jasmine.createSpy('changedMapping');
            this.getMappedColumns = jasmine.createSpy('getMappedColumns').and.returnValue([]);
        });
    });
}

function mockCatalogManager() {
    module(function($provide) {
        $provide.service('catalogManagerService', function($q) {
            this.selectedResource = undefined;
            this.currentPage = 0;
            this.filters = {
                Resources: []
            };
            this.sortBy = '';
            this.asc = false;
            this.errorMessage = '';
            this.results = {
                size: 0,
                totalSize: 0,
                results: [],
                limit: 0,
                start: 0,
                links: {
                    base: '',
                    next: '',
                    prev: ''
                }
            };
            this.getResources = jasmine.createSpy('getResources');
            this.getSortOptions = jasmine.createSpy('getSortOptions').and.callFake(function() {
                return $q.when([]);
            });
            this.getResultsPage = jasmine.createSpy('getResultsPage');
            this.downloadResource = jasmine.createSpy('downloadResource');
            this.getType = jasmine.createSpy('getType').and.returnValue('');
            this.getDate = jasmine.createSpy('getDate').and.returnValue(new Date());
        });
    });
}

function mockPrefixes() {
    beforeEach(function() {
        angular.module('prefixes', []);

        module(function($provide) {
            $provide.service('prefixes', function() {
                this.owl = this.rdfs = this.rdf = this.delim = this.delimData = this.data = this.mappings = this.catalog = '';
            });
        });
    });
}

function mockSparqlManager() {
    module(function($provide) {
        $provide.service('sparqlManagerService', function($q) {
            this.data = {
                head: {
                    vars: []
                },
                results: {
                    bindings: []
                }
            }
            this.prefixes = [];
            this.queryString = this.errorMessage = this.infoMessage = '';
            this.queryRdf = jasmine.createSpy('queryRdf').and.callFake(function() {
                return $q.resolve({});
            });
        });
    });
}
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

function injectRegexConstant() {
    beforeEach(function() {
        module(function($provide) {
            $provide.constant('REGEX', {
                'IRI': new RegExp('[a-zA-Z]'),
                'LOCALNAME': new RegExp('[a-zA-Z]'),
                'FILENAME': new RegExp('[a-zA-Z]')
            });
        });
    });
}

function injectBeautifyFilter() {
    beforeEach(function() {
        module(function($provide) {
            $provide.value('beautifyFilter', jasmine.createSpy('beautifyFilter').and.callFake(function(str) {
                return '';
            }));
        });
    });
}

function injectSplitIRIFilter() {
    beforeEach(function() {
        module(function($provide) {
            $provide.value('splitIRIFilter', jasmine.createSpy('splitIRIFilter').and.callFake(function(iri) {
                return {
                    begin: '',
                    then: '',
                    end: ''
                }
            }));
        });
    });
}

function injectTrustedFilter() {
    beforeEach(function() {
        module(function($provide) {
            $provide.value('trustedFilter', jasmine.createSpy('trustedFilter'));
        });
    });
}

function injectHighlightFilter() {
    beforeEach(function() {
        module(function($provide) {
            $provide.value('highlightFilter', jasmine.createSpy('highlightFilter'));
        });
    });
}

function injectCamelCaseFilter() {
    beforeEach(function() {
        module(function($provide) {
            $provide.value('camelCaseFilter', jasmine.createSpy('camelCaseFilter').and.callFake(function(str) {
                return str;
            }));
        });
    });
}

function mockOntologyManager() {
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
            this.getObjectCopyByIri = jasmine.createSpy('getObjectCopyByIri').and.returnValue({});
        });
    });
}

function mockMappingManager() {
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
            this.getAllClassMappings = jasmine.createSpy('getAllClassMappings').and.callFake(function(mapping) {
                return [];
            })
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
            this.getType = jasmine.createSpy('getType').and.callFake(function(type) {
                return '';
            });
            this.getDate = jasmine.createSpy('getDate').and.callFake(function(date) {
                return new Date();
            });
        });
    });
}

function mockPrefixes() {
    beforeEach(function() {
        angular.module('prefixes', []);

        module(function($provide) {
            $provide.service('prefixes', function() {
                this.owl = this.rdfs = this.rdf = this.delim = this.delimData = this.data = this.mappings = this.catalog = this.dc = '';
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

function mockSettingsManager() {
    module(function($provide) {
        $provide.service('settingsManagerService', function() {
            this.getSettings = jasmine.createSpy('getSettings').and.returnValue({});
            this.setSettings = jasmine.createSpy('setSettings').and.callFake(function(settings) {
                return settings;
            });
            this.getTreeDisplay = jasmine.createSpy('getTreeDisplay').and.returnValue('');
            this.getTooltipDisplay = jasmine.createSpy('getTooltipDisplay').and.returnValue('');
        });
    });
}

function mockStateManager() {
    module(function($provide) {
        $provide.service('stateManagerService', function() {
            this.states = {};
            this.setTreeTab = jasmine.createSpy('setTreeTab');
            this.setEditorTab = jasmine.createSpy('setEditorTab');
            this.getEditorTab = jasmine.createSpy('getEditorTab').and.returnValue('');
            this.setState = jasmine.createSpy('setState');
            this.getState = jasmine.createSpy('getState').and.returnValue({oi: 0, ci: 0, pi: 0});
            this.setStateToNew = jasmine.createSpy('setStateToNew').and.returnValue(0);
            this.clearState = jasmine.createSpy('clearState');
        });
    });
}

function mockResponseObj() {
    module(function($provide) {
        $provide.service('responseObj', function() {
            this.getItemIri = jasmine.createSpy('getItemIri').and.returnValue('');
            this.validateItem = jasmine.createSpy('validateItm').and.returnValue(true);
        });
    });
}
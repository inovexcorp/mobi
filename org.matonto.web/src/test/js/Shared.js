/*-
 * #%L
 * org.matonto.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
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
    module(function($provide) {
        $provide.constant('REGEX', {
            'IRI': new RegExp('[a-zA-Z]'),
            'LOCALNAME': new RegExp('[a-zA-Z]'),
            'FILENAME': new RegExp('[a-zA-Z]')
        });
    });
}

function injectBeautifyFilter() {
    module(function($provide) {
        $provide.value('beautifyFilter', jasmine.createSpy('beautifyFilter').and.callFake(function(str) {
            return '';
        }));
    });
}

function injectSplitIRIFilter() {
    module(function($provide) {
        $provide.value('splitIRIFilter', jasmine.createSpy('splitIRIFilter').and.callFake(function(iri) {
            return {
                begin: '',
                then: '',
                end: ''
            }
        }));
    });
}

function injectTrustedFilter() {
    module(function($provide) {
        $provide.value('trustedFilter', jasmine.createSpy('trustedFilter'));
    });
}

function injectHighlightFilter() {
    module(function($provide) {
        $provide.value('highlightFilter', jasmine.createSpy('highlightFilter'));
    });
}

function injectCamelCaseFilter() {
    module(function($provide) {
        $provide.value('camelCaseFilter', jasmine.createSpy('camelCaseFilter').and.callFake(function(str) {
            return str;
        }));
    });
}

function injectShowAnnotationsFilter() {
    module(function($provide) {
        var annotations = [{ localName: 'prop1' }, { localName: 'prop2' }];
        $provide.value('showAnnotationsFilter', jasmine.createSpy('showAnnotationsFilter').and.callFake(function(entity, arr) {
            return entity ? annotations : [];
        }));
    });
}

function injectRemoveIriFromArrayFilter() {
    module(function($provide) {
        $provide.value('removeIriFromArrayFilter', jasmine.createSpy('removeIriFromArrayFilter').and.callFake(function(arr) {
            return arr;
        }));
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
                return ontologyId ? $q.when({matonto: {id: ontologyId}}) : $q.reject('Something went wrong');
            });
            this.findOntologyWithClass = jasmine.createSpy('findOntologyWithClass').and.returnValue({});
            this.getImportedOntologies = jasmine.createSpy('getImportedOntologies').and.callFake(function(ontologyId) {
                return ontologyId ? $q.when([]) : $q.reject('Something went wrong');
            });
            this.getObjectCopyByIri = jasmine.createSpy('getObjectCopyByIri').and.returnValue({});
            this.getOntology = jasmine.createSpy('getOntology').and.returnValue({
                matonto: {
                    id: '',
                    jsAnnotations: [{}]
                }
            });
            this.createClass = jasmine.createSpy('createClass').and.returnValue($q.resolve({}));
            this.createOntology = jasmine.createSpy('createOntology').and.returnValue($q.resolve({}));
            this.createProperty = jasmine.createSpy('createProperty').and.returnValue($q.resolve({}));
            this.getPropertyTypes = jasmine.createSpy('getPropertyTypes').and.returnValue([]);
            this.download = jasmine.createSpy('download');
            this.openOntology = jasmine.createSpy('openOntology').and.returnValue($q.resolve({}));
            this.uploadThenGet = jasmine.createSpy('uploadThenGet').and.returnValue($q.resolve({}));
            this.getPreview = jasmine.createSpy('getPreview').and.returnValue($q.resolve({}));
            this.getChangedListForOntology = jasmine.createSpy('getChangedListForOntology').and.returnValue([]);
            this.editIRI = jasmine.createSpy('editIRI');
            this.edit = jasmine.createSpy('edit').and.returnValue($q.resolve({}));
            this.closeOntology = jasmine.createSpy('closeOntology');
            this.delete = jasmine.createSpy('delete').and.returnValue($q.resolve({}));
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
                return entity && entity.hasOwnProperty('@type') && _.includes(entity['@type'], 'ObjectMapping') ? true : false;
            });
            this.isDataMapping = jasmine.createSpy('isDataMapping').and.callFake(function(entity) {
                return entity && entity.hasOwnProperty('@type') && _.includes(entity['@type'], 'DataMapping') ? true : false;
            });
            this.isClassMapping = jasmine.createSpy('isClassMapping').and.callFake(function(entity) {
                return entity && entity.hasOwnProperty('@type') && _.includes(entity['@type'], 'ClassMapping') ? true : false;
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
            this.getPropMappingTitle = jasmine.createSpy('getPropMappingTitle').and.returnValue('');
        });
    });
}

function mockDelimitedManager() {
    module(function($provide) {
        $provide.service('delimitedManagerService', function($q) {
            this.fileObj = undefined;
            this.filePreview = undefined;
            this.fileName = '';
            this.separator = ',';
            this.containsHeaders = true;
            this.preview = '';

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
            this.fileUploadStep = 1;
            this.ontologySelectStep = 2;
            this.startingClassSelectStep = 3;
            this.editMappingStep = 4;
            this.finishStep = 5;
            this.editMapping = false;
            this.newMapping = false;
            this.step = 0;
            this.invalidProps = [];
            this.availableColumns = [];
            this.availableProps = [];
            this.openedClasses = [];
            this.invalidOntology = false;
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
    module(function($provide) {
        $provide.service('prefixes', function() {
            this.owl = this.rdf = this.delim = this.dataDelim = this.data = this.mappings = this.catalog = '';
            this.rdfs = 'rdfs:';
            this.dc = 'dc:';
            this.dcterms = 'dcterms:';
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
            this.state = {
                oi: 0,
                ci: 0,
                pi: 0
            };
            this.ontology = {
                '@id': 'id',
                matonto: {
                    id: 'id',
                    jsAnnotations: [{}]
                }
            };
            this.selected = {
                '@id': 'id',
                matonto: {
                    originalIri: 'iri'
                }
            };
            this.key = '';
            this.index = 0;
            this.annotationIndex = 0;
            this.setTreeTab = jasmine.createSpy('setTreeTab');
            this.setEditorTab = jasmine.createSpy('setEditorTab');
            this.getEditorTab = jasmine.createSpy('getEditorTab').and.returnValue('');
            this.setState = jasmine.createSpy('setState');
            this.getState = jasmine.createSpy('getState').and.returnValue({oi: 0, ci: 0, pi: 0});
            this.setStateToNew = jasmine.createSpy('setStateToNew').and.returnValue(0);
            this.clearState = jasmine.createSpy('clearState');
            this.entityChanged = jasmine.createSpy('entityChanged');
            this.selectItem = jasmine.createSpy('selectItem');
        });
    });
}

function mockResponseObj() {
    module(function($provide) {
        $provide.service('responseObj', function() {
            this.getItemIri = jasmine.createSpy('getItemIri').and.callFake(function(obj) {
                return (obj && obj.localName) ? obj.localName : obj;
            });
            this.validateItem = jasmine.createSpy('validateItem').and.returnValue(true);
        });
    });
}

function mockAnnotationManager() {
    module(function($provide) {
        $provide.service('annotationManagerService', function($q) {
            this.getDefaultAnnotations = jasmine.createSpy('getDefaultAnnotations').and.returnValue([]);
            this.remove = jasmine.createSpy('remove');
            this.add = jasmine.createSpy('add');
            this.edit = jasmine.createSpy('edit');
            this.create = jasmine.createSpy('create').and.returnValue($q.resolve({}));
        });
    });
}
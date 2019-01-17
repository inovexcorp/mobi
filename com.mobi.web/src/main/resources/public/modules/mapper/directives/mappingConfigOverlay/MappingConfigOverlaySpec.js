/*-
 * #%L
 * com.mobi.web
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
describe('Mapping Config Overlay component', function() {
    var $compile, scope, $q, httpSvc, utilSvc, ontologyManagerSvc, mappingManagerSvc, mapperStateSvc, catalogManagerSvc, prefixes;

    beforeEach(function() {
        module('templates');
        module('mappingConfigOverlay');
        mockHttpService();
        mockUtil();
        mockOntologyManager();
        mockMappingManager();
        mockMapperState();
        mockCatalogManager();
        mockPrefixes();
        injectHighlightFilter();
        injectTrustedFilter();

        inject(function(_$compile_, _$rootScope_, _httpService_, _utilService_, _ontologyManagerService_, _mappingManagerService_, _mapperStateService_, _catalogManagerService_, _prefixes_, _$q_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            httpSvc = _httpService_;
            utilSvc = _utilService_;
            ontologyManagerSvc = _ontologyManagerService_;
            mapperStateSvc = _mapperStateService_;
            mappingManagerSvc = _mappingManagerService_;
            catalogManagerSvc = _catalogManagerService_;
            prefixes = _prefixes_;
            $q = _$q_;
        });

        this.catalogId = 'catalog';
        this.originalOntology = {id: 'original', entities: [{}]};
        this.importedOntology = {id: 'imported', ontology: []};
        this.originalClassObj = {'@id': 'original'};
        this.importedClassObj = {'@id': 'imported'};
        this.response = {
            data: [],
        };
        catalogManagerSvc.localCatalog = {'@id': this.catalogId};
        catalogManagerSvc.getRecords.and.returnValue($q.when(this.response));
        mapperStateSvc.mapping = {jsonld: [], difference: {additions: [], deletions: []}};
    });

    beforeEach(function compile() {
        this.compile = function() {
            scope.close = jasmine.createSpy('close');
            scope.dismiss = jasmine.createSpy('dismiss');
            this.element = $compile(angular.element('<mapping-config-overlay close="close()" dismiss="dismiss()"></mapping-config-overlay>'))(scope);
            scope.$digest();
            this.controller = this.element.controller('mappingConfigOverlay');
        }
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        httpSvc = null;
        utilSvc = null;
        ontologyManagerSvc = null;
        mappingManagerSvc = null;
        mapperStateSvc = null;
        catalogManagerSvc = null;
        prefixes = null;
        if (this.element) {
            this.element.remove();
        }
    });

    describe('should initialize with the correct values', function() {
        it('for the configuration for getting ontology records', function() {
            var sortOption = {field: prefixes.dcterms + 'title', asc: true};
            catalogManagerSvc.sortOptions = [sortOption];
            this.compile();
            expect(this.controller.recordsConfig.pageIndex).toEqual(0);
            expect(this.controller.recordsConfig.sortOption).toEqual(sortOption);
            expect(this.controller.recordsConfig.recordType).toEqual(prefixes.ontologyEditor + 'OntologyRecord');
            expect(this.controller.recordsConfig.limit).toEqual(100);
            expect(this.controller.recordsConfig.searchText).toEqual('');
        });
        it('for the list of ontology records', function() {
            this.compile();
            expect(catalogManagerSvc.getRecords).toHaveBeenCalledWith(this.catalogId, this.controller.recordsConfig, this.controller.spinnerId);
            expect(this.controller.ontologies).toEqual(this.response.data);
        });
        it('if the mapping does not have an ontology set', function() {
            this.compile();
            expect(this.controller.selectedOntology).toBeUndefined();
            expect(this.controller.ontologyStates).toEqual([]);
            expect(this.controller.selectedVersion).toEqual('latest');
            expect(this.controller.selectedOntologyState).toBeUndefined();
            expect(this.controller.classes).toEqual([]);
            expect(catalogManagerSvc.getRecordMasterBranch).not.toHaveBeenCalled();
            expect(catalogManagerSvc.getBranchHeadCommit).not.toHaveBeenCalled();
        });
        describe('if the mapping has a record set', function() {
            beforeEach(function() {
                this.ontology = {'@id': 'ont1'};
                this.classObj = {'@id': 'class'};
                mapperStateSvc.mapping.ontology = this.ontology;
                mapperStateSvc.sourceOntologies = [{id: ''}];
                this.expectedState = {
                    recordId: this.ontology['@id'],
                    branchId: ''
                };
                this.expectedVersion = {
                    commitId: '',
                    ontologies: mapperStateSvc.sourceOntologies,
                    classes: [{ontologyId: '', classObj: this.classObj}]
                };
                utilSvc.getDctermsValue.and.returnValue('title');
                utilSvc.getPropertyId.and.returnValue(this.expectedVersion.commitId);
                mapperStateSvc.getClasses.and.returnValue(this.expectedVersion.classes);
                mappingManagerSvc.getClassIdByMapping.and.returnValue(this.classObj['@id']);
                catalogManagerSvc.getRecordMasterBranch.and.returnValue($q.when({'@id': this.expectedState.branchId}));
            });
            it('and no changes have been commited to the ontology since it was set', function() {
                mappingManagerSvc.getSourceOntologyInfo.and.returnValue({commitId: this.expectedVersion.commitId});
                this.expectedState.latest = this.expectedVersion;
                this.compile();
                expect(catalogManagerSvc.getRecordMasterBranch).toHaveBeenCalledWith(this.ontology['@id'], this.catalogId);
                expect(utilSvc.getPropertyId).toHaveBeenCalledWith(jasmine.any(Object), prefixes.catalog + 'head');
                expect(mappingManagerSvc.getSourceOntologyInfo).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld);
                expect(this.controller.selectedOntology).toEqual({recordId: this.ontology['@id'], ontologyIRI: jasmine.any(String), title: 'title', selected: true, jsonld: this.ontology});
                expect(this.controller.ontologyStates).toContain(this.expectedState);
                expect(this.controller.selectedOntologyState).toEqual(this.expectedState);
                expect(this.controller.selectedVersion).toEqual('latest');
                expect(this.controller.classes).toEqual(this.expectedVersion.classes);
            });
            it('and changes have been commited to the ontology since it was set', function() {
                mappingManagerSvc.getSourceOntologyInfo.and.returnValue({commitId: 'different'});
                this.expectedState.saved = _.set(angular.copy(this.expectedVersion), 'commitId', 'different');
                this.compile();
                expect(this.controller.selectedOntology).toEqual({recordId: this.ontology['@id'], ontologyIRI: jasmine.any(String), title: 'title', selected: true, jsonld: this.ontology});
                expect(this.controller.ontologyStates).toContain(this.expectedState);
                expect(this.controller.selectedOntologyState).toEqual(this.expectedState);
                expect(this.controller.selectedVersion).toEqual('saved');
                expect(this.controller.classes).toEqual(this.expectedVersion.classes);
            });
        });
    });
    describe('controller bound variable', function() {
        beforeEach(function() {
            this.compile();
        });
        it('close should be called in the parent scope', function() {
            this.controller.close();
            expect(scope.close).toHaveBeenCalled();
        });
        it('dismiss should be called in the parent scope', function() {
            this.controller.dismiss();
            expect(scope.dismiss).toHaveBeenCalled();
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            this.compile();
        });
        it('should get the ontology IRI of an OntologyRecord', function() {
            utilSvc.getPropertyId.and.returnValue('ontology')
            expect(this.controller.getOntologyIRI({})).toEqual('ontology');
            expect(utilSvc.getPropertyId).toHaveBeenCalledWith({}, prefixes.ontologyEditor + 'ontologyIRI');
        });
        describe('should set the list of ontology records', function() {
            it('unless an error occurs', function() {
                catalogManagerSvc.getRecords.and.returnValue($q.reject('Error message'));
                this.controller.setOntologies();
                scope.$apply();
                expect(httpSvc.cancel).toHaveBeenCalledWith(this.controller.spinnerId);
                expect(catalogManagerSvc.getRecords).toHaveBeenCalledWith(this.catalogId, this.controller.recordsConfig, this.controller.spinnerId);
                expect(this.controller.recordsErrorMessage).toEqual('Error retrieving ontologies');
            });
            it('successfully', function() {
                var record1 = {'@id': 'record1'};
                var record2 = {'@id': 'record2'};
                this.controller.selectedOntology = {recordId: record1['@id'], selected: true, jsonld: record1};
                this.response.data = [record1, record2];
                utilSvc.getDctermsValue.and.returnValue('title');
                spyOn(this.controller, 'getOntologyIRI').and.returnValue('ontology');
                this.controller.setOntologies();
                scope.$apply();
                expect(httpSvc.cancel).toHaveBeenCalledWith(this.controller.spinnerId);
                expect(catalogManagerSvc.getRecords).toHaveBeenCalledWith(this.catalogId, this.controller.recordsConfig, this.controller.spinnerId);
                expect(this.controller.ontologies).toEqual([
                    {recordId: record1['@id'], ontologyIRI: 'ontology', title: 'title', selected: true, jsonld: record1},
                    {recordId: record2['@id'], ontologyIRI: 'ontology', title: 'title', selected: false, jsonld: record2}
                ]);
                expect(this.controller.recordsErrorMessage).toEqual('');
            });
        });
        describe('should select an ontology', function() {
            beforeEach(function() {
                this.ontology = {recordId: 'ontology', jsonld: {'@id': ''}};
             });
            it('if it had been opened', function() {
                var openedState = {
                    recordId: this.ontology.recordId,
                    latest: {
                        classes: []
                    }
                };
                this.controller.ontologyStates.push(openedState);
                this.controller.selectOntology(this.ontology);
                expect(this.controller.selectedOntology).toEqual(this.ontology);
                expect(this.controller.selectedOntologyState).toEqual(openedState);
                expect(this.controller.selectedVersion).toEqual('latest');
                expect(this.controller.classes).toEqual(openedState.latest.classes);
                expect(this.controller.errorMessage).toEqual('');
            });
            describe('if it had not been opened', function() {
                it('unless an error occurs', function() {
                    catalogManagerSvc.getRecordMasterBranch.and.returnValue($q.reject('Error message'));
                    this.controller.selectOntology(this.ontology);
                    scope.$apply();
                    expect(catalogManagerSvc.getRecordMasterBranch).toHaveBeenCalledWith(this.ontology.recordId, this.catalogId);
                    expect(this.controller.errorMessage).toEqual('Error retrieving ontology');
                    expect(this.controller.selectedOntology).toBeUndefined();
                    expect(this.controller.selectedOntologyState).toBeUndefined();
                    expect(this.controller.classes).toEqual([]);
                });
                it('successfully', function() {
                    var expectedState = {
                        recordId: this.ontology.recordId,
                        branchId: '',
                        latest: {
                            commitId: '',
                            ontologies: [this.originalOntology, {id: this.importedOntology.id, entities: this.importedOntology.ontology}],
                            classes: [{ontologyId: 'original', classObj: this.originalClassObj}, {ontologyId: 'imported', classObj: this.importedClassObj}]
                        }
                    };
                    utilSvc.getPropertyId.and.returnValue(expectedState.latest.commitId);
                    mappingManagerSvc.getOntology.and.returnValue($q.when(this.originalOntology));
                    mapperStateSvc.getClasses.and.returnValue(expectedState.latest.classes);
                    ontologyManagerSvc.getImportedOntologies.and.returnValue($q.when([this.importedOntology]));
                    catalogManagerSvc.getRecordMasterBranch.and.returnValue($q.when({'@id': expectedState.branchId}));
                    this.selectedVersion = 'saved';
                    this.controller.selectOntology(this.ontology);
                    scope.$apply();
                    expect(this.controller.selectedOntology).toEqual(this.ontology);
                    expect(catalogManagerSvc.getRecordMasterBranch).toHaveBeenCalledWith(this.ontology.recordId, this.catalogId);
                    expect(utilSvc.getPropertyId).toHaveBeenCalledWith(jasmine.any(Object), prefixes.catalog + 'head');
                    expect(mappingManagerSvc.getOntology).toHaveBeenCalled();
                    expect(ontologyManagerSvc.getImportedOntologies).toHaveBeenCalledWith(expectedState.recordId, expectedState.branchId, expectedState.latest.commitId);
                    expect(this.controller.ontologyStates).toContain(expectedState);
                    expect(this.controller.selectedOntologyState).toEqual(expectedState);
                    expect(this.controller.selectedVersion).toEqual('latest');
                    expect(this.controller.classes).toEqual(expectedState.latest.classes);
                    expect(this.controller.errorMessage).toEqual('');
                });
            });
        });
        describe('should select a version', function() {
            it('unless an ontology has not been selected', function() {
                var selectedOntologyState = this.controller.selectedOntologyState;
                var classes = this.controller.classes;
                this.controller.selectVersion();
                expect(this.controller.selectedOntologyState).toEqual(selectedOntologyState);
                expect(this.controller.classes).toEqual(classes);
            });
            describe('of the selected ontology', function() {
                beforeEach(function() {
                    this.controller.selectedOntologyState = {
                        recordId: '',
                        branchId: ''
                    };
                });
                it('if the version has already been opened', function() {
                    this.controller.selectedOntologyState.latest = {classes: []};
                    this.controller.selectedVersion = 'latest';
                    this.controller.selectVersion();
                    expect(this.controller.errorMessage).toEqual('');
                    expect(this.controller.classes).toEqual(this.controller.selectedOntologyState.latest.classes);
                });
                describe('if the', function() {
                    beforeEach(function() {
                        mappingManagerSvc.getOntology.and.returnValue($q.when(this.originalOntology));
                        mapperStateSvc.getClasses.and.returnValue([{ontologyId: 'original', classObj: this.originalClassObj}, {ontologyId: 'imported', classObj: this.importedClassObj}]);
                        ontologyManagerSvc.getImportedOntologies.and.returnValue($q.when([this.importedOntology]));
                    });
                    describe('latest version has not been opened yet', function() {
                        beforeEach(function() {
                            this.controller.selectedVersion = 'latest';
                        });
                        it('unless an error occurs', function() {
                            var selectedOntologyState = angular.copy(this.controller.selectedOntologyState);
                            catalogManagerSvc.getRecordBranch.and.returnValue($q.reject('Error message'));
                            this.controller.selectVersion();
                            scope.$apply();
                            expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(selectedOntologyState.branchId, selectedOntologyState.recordId, this.catalogId);
                            expect(this.controller.errorMessage).toEqual('Error retrieving ontology');
                            expect(this.controller.selectedRecord).toBeUndefined();
                            expect(this.controller.selectedOntologyState).toBeUndefined();
                            expect(this.controller.classes).toEqual([]);
                        });
                        it('successfully', function() {
                            var expectedVersion = {
                                commitId: '',
                                ontologies: [this.originalOntology, {id: this.importedOntology.id, entities: this.importedOntology.ontology}],
                                classes: [{ontologyId: 'original', classObj: this.originalClassObj}, {ontologyId: 'imported', classObj: this.importedClassObj}]
                            };
                            catalogManagerSvc.getRecordBranch.and.returnValue($q.when({}));
                            utilSvc.getPropertyId.and.returnValue(expectedVersion.commitId);
                            this.controller.selectVersion();
                            scope.$apply();
                            expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(this.controller.selectedOntologyState.branchId, this.controller.selectedOntologyState.recordId, this.catalogId);
                            expect(utilSvc.getPropertyId).toHaveBeenCalledWith({}, prefixes.catalog + 'head');
                            expect(mappingManagerSvc.getOntology).toHaveBeenCalled();
                            expect(ontologyManagerSvc.getImportedOntologies).toHaveBeenCalledWith(this.controller.selectedOntologyState.recordId, this.controller.selectedOntologyState.branchId, expectedVersion.commitId);
                            expect(this.controller.classes).toEqual(expectedVersion.classes);
                            expect(this.controller.selectedOntologyState.latest).toEqual(expectedVersion);
                            expect(this.controller.errorMessage).toEqual('');
                        });
                    });
                    describe('saved version has not been opened yet', function() {
                        beforeEach(function() {
                            this.controller.selectedVersion = 'saved';
                            this.ontologyInfo = {
                                branchId: '',
                                commitId: '',
                                recordId: ''
                            };
                            mappingManagerSvc.getSourceOntologyInfo.and.returnValue(this.ontologyInfo);
                        });
                        it('unless an error occurs', function() {
                            mappingManagerSvc.getOntology.and.returnValue($q.reject('Error message'));
                            this.controller.selectVersion();
                            scope.$apply();
                            expect(mappingManagerSvc.getSourceOntologyInfo).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld);
                            expect(mappingManagerSvc.getOntology).toHaveBeenCalledWith(this.ontologyInfo);
                            expect(this.controller.errorMessage).toEqual('Error retrieving ontology');
                            expect(this.controller.selectedRecord).toBeUndefined();
                            expect(this.controller.selectedOntologyState).toBeUndefined();
                            expect(this.controller.classes).toEqual([]);
                        });
                        it('successfully', function() {
                            var expectedVersion = {
                                commitId: this.ontologyInfo.commitId,
                                ontologies: [this.originalOntology, {id: this.importedOntology.id, entities: this.importedOntology.ontology}],
                                classes: [{ontologyId: 'original', classObj: this.originalClassObj}, {ontologyId: 'imported', classObj: this.importedClassObj}]
                            };
                            this.controller.selectVersion();
                            scope.$apply();
                            expect(mappingManagerSvc.getSourceOntologyInfo).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld);
                            expect(mappingManagerSvc.getOntology).toHaveBeenCalledWith(this.ontologyInfo);
                            expect(ontologyManagerSvc.getImportedOntologies).toHaveBeenCalledWith(this.ontologyInfo.recordId, this.ontologyInfo.branchId, this.ontologyInfo.commitId);
                            expect(this.controller.classes).toEqual(expectedVersion.classes);
                            expect(this.controller.selectedOntologyState.saved).toEqual(expectedVersion);
                            expect(this.controller.errorMessage).toEqual('');
                        });
                    });
                });
            });
        });
        describe('should set the correct state for setting the configuration', function() {
            beforeEach(function() {
                this.ontologyInfo = {
                    recordId: '',
                    branchId: '',
                    commitId: '',
                };
                this.controller.selectedOntologyState = {
                    recordId: this.ontologyInfo.recordId,
                    branchId: this.ontologyInfo.branchId,
                    latest: {
                        commitId: this.ontologyInfo.commitId,
                        ontologies: [{}]
                    }
                };
                this.controller.selectedVersion = 'latest';
                this.controller.selectedOntology = {jsonld: {'@id': this.ontologyInfo.recordId}};
            });
            it('if it has not changed', function() {
                mappingManagerSvc.getSourceOntologyInfo.and.returnValue(this.ontologyInfo);
                this.controller.set();
                expect(mapperStateSvc.sourceOntologies).not.toEqual(this.controller.selectedOntologyState.latest.ontologies);
                expect(mappingManagerSvc.findIncompatibleMappings).not.toHaveBeenCalled();
                expect(mappingManagerSvc.setSourceOntologyInfo).not.toHaveBeenCalled();
                expect(mapperStateSvc.resetEdit).not.toHaveBeenCalled();
                expect(mapperStateSvc.setProps).not.toHaveBeenCalled();
                expect(scope.close).toHaveBeenCalled();
            });
            describe('if it changed', function() {
                beforeEach(function() {
                    this.oldOntologyInfo = {
                        recordId: 'oldRecord',
                        branchId: 'oldBranch',
                        commitId: 'oldCommit',
                    };
                    mappingManagerSvc.getSourceOntologyInfo.and.returnValue(this.oldOntologyInfo);
                    this.classMapping = {'@id': 'classMapping'};
                    mappingManagerSvc.getAllClassMappings.and.returnValue([this.classMapping]);
                    this.controller.classes = [{classObj: {'@id': 'class1'}}, {classObj: {'@id': 'class2'}}];
                    mappingManagerSvc.getMappingEntity.and.returnValue({'@id': 'mapping'});
                    mappingManagerSvc.getClassIdByMapping.and.returnValue('class');
                });
                it('setting appropriate state', function() {
                    this.controller.set();
                    expect(mapperStateSvc.sourceOntologies).toEqual(this.controller.selectedOntologyState.latest.ontologies);
                    expect(mappingManagerSvc.setSourceOntologyInfo).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, this.ontologyInfo.recordId, this.ontologyInfo.branchId, this.ontologyInfo.commitId);
                    expect(mapperStateSvc.mapping.ontology).toEqual(this.controller.selectedOntology.jsonld);
                    expect(mapperStateSvc.changeProp).toHaveBeenCalledWith('mapping', prefixes.delim + 'sourceRecord', this.ontologyInfo.recordId, this.oldOntologyInfo.recordId, true);
                    expect(mapperStateSvc.changeProp).toHaveBeenCalledWith('mapping', prefixes.delim + 'sourceBranch', this.ontologyInfo.branchId, this.oldOntologyInfo.branchId, true);
                    expect(mapperStateSvc.changeProp).toHaveBeenCalledWith('mapping', prefixes.delim + 'sourceCommit', this.ontologyInfo.commitId, this.oldOntologyInfo.commitId, true);
                    expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                    expect(mapperStateSvc.setProps).toHaveBeenCalledWith('class');
                    expect(mapperStateSvc.availableClasses).toEqual(this.controller.classes);
                    expect(scope.close).toHaveBeenCalled();
                });
                describe('removing incompatible mappings', function() {
                    beforeEach(function() {
                        this.badMapping = {'@id': 'bad'};
                        mappingManagerSvc.findIncompatibleMappings.and.returnValue([this.badMapping])
                        mapperStateSvc.mapping.jsonld.push(this.badMapping);
                    });
                    describe('if they are property mappings', function() {
                        beforeEach(function() {
                            mappingManagerSvc.isPropertyMapping.and.returnValue(true);
                            mappingManagerSvc.findClassWithDataMapping.and.returnValue(this.classMapping);
                            mappingManagerSvc.findClassWithObjectMapping.and.returnValue(this.classMapping);
                        });
                        it('for data properties', function() {
                            mappingManagerSvc.isDataMapping.and.returnValue(true);
                            this.controller.set();
                            expect(mappingManagerSvc.findClassWithDataMapping).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, this.badMapping['@id']);
                            expect(mappingManagerSvc.findClassWithObjectMapping).not.toHaveBeenCalled();
                            expect(mapperStateSvc.deleteProp).toHaveBeenCalledWith(this.badMapping['@id'], this.classMapping['@id']);
                        });
                        it('for object properties', function() {
                            mappingManagerSvc.isDataMapping.and.returnValue(false);
                            this.controller.set();
                            expect(mappingManagerSvc.findClassWithDataMapping).not.toHaveBeenCalled();
                            expect(mappingManagerSvc.findClassWithObjectMapping).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, this.badMapping['@id']);
                            expect(mapperStateSvc.deleteProp).toHaveBeenCalledWith(this.badMapping['@id'], this.classMapping['@id']);
                        });
                    });
                    it('if they are class mappings', function() {
                        mappingManagerSvc.isPropertyMapping.and.returnValue(false);
                        mappingManagerSvc.isClassMapping.and.returnValue(true);
                        this.controller.set();
                        expect(mapperStateSvc.deleteClass).toHaveBeenCalledWith(this.badMapping['@id']);
                    });
                });
            });
        });
        it('should set the correct state for canceling', function() {
            this.controller.cancel();
            expect(scope.dismiss).toHaveBeenCalled();
        });
    });
    describe('contains the correct html', function() {
        beforeEach(function() {
            mapperStateSvc.mapping = {id: '', jsonld: []};
            this.compile();
        });
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('MAPPING-CONFIG-OVERLAY');
            expect(this.element.querySelectorAll('.modal-header').length).toEqual(1);
            expect(this.element.querySelectorAll('.modal-body').length).toEqual(1);
            expect(this.element.querySelectorAll('.modal-footer').length).toEqual(1);
        });
        ['.row', '.ontology-select-container', '.preview-display', '.ontologies'].forEach(test => {
            it('with a '+ test, function() {
                expect(this.element.querySelectorAll(test).length).toEqual(1);
            });
        });
        ['md-list', 'search-bar'].forEach(test => {
            it('with a ' + test, function() {
                expect(this.element.find(test).length).toEqual(1);
            });
        });
        it('depending on whether an error has occured', function() {
            this.controller = this.element.controller('mappingConfigOverlay');
            expect(this.element.find('error-display').length).toEqual(0);

            this.controller.errorMessage = 'test';
            scope.$digest();
            expect(this.element.find('error-display').length).toEqual(1);
        });
        it('depending on whether an error has occured when retrieving the records', function() {
            this.controller = this.element.controller('mappingConfigOverlay');
            expect(this.element.find('error-display').length).toEqual(0);

            this.controller.recordsErrorMessage = 'test';
            scope.$digest();
            expect(this.element.find('error-display').length).toEqual(1);
        });
        it('depending on how many ontology records there are', function() {
            this.controller = this.element.controller('mappingConfigOverlay');
            this.controller.ontologies = [{}];
            scope.$digest();
            expect(this.element.find('md-list-item').length).toEqual(this.controller.ontologies.length);
        });
        it('depending on whether an ontology record has been selected', function() {
            var ontologyInfo = this.element.querySelectorAll('.ontology-record-info');
            expect(ontologyInfo.length).toEqual(0);

            // this.controller = this.element.controller('mappingConfigOverlay');
            this.controller.selectedOntology = {'@id': ''};
            scope.$digest();
            ontologyInfo = this.element.querySelectorAll('.ontology-record-info');
            expect(ontologyInfo.length).toEqual(1);
        });
        it('depending on whether the selected ontology record has a saved version', function() {
            var options = this.element.querySelectorAll('.version-select option');
            expect(options.length).toEqual(1);

            // this.controller = this.element.controller('mappingConfigOverlay');
            this.controller.selectedOntologyState = {saved: {}};
            scope.$digest();
            options = this.element.querySelectorAll('.version-select option');
            expect(options.length).toEqual(2);
        });
        it('depending on whether an ontology record state has been selected', function() {
            this.controller = this.element.controller('mappingConfigOverlay');
            var versionSelect = angular.element(this.element.querySelectorAll('.version-select')[0]);
            var setButton = angular.element(this.element.querySelectorAll('.modal-footer button.btn-primary')[0]);
            expect(versionSelect.attr('disabled')).toBeTruthy();
            expect(setButton.attr('disabled')).toBeTruthy();

            this.controller.selectedOntologyState = {};
            scope.$digest();
            expect(versionSelect.attr('disabled')).toBeFalsy();
            expect(setButton.attr('disabled')).toBeFalsy();
        });
        it('with buttons to cancel and submit', function() {
            var buttons = this.element.querySelectorAll('.modal-footer button');
            expect(buttons.length).toEqual(2);
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[1]).text().trim());
        });
    });
    it('should call set when the submit button is clicked', function() {
        this.compile();
        spyOn(this.controller, 'set');

        var continueButton = angular.element(this.element.querySelectorAll('.modal-footer button.btn-primary')[0]);
        continueButton.triggerHandler('click');
        expect(this.controller.set).toHaveBeenCalled();
    });
    it('should call cancel when the button is clicked', function() {
        this.compile();
        spyOn(this.controller, 'cancel');

        var continueButton = angular.element(this.element.querySelectorAll('.modal-footer button:not(.btn-primary)')[0]);
        continueButton.triggerHandler('click');
        expect(this.controller.cancel).toHaveBeenCalled();
    });
});
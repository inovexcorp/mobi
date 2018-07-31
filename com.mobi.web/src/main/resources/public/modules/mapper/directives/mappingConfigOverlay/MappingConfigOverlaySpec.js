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
describe('Mapping Config Overlay directive', function() {
    var $compile, scope, $q, utilSvc, ontologyManagerSvc, mappingManagerSvc, mapperStateSvc, catalogManagerSvc, prefixes;

    beforeEach(function() {
        module('templates');
        module('mappingConfigOverlay');
        mockUtil();
        mockOntologyManager();
        mockMappingManager();
        mockMapperState();
        mockCatalogManager();
        mockPrefixes();
        injectHighlightFilter();
        injectTrustedFilter();

        inject(function(_$compile_, _$rootScope_, _utilService_, _ontologyManagerService_, _mappingManagerService_, _mapperStateService_, _catalogManagerService_, _prefixes_, _$q_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            utilSvc = _utilService_;
            ontologyManagerSvc = _ontologyManagerService_;
            mapperStateSvc = _mapperStateService_;
            mappingManagerSvc = _mappingManagerService_;
            catalogManagerSvc = _catalogManagerService_;
            prefixes = _prefixes_;
            $q = _$q_;
        });

        this.originalOntology = {id: 'original', entities: [{}]};
        this.importedOntology = {id: 'imported', ontology: []};
        this.originalClassObj = {'@id': 'original'};
        this.importedClassObj = {'@id': 'imported'};
        this.response = {
            data: [],
            headers: jasmine.createSpy('headers')
        };
        catalogManagerSvc.localCatalog = {'@id': ''};
        catalogManagerSvc.getRecords.and.returnValue($q.when(this.response));
        mapperStateSvc.mapping = {jsonld: [], difference: {additions: [], deletions: []}};
    });

    beforeEach(function compile() {
        this.compile = function() {
            this.element = $compile(angular.element('<mapping-config-overlay></mapping-config-overlay>'))(scope);
            scope.$digest();
            this.controller = this.element.controller('mappingConfigOverlay');
        }
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        utilSvc = null;
        ontologyManagerSvc = null;
        mappingManagerSvc = null;
        mapperStateSvc = null;
        catalogManagerSvc = null;
        prefixes = null;
        this.element.remove();
    });

    describe('should initialize with the correct values', function() {
        it('for the configuration for getting ontology records', function() {
            var sortOption = {field: prefixes.dcterms + 'title', asc: true};
            catalogManagerSvc.sortOptions = [sortOption];
            this.compile();
            expect(this.controller.recordsConfig.pageIndex).toBe(0);
            expect(this.controller.recordsConfig.sortOption).toEqual(sortOption);
            expect(this.controller.recordsConfig.recordType).toEqual(prefixes.ontologyEditor + 'OntologyRecord');
            expect(this.controller.recordsConfig.limit).toEqual(10);
            expect(this.controller.recordsConfig.searchText).toEqual('');
        });
        it('for the list of ontology records', function() {
            var headers = {
                'x-total-count': 10
            };
            this.response.headers.and.returnValue(headers);
            this.compile();
            expect(catalogManagerSvc.getRecords).toHaveBeenCalledWith(catalogManagerSvc.localCatalog['@id'], this.controller.recordsConfig);
            expect(this.controller.records).toEqual(this.response.data);
            expect(this.controller.totalSize).toEqual(headers['x-total-count']);
        });
        it('if the mapping does not have an ontology set', function() {
            this.compile();
            expect(this.controller.selectedRecord).toBeUndefined();
            expect(this.controller.ontologyStates).toEqual([]);
            expect(this.controller.selectedVersion).toBe('latest');
            expect(this.controller.selectedOntologyState).toBeUndefined();
            expect(this.controller.classes).toEqual([]);
            expect(catalogManagerSvc.getRecordMasterBranch).not.toHaveBeenCalled();
            expect(catalogManagerSvc.getBranchHeadCommit).not.toHaveBeenCalled();
        });
        describe('if the mapping has a record set', function() {
            beforeEach(function() {
                this.ontology = {'@id': ''};
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
                utilSvc.getDctermsValue.and.returnValue('');
                utilSvc.getPropertyId.and.returnValue(this.expectedVersion.commitId);
                mapperStateSvc.getClasses.and.returnValue(this.expectedVersion.classes);
                mappingManagerSvc.getClassIdByMapping.and.returnValue(this.classObj['@id']);
                catalogManagerSvc.getRecordMasterBranch.and.returnValue($q.when({'@id': this.expectedState.branchId}));
            });
            it('and no changes have been commited to the ontology since it was set', function() {
                mappingManagerSvc.getSourceOntologyInfo.and.returnValue({commitId: this.expectedVersion.commitId});
                this.expectedState.latest = this.expectedVersion;
                this.compile();
                expect(catalogManagerSvc.getRecordMasterBranch).toHaveBeenCalledWith(this.ontology['@id'], catalogManagerSvc.localCatalog['@id']);
                expect(utilSvc.getPropertyId).toHaveBeenCalledWith(jasmine.any(Object), prefixes.catalog + 'head');
                expect(mappingManagerSvc.getSourceOntologyInfo).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld);
                expect(this.controller.selectedRecord).toEqual(this.ontology);
                expect(this.controller.ontologyStates).toContain(this.expectedState);
                expect(this.controller.selectedOntologyState).toEqual(this.expectedState);
                expect(this.controller.selectedVersion).toBe('latest');
                expect(this.controller.classes).toEqual(this.expectedVersion.classes);
            });
            it('and changes have been commited to the ontology since it was set', function() {
                mappingManagerSvc.getSourceOntologyInfo.and.returnValue({commitId: 'different'});
                this.expectedState.saved = _.set(angular.copy(this.expectedVersion), 'commitId', 'different');
                this.compile();
                expect(this.controller.selectedRecord).toEqual(this.ontology);
                expect(this.controller.ontologyStates).toContain(this.expectedState);
                expect(this.controller.selectedOntologyState).toEqual(this.expectedState);
                expect(this.controller.selectedVersion).toBe('saved');
                expect(this.controller.classes).toEqual(this.expectedVersion.classes);
            });
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            this.compile();
        });
        describe('should set the list of ontology records', function() {
            it('unless an error occurs', function() {
                catalogManagerSvc.getRecords.and.returnValue($q.reject('Error message'));
                this.controller.setRecords();
                scope.$apply();
                expect(this.controller.recordsConfig.pageIndex).toBe(0);
                expect(catalogManagerSvc.getRecords).toHaveBeenCalledWith(catalogManagerSvc.localCatalog['@id'], this.controller.recordsConfig);
                expect(this.controller.recordsErrorMessage).toBe('Error retrieving ontologies');
            });
            it('successfully', function() {
                var headers = {
                    'x-total-count': 10
                };
                this.response.headers.and.returnValue(headers);
                var record = {'@id': 'record'};
                this.controller.selectedRecord = angular.copy(record);
                this.response.data.push(record);
                this.controller.setRecords();
                scope.$apply();
                expect(this.controller.recordsConfig.pageIndex).toBe(0);
                expect(catalogManagerSvc.getRecords).toHaveBeenCalledWith(catalogManagerSvc.localCatalog['@id'], this.controller.recordsConfig);
                expect(this.controller.records).toEqual(this.response.data);
                expect(this.controller.totalSize).toEqual(headers['x-total-count']);
                expect(this.controller.selectedRecord).toBe(record);
                expect(this.controller.recordsErrorMessage).toBe('');
            });
        });
        it('should set the initial list of ontology records', function() {
            spyOn(this.controller, 'setRecords');
            this.controller.currentPage = 10;
            this.controller.setInitialRecords();
            expect(this.controller.currentPage).toEqual(1);
            expect(this.controller.setRecords).toHaveBeenCalled();
        });
        describe('should select an ontology', function() {
            beforeEach(function() {
                this.record = {'@id': ''};
             });
            it('if it had been opened', function() {
                var openedState = {
                    recordId: this.record['@id'],
                    latest: {
                        classes: []
                    }
                };
                this.controller.ontologyStates.push(openedState);
                this.controller.selectOntology(this.record);
                expect(this.controller.selectedRecord).toBe(this.record);
                expect(this.controller.selectedOntologyState).toBe(openedState);
                expect(this.controller.selectedVersion).toBe('latest');
                expect(this.controller.classes).toBe(openedState.latest.classes);
                expect(this.controller.errorMessage).toBe('');
            });
            describe('if it had not been opened', function() {
                it('unless an error occurs', function() {
                    catalogManagerSvc.getRecordMasterBranch.and.returnValue($q.reject('Error message'));
                    this.controller.selectOntology(this.record);
                    scope.$apply();
                    expect(catalogManagerSvc.getRecordMasterBranch).toHaveBeenCalledWith(this.record['@id'], catalogManagerSvc.localCatalog['@id']);
                    expect(this.controller.errorMessage).toBe('Error retrieving ontology');
                    expect(this.controller.selectedRecord).toBeUndefined();
                    expect(this.controller.selectedOntologyState).toBeUndefined();
                    expect(this.controller.classes).toEqual([]);
                });
                it('successfully', function() {
                    var expectedState = {
                        recordId: this.record['@id'],
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
                    this.controller.selectOntology(this.record);
                    scope.$apply();
                    expect(this.controller.selectedRecord).toBe(this.record);
                    expect(catalogManagerSvc.getRecordMasterBranch).toHaveBeenCalledWith(this.record['@id'], catalogManagerSvc.localCatalog['@id']);
                    expect(utilSvc.getPropertyId).toHaveBeenCalledWith(jasmine.any(Object), prefixes.catalog + 'head');
                    expect(mappingManagerSvc.getOntology).toHaveBeenCalled();
                    expect(ontologyManagerSvc.getImportedOntologies).toHaveBeenCalledWith(expectedState.recordId, expectedState.branchId, expectedState.latest.commitId);
                    expect(this.controller.ontologyStates).toContain(expectedState);
                    expect(this.controller.selectedOntologyState).toEqual(expectedState);
                    expect(this.controller.selectedVersion).toBe('latest');
                    expect(this.controller.classes).toEqual(expectedState.latest.classes);
                    expect(this.controller.errorMessage).toBe('');
                });
            });
        });
        describe('should select a version', function() {
            it('unless an ontology has not been selected', function() {
                var selectedOntologyState = this.controller.selectedOntologyState;
                var classes = this.controller.classes;
                this.controller.selectVersion();
                expect(this.controller.selectedOntologyState).toBe(selectedOntologyState);
                expect(this.controller.classes).toBe(classes);
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
                    expect(this.controller.errorMessage).toBe('');
                    expect(this.controller.classes).toBe(this.controller.selectedOntologyState.latest.classes);
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
                            expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(selectedOntologyState.branchId, selectedOntologyState.recordId, catalogManagerSvc.localCatalog['@id']);
                            expect(this.controller.errorMessage).toBe('Error retrieving ontology');
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
                            expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(this.controller.selectedOntologyState.branchId, this.controller.selectedOntologyState.recordId, catalogManagerSvc.localCatalog['@id']);
                            expect(utilSvc.getPropertyId).toHaveBeenCalledWith({}, prefixes.catalog + 'head');
                            expect(mappingManagerSvc.getOntology).toHaveBeenCalled();
                            expect(ontologyManagerSvc.getImportedOntologies).toHaveBeenCalledWith(this.controller.selectedOntologyState.recordId, this.controller.selectedOntologyState.branchId, expectedVersion.commitId);
                            expect(this.controller.classes).toEqual(expectedVersion.classes);
                            expect(this.controller.selectedOntologyState.latest).toEqual(expectedVersion);
                            expect(this.controller.errorMessage).toBe('');
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
                            expect(this.controller.errorMessage).toBe('Error retrieving ontology');
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
                            expect(this.controller.errorMessage).toBe('');
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
                this.controller.selectedRecord = {'@id': this.ontologyInfo.recordId};
            });
            it('if it has not changed', function() {
                mappingManagerSvc.getSourceOntologyInfo.and.returnValue(this.ontologyInfo);
                this.controller.set();
                expect(mapperStateSvc.sourceOntologies).not.toEqual(this.controller.selectedOntologyState.latest.ontologies);
                expect(mappingManagerSvc.findIncompatibleMappings).not.toHaveBeenCalled();
                expect(mappingManagerSvc.setSourceOntologyInfo).not.toHaveBeenCalled();
                expect(mapperStateSvc.resetEdit).not.toHaveBeenCalled();
                expect(mapperStateSvc.setAvailableProps).not.toHaveBeenCalled();
                expect(mapperStateSvc.displayMappingConfigOverlay).toBe(false);
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
                });
                it('setting appropriate state', function() {
                    this.controller.set();
                    expect(mapperStateSvc.sourceOntologies).toEqual(this.controller.selectedOntologyState.latest.ontologies);
                    expect(mappingManagerSvc.setSourceOntologyInfo).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, this.ontologyInfo.recordId, this.ontologyInfo.branchId, this.ontologyInfo.commitId);
                    expect(mapperStateSvc.mapping.ontology).toBe(this.controller.selectedRecord);
                    expect(mapperStateSvc.changeProp).toHaveBeenCalledWith('mapping', prefixes.delim + 'sourceRecord', this.ontologyInfo.recordId, this.oldOntologyInfo.recordId, true);
                    expect(mapperStateSvc.changeProp).toHaveBeenCalledWith('mapping', prefixes.delim + 'sourceBranch', this.ontologyInfo.branchId, this.oldOntologyInfo.branchId, true);
                    expect(mapperStateSvc.changeProp).toHaveBeenCalledWith('mapping', prefixes.delim + 'sourceCommit', this.ontologyInfo.commitId, this.oldOntologyInfo.commitId, true);
                    expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                    expect(mapperStateSvc.setAvailableProps).toHaveBeenCalledWith(this.classMapping['@id']);
                    expect(mapperStateSvc.availableClasses).toEqual(this.controller.classes);
                    expect(mapperStateSvc.displayMappingConfigOverlay).toBe(false);
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
            expect(mapperStateSvc.displayMappingConfigOverlay).toBe(false);
        });
    });
    describe('replaces the eclement with the correct html', function() {
        beforeEach(function() {
            mapperStateSvc.mapping = {id: '', jsonld: []};
            this.compile();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('mapping-config-overlay')).toBe(true);
            expect(this.element.querySelectorAll('form.content').length).toBe(1);
            expect(this.element.querySelectorAll('.row').length).toBe(1);
            expect(this.element.querySelectorAll('.ontology-select-container').length).toBe(1);
            expect(this.element.querySelectorAll('.preview-display').length).toBe(1);
            expect(this.element.querySelectorAll('.ontology-records-list').length).toBe(1);
        });
        it('with a paging-details', function() {
            expect(this.element.find('paging-details').length).toBe(1);
        });
        it('with a pagination', function() {
            expect(this.element.find('pagination').length).toBe(1);
        });
        it('depending on whether an error has occured', function() {
            this.controller = this.element.controller('mappingConfigOverlay');
            expect(this.element.find('error-display').length).toBe(0);

            this.controller.errorMessage = 'test';
            scope.$digest();
            expect(this.element.find('error-display').length).toBe(1);
        });
        it('depending on whether an error has occured when retrieving the records', function() {
            this.controller = this.element.controller('mappingConfigOverlay');
            expect(this.element.find('error-display').length).toBe(0);

            this.controller.recordsErrorMessage = 'test';
            scope.$digest();
            expect(this.element.find('error-display').length).toBe(1);
        });
        it('depending on how many ontology records there are', function() {
            this.controller = this.element.controller('mappingConfigOverlay');
            this.controller.records = [{}];
            scope.$digest();
            expect(this.element.querySelectorAll('.ontology-records-list button').length).toBe(this.controller.records.length);
        });
        it('depending on whether an ontology record has been selected', function() {
            var ontologyInfo = this.element.querySelectorAll('.ontology-record-info');
            expect(ontologyInfo.length).toBe(0);

            this.controller = this.element.controller('mappingConfigOverlay');
            this.controller.selectedRecord = {'@id': ''};
            scope.$digest();
            ontologyInfo = this.element.querySelectorAll('.ontology-record-info');
            expect(ontologyInfo.length).toBe(1);
        });
        it('depending on which ontology record is selected', function() {
            var record = {'@id': ''};
            this.controller = this.element.controller('mappingConfigOverlay');
            this.controller.records = [record];
            scope.$digest();
            var recordItem = angular.element(this.element.querySelectorAll('.ontology-records-list button')[0]);
            expect(recordItem.hasClass('active')).toBe(false);

            this.controller.selectedRecord = record;
            scope.$digest();
            expect(recordItem.hasClass('active')).toBe(true);
        });
        it('depending on whether the selected ontology record has a saved version', function() {
            var options = this.element.querySelectorAll('.version-select option');
            expect(options.length).toBe(1);

            this.controller = this.element.controller('mappingConfigOverlay');
            this.controller.selectedOntologyState = {saved: {}};
            scope.$digest();
            options = this.element.querySelectorAll('.version-select option');
            expect(options.length).toBe(2);
        });
        it('depending on whether an ontology record state has been selected', function() {
            this.controller = this.element.controller('mappingConfigOverlay');
            var versionSelect = angular.element(this.element.querySelectorAll('.version-select')[0]);
            var setButton = angular.element(this.element.querySelectorAll('.btn-container button')[0]);
            expect(versionSelect.attr('disabled')).toBeTruthy();
            expect(setButton.attr('disabled')).toBeTruthy();

            this.controller.selectedOntologyState = {};
            scope.$digest();
            expect(versionSelect.attr('disabled')).toBeFalsy();
            expect(setButton.attr('disabled')).toBeFalsy();
        });
        it('with buttons to cancel and set', function() {
            var buttons = this.element.querySelectorAll('.btn-container button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Set']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Set']).toContain(angular.element(buttons[1]).text().trim());
        });
    });
    it('should class getRecords when the search button is clicked', function() {
        this.compile();
        spyOn(this.controller, 'setInitialRecords');

        var searchButton = angular.element(this.element.querySelectorAll('.record-search-bar button')[0]);
        searchButton.triggerHandler('click');
        expect(this.controller.setInitialRecords).toHaveBeenCalled();
    });
    it('should select an ontology record when clicked', function() {
        this.compile();
        this.controller.records = [{}];
        spyOn(this.controller, 'selectOntology');
        scope.$digest();

        var recordButton = angular.element(this.element.querySelectorAll('.ontology-records-list button')[0]);
        recordButton.triggerHandler('click');
        expect(this.controller.selectOntology).toHaveBeenCalled();
    });
    it('should call set when the button is clicked', function() {
        this.compile();
        spyOn(this.controller, 'set');

        var continueButton = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
        continueButton.triggerHandler('click');
        expect(this.controller.set).toHaveBeenCalled();
    });
    it('should call cancel when the button is clicked', function() {
        this.compile();
        spyOn(this.controller, 'cancel');

        var continueButton = angular.element(this.element.querySelectorAll('.btn-container button:not(.btn-primary)')[0]);
        continueButton.triggerHandler('click');
        expect(this.controller.cancel).toHaveBeenCalled();
    });
});
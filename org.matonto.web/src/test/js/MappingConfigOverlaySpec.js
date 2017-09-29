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
describe('Mapping Config Overlay directive', function() {
    var $compile, scope, $q, element, controller, utilSvc, ontologyManagerSvc, mappingManagerSvc, mapperStateSvc, catalogManagerSvc, prefixes, originalOntology, importedOntology, originalClassObj, importedClassObj;

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

        originalOntology = {id: 'original', entities: [{}]};
        importedOntology = {id: 'imported', ontology: []};
        originalClassObj = {'@id': 'original'};
        importedClassObj = {'@id': 'imported'};
        this.response = {
            data: [],
            headers: jasmine.createSpy('headers')
        };
        catalogManagerSvc.localCatalog = {'@id': ''};
        catalogManagerSvc.getRecords.and.returnValue($q.when(this.response));
        mapperStateSvc.mapping = {jsonld: [], difference: {additions: [], deletions: []}};
    });

    describe('should initialize with the correct values', function() {
        it('for the configuration for getting ontology records', function() {
            var sortOption = {field: prefixes.dcterms + 'title', asc: true};
            catalogManagerSvc.sortOptions = [sortOption];
            element = $compile(angular.element('<mapping-config-overlay></mapping-config-overlay>'))(scope);
            scope.$digest();
            controller = element.controller('mappingConfigOverlay');
            expect(controller.recordsConfig.pageIndex).toBe(0);
            expect(controller.recordsConfig.sortOption).toEqual(sortOption);
            expect(controller.recordsConfig.recordType).toEqual(prefixes.ontologyEditor + 'OntologyRecord');
            expect(controller.recordsConfig.limit).toEqual(10);
            expect(controller.recordsConfig.searchText).toEqual('');
        });
        it('for the list of ontology records', function() {
            var headers = {
                'x-total-count': 10,
                links: {
                    prev: 'prev',
                    next: 'next'
                }
            };
            this.response.headers.and.returnValue(headers);
            utilSvc.parseLinks.and.returnValue(headers.links);
            element = $compile(angular.element('<mapping-config-overlay></mapping-config-overlay>'))(scope);
            scope.$digest();
            controller = element.controller('mappingConfigOverlay');
            expect(catalogManagerSvc.getRecords).toHaveBeenCalledWith(catalogManagerSvc.localCatalog['@id'], controller.recordsConfig);
            expect(controller.records).toEqual(this.response.data);
            expect(controller.totalSize).toEqual(headers['x-total-count']);
            expect(controller.links).toEqual(headers.links);
        });
        it('if the mapping does not have an ontology set', function() {
            element = $compile(angular.element('<mapping-config-overlay></mapping-config-overlay>'))(scope);
            scope.$digest();
            controller = element.controller('mappingConfigOverlay');
            expect(controller.selectedRecord).toBeUndefined();
            expect(controller.ontologyStates).toEqual([]);
            expect(controller.selectedVersion).toBe('latest');
            expect(controller.selectedOntologyState).toBeUndefined();
            expect(controller.classes).toEqual([]);
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
                element = $compile(angular.element('<mapping-config-overlay></mapping-config-overlay>'))(scope);
                scope.$digest();
                controller = element.controller('mappingConfigOverlay');
                expect(catalogManagerSvc.getRecordMasterBranch).toHaveBeenCalledWith(this.ontology['@id'], catalogManagerSvc.localCatalog['@id']);
                expect(utilSvc.getPropertyId).toHaveBeenCalledWith(jasmine.any(Object), prefixes.catalog + 'head');
                expect(mappingManagerSvc.getSourceOntologyInfo).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld);
                expect(controller.selectedRecord).toEqual(this.ontology);
                expect(controller.ontologyStates).toContain(this.expectedState);
                expect(controller.selectedOntologyState).toEqual(this.expectedState);
                expect(controller.selectedVersion).toBe('latest');
                expect(controller.classes).toEqual(this.expectedVersion.classes);
            });
            it('and changes have been commited to the ontology since it was set', function() {
                mappingManagerSvc.getSourceOntologyInfo.and.returnValue({commitId: 'different'});
                this.expectedState.saved = _.set(angular.copy(this.expectedVersion), 'commitId', 'different');
                element = $compile(angular.element('<mapping-config-overlay></mapping-config-overlay>'))(scope);
                scope.$digest();
                controller = element.controller('mappingConfigOverlay');
                expect(controller.selectedRecord).toEqual(this.ontology);
                expect(controller.ontologyStates).toContain(this.expectedState);
                expect(controller.selectedOntologyState).toEqual(this.expectedState);
                expect(controller.selectedVersion).toBe('saved');
                expect(controller.classes).toEqual(this.expectedVersion.classes);
            });
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            element = $compile(angular.element('<mapping-config-overlay></mapping-config-overlay>'))(scope);
            scope.$digest();
            controller = element.controller('mappingConfigOverlay');
        });
        describe('should get the list of ontology records', function() {
            it('unless an error occurs', function() {
                catalogManagerSvc.getRecords.and.returnValue($q.reject('Error message'));
                controller.getRecords();
                scope.$apply();
                expect(controller.recordsConfig.pageIndex).toBe(0);
                expect(catalogManagerSvc.getRecords).toHaveBeenCalledWith(catalogManagerSvc.localCatalog['@id'], controller.recordsConfig);
                expect(controller.recordsErrorMessage).toBe('Error retrieving ontologies');
            });
            it('successfully', function() {
                var headers = {
                    'x-total-count': 10,
                    links: {
                        prev: 'prev',
                        next: 'next'
                    }
                };
                this.response.headers.and.returnValue(headers);
                utilSvc.parseLinks.and.returnValue(headers.links);
                var record = {'@id': 'record'};
                controller.selectedRecord = angular.copy(record);
                this.response.data.push(record);
                controller.getRecords();
                scope.$apply();
                expect(controller.recordsConfig.pageIndex).toBe(0);
                expect(catalogManagerSvc.getRecords).toHaveBeenCalledWith(catalogManagerSvc.localCatalog['@id'], controller.recordsConfig);
                expect(controller.records).toEqual(this.response.data);
                expect(controller.totalSize).toEqual(headers['x-total-count']);
                expect(controller.links).toEqual(headers.links);
                expect(controller.selectedRecord).toBe(record);
                expect(controller.recordsErrorMessage).toBe('');
            });
        });
        describe('should get a page of records', function() {
            beforeEach(function() {
                this.pageIndex = controller.recordsConfig.pageIndex;
                utilSvc.getResultsPage.and.returnValue($q.when(this.response));
            });
            it('unless an error occurs', function() {
                utilSvc.getResultsPage.and.returnValue($q.reject('Error message'));
                controller.getRecordPage('prev');
                scope.$apply();
                expect(utilSvc.getResultsPage).toHaveBeenCalledWith(jasmine.any(String));
                expect(controller.recordsErrorMessage).toBe('Error retrieving ontologies');
                expect(controller.recordsConfig.pageIndex).toBe(this.pageIndex);
                expect(controller.records).toEqual(this.response.data);
            });
            it('if the direction is previous', function() {
                controller.getRecordPage('prev');
                scope.$apply();
                expect(utilSvc.getResultsPage).toHaveBeenCalledWith(controller.links.prev);
                expect(controller.recordsConfig.pageIndex).toBe(this.pageIndex - 1);
                expect(controller.records).toEqual(this.response.data);
                expect(controller.recordsErrorMessage).toBe('');
            });
            it('if the direction is next', function() {
                controller.getRecordPage('next');
                scope.$apply();
                expect(utilSvc.getResultsPage).toHaveBeenCalledWith(controller.links.next);
                expect(controller.recordsConfig.pageIndex).toBe(this.pageIndex + 1);
                expect(controller.records).toEqual(this.response.data);
                expect(controller.recordsErrorMessage).toBe('');
            });
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
                controller.ontologyStates.push(openedState);
                controller.selectOntology(this.record);
                expect(controller.selectedRecord).toBe(this.record);
                expect(controller.selectedOntologyState).toBe(openedState);
                expect(controller.selectedVersion).toBe('latest');
                expect(controller.classes).toBe(openedState.latest.classes);
                expect(controller.errorMessage).toBe('');
            });
            describe('if it had not been opened', function() {
                it('unless an error occurs', function() {
                    catalogManagerSvc.getRecordMasterBranch.and.returnValue($q.reject('Error message'));
                    controller.selectOntology(this.record);
                    scope.$apply();
                    expect(catalogManagerSvc.getRecordMasterBranch).toHaveBeenCalledWith(this.record['@id'], catalogManagerSvc.localCatalog['@id']);
                    expect(controller.errorMessage).toBe('Error retrieving ontology');
                    expect(controller.selectedRecord).toBeUndefined();
                    expect(controller.selectedOntologyState).toBeUndefined();
                    expect(controller.classes).toEqual([]);
                });
                it('successfully', function() {
                    var expectedState = {
                        recordId: this.record['@id'],
                        branchId: '',
                        latest: {
                            commitId: '',
                            ontologies: [originalOntology, {id: importedOntology.id, entities: importedOntology.ontology}],
                            classes: [{ontologyId: 'original', classObj: originalClassObj}, {ontologyId: 'imported', classObj: importedClassObj}]
                        }
                    };
                    utilSvc.getPropertyId.and.returnValue(expectedState.latest.commitId);
                    mappingManagerSvc.getOntology.and.returnValue($q.when(originalOntology));
                    mapperStateSvc.getClasses.and.returnValue(expectedState.latest.classes);
                    ontologyManagerSvc.getImportedOntologies.and.returnValue($q.when([importedOntology]));
                    catalogManagerSvc.getRecordMasterBranch.and.returnValue($q.when({'@id': expectedState.branchId}));
                    controller.selectOntology(this.record);
                    scope.$apply();
                    expect(controller.selectedRecord).toBe(this.record);
                    expect(catalogManagerSvc.getRecordMasterBranch).toHaveBeenCalledWith(this.record['@id'], catalogManagerSvc.localCatalog['@id']);
                    expect(utilSvc.getPropertyId).toHaveBeenCalledWith(jasmine.any(Object), prefixes.catalog + 'head');
                    expect(mappingManagerSvc.getOntology).toHaveBeenCalled();
                    expect(ontologyManagerSvc.getImportedOntologies).toHaveBeenCalledWith(expectedState.recordId, expectedState.branchId, expectedState.latest.commitId);
                    expect(controller.ontologyStates).toContain(expectedState);
                    expect(controller.selectedOntologyState).toEqual(expectedState);
                    expect(controller.selectedVersion).toBe('latest');
                    expect(controller.classes).toEqual(expectedState.latest.classes);
                    expect(controller.errorMessage).toBe('');
                });
            });
        });
        describe('should select a version', function() {
            it('unless an ontology has not been selected', function() {
                var selectedOntologyState = controller.selectedOntologyState;
                var classes = controller.classes;
                controller.selectVersion();
                expect(controller.selectedOntologyState).toBe(selectedOntologyState);
                expect(controller.classes).toBe(classes);
            });
            describe('of the selected ontology', function() {
                beforeEach(function() {
                    controller.selectedOntologyState = {
                        recordId: '',
                        branchId: ''
                    };
                });
                it('if the version has already been opened', function() {
                    controller.selectedOntologyState.latest = {classes: []};
                    controller.selectedVersion = 'latest';
                    controller.selectVersion();
                    expect(controller.errorMessage).toBe('');
                    expect(controller.classes).toBe(controller.selectedOntologyState.latest.classes);
                });
                describe('if the', function() {
                    beforeEach(function() {
                        mappingManagerSvc.getOntology.and.returnValue($q.when(originalOntology));
                        mapperStateSvc.getClasses.and.returnValue([{ontologyId: 'original', classObj: originalClassObj}, {ontologyId: 'imported', classObj: importedClassObj}]);
                        ontologyManagerSvc.getImportedOntologies.and.returnValue($q.when([importedOntology]));
                    });
                    describe('latest version has not been opened yet', function() {
                        beforeEach(function() {
                            controller.selectedVersion = 'latest';
                        });
                        it('unless an error occurs', function() {
                            var selectedOntologyState = angular.copy(controller.selectedOntologyState);
                            catalogManagerSvc.getRecordBranch.and.returnValue($q.reject('Error message'));
                            controller.selectVersion();
                            scope.$apply();
                            expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(selectedOntologyState.branchId, selectedOntologyState.recordId, catalogManagerSvc.localCatalog['@id']);
                            expect(controller.errorMessage).toBe('Error retrieving ontology');
                            expect(controller.selectedRecord).toBeUndefined();
                            expect(controller.selectedOntologyState).toBeUndefined();
                            expect(controller.classes).toEqual([]);
                        });
                        it('successfully', function() {
                            var expectedVersion = {
                                commitId: '',
                                ontologies: [originalOntology, {id: importedOntology.id, entities: importedOntology.ontology}],
                                classes: [{ontologyId: 'original', classObj: originalClassObj}, {ontologyId: 'imported', classObj: importedClassObj}]
                            };
                            catalogManagerSvc.getRecordBranch.and.returnValue($q.when({}));
                            utilSvc.getPropertyId.and.returnValue(expectedVersion.commitId);
                            controller.selectVersion();
                            scope.$apply();
                            expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(controller.selectedOntologyState.branchId, controller.selectedOntologyState.recordId, catalogManagerSvc.localCatalog['@id']);
                            expect(utilSvc.getPropertyId).toHaveBeenCalledWith({}, prefixes.catalog + 'head');
                            expect(mappingManagerSvc.getOntology).toHaveBeenCalled();
                            expect(ontologyManagerSvc.getImportedOntologies).toHaveBeenCalledWith(controller.selectedOntologyState.recordId, controller.selectedOntologyState.branchId, expectedVersion.commitId);
                            expect(controller.classes).toEqual(expectedVersion.classes);
                            expect(controller.selectedOntologyState.latest).toEqual(expectedVersion);
                            expect(controller.errorMessage).toBe('');
                        });
                    });
                    describe('saved version has not been opened yet', function() {
                        beforeEach(function() {
                            controller.selectedVersion = 'saved';
                            this.ontologyInfo = {
                                branchId: '',
                                commitId: '',
                                recordId: ''
                            };
                            mappingManagerSvc.getSourceOntologyInfo.and.returnValue(this.ontologyInfo);
                        });
                        it('unless an error occurs', function() {
                            mappingManagerSvc.getOntology.and.returnValue($q.reject('Error message'));
                            controller.selectVersion();
                            scope.$apply();
                            expect(mappingManagerSvc.getSourceOntologyInfo).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld);
                            expect(mappingManagerSvc.getOntology).toHaveBeenCalledWith(this.ontologyInfo);
                            expect(controller.errorMessage).toBe('Error retrieving ontology');
                            expect(controller.selectedRecord).toBeUndefined();
                            expect(controller.selectedOntologyState).toBeUndefined();
                            expect(controller.classes).toEqual([]);
                        });
                        it('successfully', function() {
                            var expectedVersion = {
                                commitId: this.ontologyInfo.commitId,
                                ontologies: [originalOntology, {id: importedOntology.id, entities: importedOntology.ontology}],
                                classes: [{ontologyId: 'original', classObj: originalClassObj}, {ontologyId: 'imported', classObj: importedClassObj}]
                            };
                            controller.selectVersion();
                            scope.$apply();
                            expect(mappingManagerSvc.getSourceOntologyInfo).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld);
                            expect(mappingManagerSvc.getOntology).toHaveBeenCalledWith(this.ontologyInfo);
                            expect(ontologyManagerSvc.getImportedOntologies).toHaveBeenCalledWith(this.ontologyInfo.recordId, this.ontologyInfo.branchId, this.ontologyInfo.commitId);
                            expect(controller.classes).toEqual(expectedVersion.classes);
                            expect(controller.selectedOntologyState.saved).toEqual(expectedVersion);
                            expect(controller.errorMessage).toBe('');
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
                controller.selectedOntologyState = {
                    recordId: this.ontologyInfo.recordId,
                    branchId: this.ontologyInfo.branchId,
                    latest: {
                        commitId: this.ontologyInfo.commitId,
                        ontologies: [{}]
                    }
                };
                controller.selectedVersion = 'latest';
                controller.selectedRecord = {'@id': this.ontologyInfo.recordId};
            });
            it('if it has not changed', function() {
                mappingManagerSvc.getSourceOntologyInfo.and.returnValue(this.ontologyInfo);
                controller.set();
                expect(mapperStateSvc.sourceOntologies).not.toEqual(controller.selectedOntologyState.latest.ontologies);
                expect(mappingManagerSvc.findIncompatibleMappings).not.toHaveBeenCalled();
                expect(mappingManagerSvc.setSourceOntologyInfo).not.toHaveBeenCalled();
                expect(mapperStateSvc.resetEdit).not.toHaveBeenCalled();
                expect(mapperStateSvc.setAvailableProps).not.toHaveBeenCalled();
                expect(mapperStateSvc.displayMappingConfigOverlay).toBe(false);
            });
            describe('if it changed', function() {
                beforeEach(function() {
                    this.classMapping = {'@id': 'classMapping'};
                    mappingManagerSvc.getAllClassMappings.and.returnValue([this.classMapping]);
                    controller.classes = [{classObj: {'@id': 'class1'}}, {classObj: {'@id': 'class2'}}];
                    mappingManagerSvc.getClassIdByMapping.and.returnValue('class1');
                });
                it('setting appropriate state', function() {
                    controller.set();
                    expect(mapperStateSvc.sourceOntologies).toEqual(controller.selectedOntologyState.latest.ontologies);
                    expect(mappingManagerSvc.setSourceOntologyInfo).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, this.ontologyInfo.recordId, this.ontologyInfo.branchId, this.ontologyInfo.commitId);
                    expect(mapperStateSvc.mapping.ontology).toBe(controller.selectedRecord);
                    expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                    expect(mapperStateSvc.setAvailableProps).toHaveBeenCalledWith(this.classMapping['@id']);
                    expect(mapperStateSvc.availableClasses).toEqual([{classObj: {'@id': 'class2'}}]);
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
                            controller.set();
                            expect(mappingManagerSvc.findClassWithDataMapping).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, this.badMapping['@id']);
                            expect(mappingManagerSvc.findClassWithObjectMapping).not.toHaveBeenCalled();
                            expect(mapperStateSvc.deleteProp).toHaveBeenCalledWith(this.badMapping['@id'], this.classMapping['@id']);
                        });
                        it('for object properties', function() {
                            mappingManagerSvc.isDataMapping.and.returnValue(false);
                            controller.set();
                            expect(mappingManagerSvc.findClassWithDataMapping).not.toHaveBeenCalled();
                            expect(mappingManagerSvc.findClassWithObjectMapping).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, this.badMapping['@id']);
                            expect(mapperStateSvc.deleteProp).toHaveBeenCalledWith(this.badMapping['@id'], this.classMapping['@id']);
                        });
                    });
                    it('if they are class mappings', function() {
                        mappingManagerSvc.isPropertyMapping.and.returnValue(false);
                        mappingManagerSvc.isClassMapping.and.returnValue(true);
                        controller.set();
                        expect(mapperStateSvc.deleteClass).toHaveBeenCalledWith(this.badMapping['@id']);
                    });
                });
            });
        });
        it('should set the correct state for canceling', function() {
            controller.cancel();
            expect(mapperStateSvc.displayMappingConfigOverlay).toBe(false);
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            mapperStateSvc.mapping = {id: '', jsonld: []};
            element = $compile(angular.element('<mapping-config-overlay></mapping-config-overlay>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(element.hasClass('mapping-config-overlay')).toBe(true);
            expect(element.querySelectorAll('form.content').length).toBe(1);
            expect(element.querySelectorAll('.row').length).toBe(1);
            expect(element.querySelectorAll('.ontology-select-container').length).toBe(1);
            expect(element.querySelectorAll('.preview-display').length).toBe(1);
            expect(element.querySelectorAll('.ontology-records-list').length).toBe(1);
        });
        it('with a paging-details', function() {
            expect(element.find('paging-details').length).toBe(1);
        });
        it('with a pagination', function() {
            expect(element.find('pagination').length).toBe(1);
        });
        it('depending on whether an error has occured', function() {
            controller = element.controller('mappingConfigOverlay');
            expect(element.find('error-display').length).toBe(0);

            controller.errorMessage = 'test';
            scope.$digest();
            expect(element.find('error-display').length).toBe(1);
        });
        it('depending on whether an error has occured when retrieving the records', function() {
            controller = element.controller('mappingConfigOverlay');
            expect(element.find('error-display').length).toBe(0);

            controller.recordsErrorMessage = 'test';
            scope.$digest();
            expect(element.find('error-display').length).toBe(1);
        });
        it('depending on how many ontology records there are', function() {
            controller = element.controller('mappingConfigOverlay');
            controller.records = [{}];
            scope.$digest();
            expect(element.querySelectorAll('.ontology-records-list button').length).toBe(controller.records.length);
        });
        it('depending on whether an ontology record has been selected', function() {
            var ontologyInfo = element.querySelectorAll('.ontology-record-info');
            expect(ontologyInfo.length).toBe(0);

            controller = element.controller('mappingConfigOverlay');
            controller.selectedRecord = {'@id': ''};
            scope.$digest();
            ontologyInfo = element.querySelectorAll('.ontology-record-info');
            expect(ontologyInfo.length).toBe(1);
        });
        it('depending on which ontology record is selected', function() {
            var record = {'@id': ''};
            controller = element.controller('mappingConfigOverlay');
            controller.records = [record];
            scope.$digest();
            var recordItem = angular.element(element.querySelectorAll('.ontology-records-list button')[0]);
            expect(recordItem.hasClass('active')).toBe(false);

            controller.selectedRecord = record;
            scope.$digest();
            expect(recordItem.hasClass('active')).toBe(true);
        });
        it('depending on whether the selected ontology record has a saved version', function() {
            var options = element.querySelectorAll('.version-select option');
            expect(options.length).toBe(1);

            controller = element.controller('mappingConfigOverlay');
            controller.selectedOntologyState = {saved: {}};
            scope.$digest();
            options = element.querySelectorAll('.version-select option');
            expect(options.length).toBe(2);
        });
        it('depending on whether an ontology record state has been selected', function() {
            controller = element.controller('mappingConfigOverlay');
            var versionSelect = angular.element(element.querySelectorAll('.version-select')[0]);
            var setButton = angular.element(element.querySelectorAll('.btn-container button')[0]);
            expect(versionSelect.attr('disabled')).toBeTruthy();
            expect(setButton.attr('disabled')).toBeTruthy();

            controller.selectedOntologyState = {};
            scope.$digest();
            expect(versionSelect.attr('disabled')).toBeFalsy();
            expect(setButton.attr('disabled')).toBeFalsy();
        });
        it('with buttons to cancel and set', function() {
            var buttons = element.querySelectorAll('.btn-container button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Set']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Set']).toContain(angular.element(buttons[1]).text().trim());
        });
    });
    it('should class getRecords when the search button is clicked', function() {
        element = $compile(angular.element('<mapping-config-overlay></mapping-config-overlay>'))(scope);
        scope.$digest();
        controller = element.controller('mappingConfigOverlay');
        spyOn(controller, 'getRecords');

        var searchButton = angular.element(element.querySelectorAll('.record-search-bar button')[0]);
        searchButton.triggerHandler('click');
        expect(controller.getRecords).toHaveBeenCalled();
    });
    it('should select an ontology record when clicked', function() {
        element = $compile(angular.element('<mapping-config-overlay></mapping-config-overlay>'))(scope);
        scope.$digest();
        controller = element.controller('mappingConfigOverlay');
        controller.records = [{}];
        spyOn(controller, 'selectOntology');
        scope.$digest();

        var recordButton = angular.element(element.querySelectorAll('.ontology-records-list button')[0]);
        recordButton.triggerHandler('click');
        expect(controller.selectOntology).toHaveBeenCalled();
    });
    it('should call set when the button is clicked', function() {
        element = $compile(angular.element('<mapping-config-overlay></mapping-config-overlay>'))(scope);
        scope.$digest();
        controller = element.controller('mappingConfigOverlay');
        spyOn(controller, 'set');

        var continueButton = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
        continueButton.triggerHandler('click');
        expect(controller.set).toHaveBeenCalled();
    });
    it('should call cancel when the button is clicked', function() {
        element = $compile(angular.element('<mapping-config-overlay></mapping-config-overlay>'))(scope);
        scope.$digest();
        controller = element.controller('mappingConfigOverlay');
        spyOn(controller, 'cancel');

        var continueButton = angular.element(element.querySelectorAll('.btn-container button.btn-default')[0]);
        continueButton.triggerHandler('click');
        expect(controller.cancel).toHaveBeenCalled();
    });
});
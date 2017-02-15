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
    var $compile,
        scope,
        $q,
        element,
        controller,
        utilSvc,
        ontologyManagerSvc,
        mappingManagerSvc,
        mapperStateSvc,
        catalogManagerSvc,
        prefixes,
        originalOntology,
        importedOntology,
        originalClassObj,
        importedClassObj;

    beforeEach(function() {
        module('templates');
        module('mappingConfigOverlay');
        mockUtil();
        mockOntologyManager();
        mockMappingManager();
        mockMapperState();
        mockCatalogManager();
        mockPrefixes();
        injectSplitIRIFilter();
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
        mapperStateSvc.mapping = {jsonld: []};
    });

    describe('should initialize with the correct values', function() {
        it('for the configuration for getting ontology records', function() {
            var sortOption = {field: prefixes.dcterms + 'title', ascending: true};
            catalogManagerSvc.sortOptions = [sortOption];
            element = $compile(angular.element('<mapping-config-overlay></mapping-config-overlay>'))(scope);
            scope.$digest();
            controller = element.controller('mappingConfigOverlay');
            expect(controller.recordsConfig.pageIndex).toBe(0);
            expect(controller.recordsConfig.sortOption).toEqual(sortOption);
            expect(controller.recordsConfig.recordType).toEqual(prefixes.catalog + 'OntologyRecord');
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
        it('if the mapping does not have a record set', function() {
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
                this.record = {'@id': ''};
                this.classObj = {'@id': 'class'};
                mapperStateSvc.mapping.record = this.record;
                mapperStateSvc.sourceOntologies = [{id: ''}];
                this.expectedState = {
                    recordId: this.record['@id'],
                    branchId: ''
                };
                this.expectedVersion = {
                    commitId: '',
                    ontologies: mapperStateSvc.sourceOntologies,
                    classes: [{ontologyId: '', classObj: this.classObj}]
                };
                utilSvc.getDctermsValue.and.returnValue('');
                mapperStateSvc.getClasses.and.returnValue(this.expectedVersion.classes);
                mappingManagerSvc.getClassIdByMapping.and.returnValue(this.classObj['@id']);
                catalogManagerSvc.getRecordMasterBranch.and.returnValue($q.when({'@id': this.expectedState.branchId}));
                catalogManagerSvc.getBranchHeadCommit.and.returnValue($q.when({commit: {'@id': this.expectedVersion.commitId}}));
            });
            it('and no changes have been commited to the record since it was set', function() {
                mappingManagerSvc.getSourceOntologyInfo.and.returnValue({commitId: this.expectedVersion.commitId});
                this.expectedState.latest = this.expectedVersion;
                element = $compile(angular.element('<mapping-config-overlay></mapping-config-overlay>'))(scope);
                scope.$digest();
                controller = element.controller('mappingConfigOverlay');
                expect(controller.selectedRecord).toEqual(this.record);
                expect(controller.ontologyStates).toContain(this.expectedState);
                expect(controller.selectedOntologyState).toEqual(this.expectedState);
                expect(controller.selectedVersion).toBe('latest');
                expect(controller.classes).toEqual(this.expectedVersion.classes);
            });
            it('and changes have been commited to the record since it was set', function() {
                mappingManagerSvc.getSourceOntologyInfo.and.returnValue({commitId: 'different'});
                this.expectedState.saved = this.expectedVersion;
                element = $compile(angular.element('<mapping-config-overlay></mapping-config-overlay>'))(scope);
                scope.$digest();
                controller = element.controller('mappingConfigOverlay');
                expect(controller.selectedRecord).toEqual(this.record);
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
                expect(controller.errorMessage).toBe('Error message');
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
                expect(controller.errorMessage).toBe('');
            });
        });
        describe('should get a page of records', function() {
            beforeEach(function() {
                this.pageIndex = controller.recordsConfig.pageIndex;
            })
            it('unless an error occurs', function() {
                catalogManagerSvc.getResultsPage.and.returnValue($q.reject('Error message'));
                controller.getRecordPage('prev');
                scope.$apply();
                expect(catalogManagerSvc.getResultsPage).toHaveBeenCalled();
                expect(controller.errorMessage).toBe('Error message');
                expect(controller.recordsConfig.pageIndex).toBe(this.pageIndex);
                expect(controller.records).toEqual(this.response.data);
            });
            it('if the direction is previous', function() {
                catalogManagerSvc.getResultsPage.and.returnValue($q.when(this.response));
                controller.getRecordPage('prev');
                scope.$apply();
                expect(catalogManagerSvc.getResultsPage).toHaveBeenCalledWith(controller.links.prev);
                expect(controller.recordsConfig.pageIndex).toBe(this.pageIndex - 1);
                expect(controller.records).toEqual(this.response.data);
                expect(controller.errorMessage).toBe('');
            });
            it('if the direction is next', function() {
                catalogManagerSvc.getResultsPage.and.returnValue($q.when(this.response));
                controller.getRecordPage('next');
                scope.$apply();
                expect(catalogManagerSvc.getResultsPage).toHaveBeenCalledWith(controller.links.next);
                expect(controller.recordsConfig.pageIndex).toBe(this.pageIndex + 1);
                expect(controller.records).toEqual(this.response.data);
                expect(controller.errorMessage).toBe('');
            });
        });
        describe('should select an ontology', function() {
            beforeEach(function() {
                controller.selectedRecord = {'@id': ''};
             });
            it('if it had been opened', function() {
                var openedState = {
                    recordId: controller.selectedRecord['@id'],
                    latest: {
                        classes: []
                    }
                };
                controller.ontologyStates.push(openedState);
                controller.selectOntology();
                expect(controller.selectedOntologyState).toBe(openedState);
                expect(controller.selectedVersion).toBe('latest');
                expect(controller.classes).toBe(openedState.latest.classes);
                expect(controller.errorMessage).toBe('');
            });
            describe('if it had not been opened', function() {
                it('unless an error occurs', function() {
                    catalogManagerSvc.getRecordMasterBranch.and.returnValue($q.reject('Error message'));
                    controller.selectOntology();
                    scope.$apply();
                    expect(catalogManagerSvc.getRecordMasterBranch).toHaveBeenCalledWith(controller.selectedRecord['@id'], catalogManagerSvc.localCatalog['@id']);
                    expect(controller.errorMessage).toBe('Error message');
                });
                it('successfully', function() {
                    var expectedState = {
                        recordId: controller.selectedRecord['@id'],
                        branchId: '',
                        latest: {
                            commitId: '',
                            ontologies: [originalOntology, {id: importedOntology.id, entities: importedOntology.ontology}],
                            classes: [{ontologyId: 'original', classObj: originalClassObj}, {ontologyId: 'imported', classObj: importedClassObj}]
                        }
                    };
                    mappingManagerSvc.getOntology.and.returnValue($q.when(originalOntology));
                    mapperStateSvc.getClasses.and.returnValue(expectedState.latest.classes);
                    ontologyManagerSvc.getImportedOntologies.and.returnValue($q.when([importedOntology]));
                    catalogManagerSvc.getRecordMasterBranch.and.returnValue($q.when({'@id': expectedState.branchId}));
                    catalogManagerSvc.getBranchHeadCommit.and.returnValue($q.when({commit: {'@id': expectedState.latest.commitId}}));
                    controller.selectOntology();
                    scope.$apply();
                    expect(catalogManagerSvc.getRecordMasterBranch).toHaveBeenCalledWith(controller.selectedRecord['@id'], catalogManagerSvc.localCatalog['@id']);
                    expect(catalogManagerSvc.getBranchHeadCommit).toHaveBeenCalledWith(expectedState.branchId, controller.selectedRecord['@id'], catalogManagerSvc.localCatalog['@id']);
                    expect(mappingManagerSvc.getOntology).toHaveBeenCalled();
                    expect(ontologyManagerSvc.getImportedOntologies).toHaveBeenCalledWith('', expectedState.branchId, expectedState.latest.commitId);
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
                            catalogManagerSvc.getBranchHeadCommit.and.returnValue($q.reject('Error message'));
                            controller.selectVersion();
                            scope.$apply();
                            expect(catalogManagerSvc.getBranchHeadCommit).toHaveBeenCalledWith(controller.selectedOntologyState.branchId, controller.selectedOntologyState.recordId, catalogManagerSvc.localCatalog['@id']);
                            expect(controller.errorMessage).toBe('Error message');
                        });
                        it('successfully', function() {
                            var expectedVersion = {
                                commitId: '',
                                ontologies: [originalOntology, {id: importedOntology.id, entities: importedOntology.ontology}],
                                classes: [{ontologyId: 'original', classObj: originalClassObj}, {ontologyId: 'imported', classObj: importedClassObj}]
                            };
                            catalogManagerSvc.getBranchHeadCommit.and.returnValue($q.when({commit: {'@id': expectedVersion.commitId}}));
                            controller.selectVersion();
                            scope.$apply();
                            expect(catalogManagerSvc.getBranchHeadCommit).toHaveBeenCalledWith(controller.selectedOntologyState.branchId, controller.selectedOntologyState.recordId, catalogManagerSvc.localCatalog['@id']);
                            expect(mappingManagerSvc.getOntology).toHaveBeenCalled();
                            expect(ontologyManagerSvc.getImportedOntologies).toHaveBeenCalledWith('', controller.selectedOntologyState.branchId, expectedVersion.commitId);
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
                                ontologyId: ''
                            };
                            mappingManagerSvc.getSourceOntologyInfo.and.returnValue(this.ontologyInfo);
                        });
                        it('unless an error occurs', function() {
                            mappingManagerSvc.getOntology.and.returnValue($q.reject('Error message'));
                            controller.selectVersion();
                            scope.$apply();
                            expect(mappingManagerSvc.getSourceOntologyInfo).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld);
                            expect(mappingManagerSvc.getOntology).toHaveBeenCalledWith(this.ontologyInfo);
                            expect(controller.errorMessage).toBe('Error message');
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
                            expect(ontologyManagerSvc.getImportedOntologies).toHaveBeenCalledWith(this.ontologyInfo.ontologyId, this.ontologyInfo.branchId, this.ontologyInfo.commitId);
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
                    ontologyId: ''
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
                expect(mapperStateSvc.changedMapping).toBe(false);
            });
            describe('if it changed', function() {
                beforeEach(function() {
                    mapperStateSvc.invalidProps = [''];
                    /*this.classMapping = {'@id': 'classMapping'};
                    mappingManagerSvc.getAllClassMappings.and.returnValue([this.classMapping]);*/
                });
                it('for the first time', function() {
                    controller.set();
                    expect(mappingManagerSvc.createNewMapping).not.toHaveBeenCalled();
                    expect(mapperStateSvc.invalidProps).toEqual(['']);
                    expect(mappingManagerSvc.setSourceOntologyInfo).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, this.ontologyInfo.ontologyId, this.ontologyInfo.recordId, this.ontologyInfo.branchId, this.ontologyInfo.commitId);
                    expect(mapperStateSvc.mapping.record).toBe(controller.selectedRecord);
                    expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                    expect(mapperStateSvc.availableClasses).toEqual(controller.classes);
                    // expect(mapperStateSvc.setAvailableProps).toHaveBeenCalledWith(this.classMapping['@id']);
                    expect(mapperStateSvc.displayMappingConfigOverlay).toBe(false);
                    expect(mapperStateSvc.changedMapping).toBe(true);
                });
                it('from a previous setting', function() {
                    mappingManagerSvc.getSourceOntologyInfo.and.returnValue({test: true});
                    var ontology = {entities: []};
                    controller.set();
                    expect(mappingManagerSvc.createNewMapping).toHaveBeenCalledWith(mapperStateSvc.mapping.id);
                    expect(mapperStateSvc.invalidProps).toEqual([]);
                    expect(mappingManagerSvc.setSourceOntologyInfo).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, this.ontologyInfo.ontologyId, this.ontologyInfo.recordId, this.ontologyInfo.branchId, this.ontologyInfo.commitId);
                    expect(mapperStateSvc.mapping.record).toBe(controller.selectedRecord);
                    expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                    expect(mapperStateSvc.availableClasses).toEqual(controller.classes);
                    // expect(mapperStateSvc.setAvailableProps).toHaveBeenCalledWith(this.classMapping['@id']);
                    expect(mapperStateSvc.displayMappingConfigOverlay).toBe(false);
                    expect(mapperStateSvc.changedMapping).toBe(true);
                });
                /*it('and an existing base type was selected', function() {
                    mappingManagerSvc.getClassMappingsByClassId.and.returnValue([this.classMapping]);
                    controller.set();
                    expect(mapperStateSvc.sourceOntologies).toBe(controller.selectedOntologyState.latest.ontologies);
                    expect(mappingManagerSvc.findIncompatibleMappings).toHaveBeenCalled();
                    expect(mappingManagerSvc.setSourceOntologyInfo).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, this.ontologyInfo.ontologyId, this.ontologyInfo.recordId, this.ontologyInfo.branchId, this.ontologyInfo.commitId);
                    expect(mapperStateSvc.mapping.record).toBe(controller.selectedRecord);
                    expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                    expect(mappingManagerSvc.getClassMappingsByClassId).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, controller.selectedBaseClass['@id']);
                    expect(mappingManagerSvc.findSourceOntologyWithClass).not.toHaveBeenCalled();
                    expect(mappingManagerSvc.addClass).not.toHaveBeenCalled();
                    expect(mapperStateSvc.selectedClassMappingId).toBe(this.classMapping['@id']);
                    expect(mapperStateSvc.setAvailableProps).toHaveBeenCalledWith(this.classMapping['@id']);
                    expect(mapperStateSvc.displayMappingConfigOverlay).toBe(false);
                });
                it('and a new base type was selected', function() {
                    var ontology = {entities: []};
                    mappingManagerSvc.addClass.and.returnValue(this.classMapping);
                    mappingManagerSvc.findSourceOntologyWithClass.and.returnValue(ontology);
                    controller.set();
                    expect(mapperStateSvc.sourceOntologies).toBe(controller.selectedOntologyState.latest.ontologies);
                    expect(mappingManagerSvc.findIncompatibleMappings).toHaveBeenCalled();
                    expect(mappingManagerSvc.setSourceOntologyInfo).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, this.ontologyInfo.ontologyId, this.ontologyInfo.recordId, this.ontologyInfo.branchId, this.ontologyInfo.commitId);
                    expect(mapperStateSvc.mapping.record).toBe(controller.selectedRecord);
                    expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                    expect(mappingManagerSvc.getClassMappingsByClassId).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, controller.selectedBaseClass['@id']);
                    expect(mappingManagerSvc.findSourceOntologyWithClass).toHaveBeenCalledWith(controller.selectedBaseClass['@id'], controller.selectedOntologyState.latest.ontologies);
                    expect(mappingManagerSvc.addClass).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, ontology.entities, controller.selectedBaseClass['@id']);
                    expect(mapperStateSvc.selectedClassMappingId).toBe(this.classMapping['@id']);
                    expect(mapperStateSvc.setAvailableProps).toHaveBeenCalledWith(this.classMapping['@id']);
                    expect(mapperStateSvc.displayMappingConfigOverlay).toBe(false);
                    expect(mapperStateSvc.changedMapping).toBe(true);
                });
                describe('removing incompatible mappings', function() {
                    beforeEach(function() {
                        this.badMapping = {'@id': 'bad'};
                        mappingManagerSvc.findIncompatibleMappings.and.returnValue([this.badMapping])
                    });
                    describe('if they are property mappings', function() {
                        beforeEach(function() {
                            mappingManagerSvc.isPropertyMapping.and.returnValue(true);
                            mapperStateSvc.invalidProps = [this.badMapping];
                            mappingManagerSvc.findClassWithDataMapping.and.returnValue(this.classMapping);
                            mappingManagerSvc.findClassWithObjectMapping.and.returnValue(this.classMapping);
                        });
                        it('for data properties', function() {
                            mappingManagerSvc.isDataMapping.and.returnValue(true);
                            controller.set();
                            expect(mappingManagerSvc.findClassWithDataMapping).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, this.badMapping['@id']);
                            expect(mappingManagerSvc.findClassWithObjectMapping).not.toHaveBeenCalled();
                            expect(mappingManagerSvc.removeProp).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, this.classMapping['@id'], this.badMapping['@id']);
                            expect(mapperStateSvc.invalidProps).toEqual([]);
                        });
                        it('for object properties', function() {
                            mappingManagerSvc.isDataMapping.and.returnValue(false);
                            controller.set();
                            expect(mappingManagerSvc.findClassWithDataMapping).not.toHaveBeenCalled();
                            expect(mappingManagerSvc.findClassWithObjectMapping).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, this.badMapping['@id']);
                            expect(mappingManagerSvc.removeProp).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, this.classMapping['@id'], this.badMapping['@id']);
                            expect(mapperStateSvc.invalidProps).toEqual([]);
                        });
                    });
                    it('if they are class mappings', function() {
                        mappingManagerSvc.isPropertyMapping.and.returnValue(false);
                        mappingManagerSvc.isClassMapping.and.returnValue(true);
                        controller.set();
                        expect(mappingManagerSvc.removeClass).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, this.badMapping['@id']);
                    });
                });*/
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
            expect(element.querySelectorAll('.row').length).toBe(2);
            expect(element.querySelectorAll('.ontology-select-container').length).toBe(1);
            expect(element.querySelectorAll('.version-class-select-container').length).toBe(1);
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
        var record = {'@id': 'record'}
        controller.records = [record];
        spyOn(controller, 'selectOntology');
        scope.$digest();

        var recordButton = angular.element(element.querySelectorAll('.ontology-records-list button')[0]);
        recordButton.triggerHandler('click');
        expect(controller.selectedRecord).toEqual(record);
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
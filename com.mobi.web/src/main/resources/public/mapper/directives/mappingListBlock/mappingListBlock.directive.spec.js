describe('Mapping List Block directive', function() {
    var $compile, scope, $q, utilSvc, mappingManagerSvc, mapperStateSvc, catalogManagerSvc, prefixes, modalSvc;

    beforeEach(function() {
        module('templates');
        module('mappingListBlock');
        mockPrefixes();
        mockUtil();
        mockMappingManager();
        mockMapperState();
        mockCatalogManager();
        mockModal();
        injectSplitIRIFilter();
        injectHighlightFilter();
        injectTrustedFilter();

        inject(function(_$compile_, _$rootScope_, _$q_, _utilService_, _mappingManagerService_, _mapperStateService_, _catalogManagerService_, _prefixes_, _modalService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            utilSvc = _utilService_;
            mappingManagerSvc = _mappingManagerService_;
            mapperStateSvc = _mapperStateService_;
            catalogManagerSvc = _catalogManagerService_;
            prefixes = _prefixes_;
            modalSvc = _modalService_;
        });

        var catalogId = 'catalog';
        catalogManagerSvc.localCatalog = {'@id': catalogId};
        this.element = $compile(angular.element('<mapping-list-block></mapping-list-block>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('mappingListBlock');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        utilSvc = null;
        mappingManagerSvc = null;
        mapperStateSvc = null;
        catalogManagerSvc = null;
        prefixes = null;
        modalSvc = null;
        this.element.remove();
    });

    it('should initialize the list of mapping records', function() {
        expect(mappingManagerSvc.getMappingRecords).toHaveBeenCalled();
    });
    describe('controller methods', function() {
        it('should open the create mapping overlay', function() {
            this.controller.createMapping();
            expect(mapperStateSvc.mapping).toBeUndefined();
            expect(modalSvc.openModal).toHaveBeenCalledWith('createMappingOverlay');
        });
        it('should confirm deleting a mapping', function() {
            mapperStateSvc.mapping = {record: {title: 'title'}};
            this.controller.confirmDeleteMapping();
            expect(modalSvc.openConfirmModal).toHaveBeenCalledWith(jasmine.stringMatching('Are you sure'), this.controller.deleteMapping);
        });
        describe('should delete a mapping', function() {
            beforeEach(function () {
                mapperStateSvc.mapping = {record: {id: 'id'}};
                this.mapping = angular.copy(mapperStateSvc.mapping);
                mapperStateSvc.sourceOntologies = [{}];
            });
            it('unless an error occurs', function() {
                mappingManagerSvc.deleteMapping.and.returnValue($q.reject('Error message'));
                this.controller.deleteMapping();
                scope.$apply();
                expect(mappingManagerSvc.deleteMapping).toHaveBeenCalledWith(this.mapping.record.id);
                expect(mapperStateSvc.mapping).toEqual(this.mapping);
                expect(mapperStateSvc.sourceOntologies).toEqual([{}]);
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error message');
            });
            describe('and retrieve records again', function() {
                it('unless an error occurs', function() {
                    mappingManagerSvc.getMappingRecords.and.returnValue($q.reject('Error message'));
                    this.controller.deleteMapping();
                    scope.$apply();
                    expect(mappingManagerSvc.deleteMapping).toHaveBeenCalledWith(this.mapping.record.id);
                    expect(mapperStateSvc.mapping).toBeUndefined();
                    expect(mapperStateSvc.sourceOntologies).toEqual([]);
                    expect(mappingManagerSvc.getMappingRecords).toHaveBeenCalled();
                    expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error message');
                });
                it('successfully', function() {
                    var record = {'@id': 'record'};
                    record[prefixes.catalog + 'keyword'] = [{'@value': 'keyword'}];
                    mappingManagerSvc.getMappingRecords.and.returnValue($q.when([record]));
                    this.controller.deleteMapping();
                    scope.$apply();
                    expect(mappingManagerSvc.deleteMapping).toHaveBeenCalledWith(this.mapping.record.id);
                    expect(mapperStateSvc.mapping).toBeUndefined();
                    expect(mapperStateSvc.sourceOntologies).toEqual([]);
                    expect(mappingManagerSvc.getMappingRecords).toHaveBeenCalled();
                    expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                    expect(utilSvc.getDctermsValue).toHaveBeenCalledWith(record, 'title');
                    expect(utilSvc.getDctermsValue).toHaveBeenCalledWith(record, 'description');
                    expect(utilSvc.getPropertyId).toHaveBeenCalledWith(record, prefixes.catalog + 'masterBranch');
                    expect(this.controller.list).toContain(jasmine.objectContaining({id: record['@id'], title: jasmine.any(String), description: jasmine.any(String), branch: jasmine.any(String), keywords: ['keyword']}));
                });
            });
        });
        describe('should open a mapping on click', function() {
            beforeEach(function() {
                this.record = {id: 'test1', title: 'Test 1'};
            });
            it('if it was already open', function() {
                this.controller.onClick(this.record);
                scope.$apply();
                mappingManagerSvc.getMapping.calls.reset();
                this.controller.onClick(this.record);
                expect(mappingManagerSvc.getMapping).not.toHaveBeenCalled();
                expect(mapperStateSvc.mapping).toEqual(jasmine.objectContaining({record: this.record}));
            });
            describe('if it had not been opened yet', function() {
                it('unless an error occurs', function() {
                    mappingManagerSvc.getMapping.and.returnValue($q.reject('Error message'));
                    this.controller.onClick(this.record);
                    scope.$apply();
                    expect(mappingManagerSvc.getMapping).toHaveBeenCalledWith(this.record.id);
                    expect(mapperStateSvc.mapping).toBeUndefined();
                    expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Mapping ' + this.record.title + ' could not be found');
                });
                it('successfully', function() {
                    var ontology = {'@id': 'ontology'};
                    var mapping = [{}]
                    mappingManagerSvc.getMapping.and.returnValue($q.when(mapping));
                    catalogManagerSvc.getRecord.and.returnValue($q.when(ontology));
                    this.controller.onClick(this.record);
                    scope.$apply();
                    expect(mappingManagerSvc.getMapping).toHaveBeenCalledWith(this.record.id);
                    expect(catalogManagerSvc.getRecord).toHaveBeenCalled();
                    expect(mapperStateSvc.mapping).toEqual({jsonld: mapping, record: this.record, ontology: ontology, difference: {additions: [], deletions: []}});
                });
            });
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('mapping-list-block')).toBe(true);
        });
        it('with a block', function() {
            expect(this.element.find('block').length).toEqual(1);
        });
        it('with a block-header', function() {
            expect(this.element.find('block-header').length).toEqual(1);
        });
        it('with a block-search', function() {
            expect(this.element.find('block-search').length).toEqual(1);
        });
        it('with a block-content', function() {
            var blockContent = this.element.find('block-content');
            expect(blockContent.length).toEqual(1);
            expect(blockContent.hasClass('tree')).toEqual(true);
            expect(blockContent.hasClass('scroll-without-buttons')).toEqual(true);
        });
        it('with a block-footer', function() {
            expect(this.element.find('block-content').length).toEqual(1);
        });
        it('with the correct number of mapping list items', function() {
            this.controller.list = [{id: 'record', title: ''}];
            scope.$digest();
            expect(this.element.find('li').length).toBe(this.controller.list.length);
        });
        it('depending on whether the mapping is selected', function() {
            this.controller.list = [{id: 'record', title: ''}];
            scope.$digest();
            var mappingName = angular.element(this.element.querySelectorAll('li a'));
            expect(mappingName.hasClass('active')).toBe(false);

            mapperStateSvc.mapping = {record: {id: 'record'}};
            scope.$digest();
            expect(mappingName.hasClass('active')).toBe(true);
        });
        it('depending on the mapping search string', function() {
            this.controller.list = [{id: 'test1', title: 'Test 1'}, {id: 'test2', title: 'Test 2'}];
            mapperStateSvc.mappingSearchString = 'Test 1';
            scope.$digest();
            expect(this.element.find('li').length).toBe(1);

            mapperStateSvc.mappingSearchString = 'Test 12';
            scope.$digest();
            expect(this.element.find('li').length).toBe(0);
        });
    });
    it('should call onClick when a mapping name is clicked', function() {
        this.controller.list = [{id: 'record', title: ''}];
        spyOn(this.controller, 'onClick');
        scope.$digest();

        angular.element(this.element.querySelectorAll('li a')[0]).triggerHandler('click');
        expect(this.controller.onClick).toHaveBeenCalled();
    });
});
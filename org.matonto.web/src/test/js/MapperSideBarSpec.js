describe('Mapper Side Bar directive', function() {
    var $compile,
        scope,
        mappingManagerSvc,
        mapperStateSvc,
        ontologyManagerSvc,
        windowSvc;

    mockPrefixes();
    beforeEach(function() {
        module('templates');
        module('mapperSideBar');
        mockMappingManager();
        mockMapperState();
        mockOntologyManager();
        module(function($provide) {
            $provide.service('$window', function() {
                this.open = jasmine.createSpy('open');
            });
        });

        inject(function(_mappingManagerService_, _mapperStateService_, _ontologyManagerService_) {
            mappingManagerSvc = _mappingManagerService_;
            mapperStateSvc = _mapperStateService_;
            ontologyManagerSvc = _ontologyManagerService_;
        });

        inject(function(_$compile_, _$rootScope_, _$window_ {
            $compile = _$compile_;
            scope = _$rootScope_;
            windowSvc = _$window_;
        });
    });

    describe('controller methods', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<mapper-side-bar></mapper-side-bar>'))(scope);
            scope.$digest();
        });
        it('should test whether there are ontologies availabale', function() {
            var controller = this.element.controller('mapperSideBar');
            var result = controller.noOntologies();
            expect(result).toBe(true);

            ontologyManagerSvc.getList.and.returnValue([{}]);
            scope.$digest();
            result = controller.noOntologies();
            expect(result).toBe(false);

            ontologyManagerSvc.getList.and.returnValue([]);
            ontologyManagerSvc.getOntologyIds.and.returnValue(['']);
            scope.$digest();
            result = controller.noOntologies();
            expect(result).toBe(false);
        });
        it('should navigate to the mapping list', function() {
            var controller = this.element.controller('mapperSideBar');
            mapperStateSvc.editMapping = true;
            controller.mappingList();
            expect(mapperStateSvc.displayCancelConfirm).toBe(true);

            mapperStateSvc.editMapping = false;
            controller.mappingList();
            expect(mapperStateSvc.displayCancelConfirm).toBe(false);
        });
        it('should set the correct state for creating a mapping', function() {
            var controller = this.element.controller('mapperSideBar');
            mapperStateSvc.editMapping = true;
            controller.createMapping();
            expect(mapperStateSvc.displayNewMappingConfirm).toBe(true);
            expect(mapperStateSvc.createMapping).not.toHaveBeenCalled();

            mapperStateSvc.editMapping = false;
            controller.createMapping();
            expect(mapperStateSvc.displayNewMappingConfirm).toBe(false);
            expect(mapperStateSvc.createMapping).toHaveBeenCalled();
        });
        it('should download a mapping', function() {
            mappingManagerSvc.mapping = {name: 'test'};
            var controller = this.element.controller('mapperSideBar');
            controller.downloadMapping();
            scope.$digest();
            expect(mappingManagerSvc.downloadMapping).toHaveBeenCalledWith(mappingManagerSvc.mapping.name);
        });
        it('should set the correct state for adding a property mapping', function() {
            var controller = this.element.controller('mapperSideBar');
            mapperStateSvc.editingClassMappingId = 'test';
            controller.addPropMapping();
            expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
            expect(mapperStateSvc.newProp).toBe(true);
            expect(mapperStateSvc.editingClassMappingId).toBe('test');
            expect(mapperStateSvc.updateAvailableProps).toHaveBeenCalled();
        });
        it('should set the correct state for deleting an entity', function() {
            var controller = this.element.controller('mapperSideBar');
            mapperStateSvc.selectedPropMappingId = 'prop';
            mapperStateSvc.selectedClassMappingId = 'class';
            controller.deleteEntity();
            expect(mapperStateSvc.displayDeleteEntityConfirm).toBe(true);
            expect(mapperStateSvc.deleteId).toBe(mapperStateSvc.selectedPropMappingId);

            mapperStateSvc.selectedPropMappingId = '';
            controller.deleteEntity();
            expect(mapperStateSvc.displayDeleteEntityConfirm).toBe(true);
            expect(mapperStateSvc.deleteId).toBe(mapperStateSvc.selectedClassMappingId);
        });
        it('should set the correct state for deleting a mapping', function() {
            var controller = this.element.controller('mapperSideBar');
            controller.deleteMapping();
            expect(mapperStateSvc.displayDeleteMappingConfirm).toBe(true);
        });
        it('should open the Mapping Tool documentation', function() {
            var controller = this.element.controller('mapperSideBar');
            controller.openDocs();
            expect(windowSvc.open).toHaveBeenCalledWith('http://docs.matonto.org/#mapping_tool');
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<mapper-side-bar></mapper-side-bar>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('mapper-side-bar')).toBe(true);
            expect(this.element.hasClass('left-nav')).toBe(true);
        });
        it('with the correct number of nav items', function() {
            expect(this.element.find('left-nav-item').length).toBe(6);
        });
    });
});
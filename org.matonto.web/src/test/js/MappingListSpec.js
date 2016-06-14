describe('Mapping List directive', function() {
    var $compile,
        scope,
        mappingManagerSvc,
        mapperStateSvc;

    mockPrefixes();
    beforeEach(function() {
        module('templates');
        module('mappingList');
        mockMappingManager();
        mockMapperState();

        inject(function(_mappingManagerService_, _mapperStateService_) {
            mappingManagerSvc = _mappingManagerService_;
            mapperStateSvc = _mapperStateService_;
        });

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    describe('controller methods', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<mapping-list></mapping-list>'))(scope);
            scope.$digest();
        });
        it('should open a mapping on click', function() {
            var controller = this.element.controller('mappingList');
            mappingManagerSvc.previousMappingNames = ['test1', 'test2'];
            controller.onClick('test1');
            scope.$apply();
            expect(mappingManagerSvc.getMapping).toHaveBeenCalledWith('test1');
            expect(mappingManagerSvc.mapping).toEqual({jsonld: [], name: 'test1'});

            controller.onClick('test2');
            scope.$apply();
            expect(mappingManagerSvc.getMapping).toHaveBeenCalledWith('test2');
            expect(mappingManagerSvc.mapping).toEqual({jsonld: [], name: 'test2'});

            mappingManagerSvc.getMapping.calls.reset();
            controller.onClick('test1');
            scope.$apply();
            expect(mappingManagerSvc.getMapping).not.toHaveBeenCalled();
            expect(mappingManagerSvc.mapping).toEqual({jsonld: [], name: 'test1'});
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<mapping-list></mapping-list>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('mapping-list')).toBe(true);
            expect(this.element.querySelectorAll('.boxed').length).toBe(1);
        });
        it('with the correct number of mapping list items', function() {
            mappingManagerSvc.previousMappingNames = ['test1'];
            scope.$digest();
            expect(this.element.find('li').length).toBe(mappingManagerSvc.previousMappingNames.length);
        });
        it('depending on whether the mapping is selected', function() {
            mappingManagerSvc.previousMappingNames = ['test1'];
            scope.$digest();
            var mappingName = angular.element(this.element.querySelectorAll('li a'));
            expect(mappingName.hasClass('active')).toBe(false);

            mappingManagerSvc.mapping = {name: 'test1'};
            scope.$digest();
            expect(mappingName.hasClass('active')).toBe(true);
        });
    });
    it('should call onClick when a mapping name is clicked', function() {
        mappingManagerSvc.previousMappingNames = ['test1'];
        var element = $compile(angular.element('<mapping-list></mapping-list>'))(scope);
        scope.$digest();
        var controller = element.controller('mappingList');
        spyOn(controller, 'onClick');

        angular.element(element.querySelectorAll('li a')[0]).triggerHandler('click');
        expect(controller.onClick).toHaveBeenCalled();
    });
});
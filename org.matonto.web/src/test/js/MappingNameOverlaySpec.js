describe('Mapping Name Overlay directive', function() {
    var $compile,
        scope,
        mappingManagerSvc,
        mapperStateSvc;

    beforeEach(function() {
        module('templates');
        module('mappingNameOverlay');
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
            mappingManagerSvc.mapping = {
                name: ''
            };
            this.element = $compile(angular.element('<mapping-name-overlay></mapping-name-overlay>'))(scope);
            scope.$digest();
        });
        it('should set the correct state for setting the name', function() {
            var controller = this.element.controller('mappingNameOverlay');
            mapperStateSvc.step = 0;
            controller.newName = 'test1';
            controller.set();
            expect(mapperStateSvc.step).toBe(mapperStateSvc.fileUploadStep);
            expect(mappingManagerSvc.createNewMapping).toHaveBeenCalled();
            expect(mappingManagerSvc.mapping.name).toBe(controller.newName);
            expect(mapperStateSvc.editMappingName).toBe(false);

            mappingManagerSvc.createNewMapping.calls.reset();
            mapperStateSvc.step = 1;
            controller.newName = 'test2';
            controller.set();
            expect(mapperStateSvc.step).toBe(1);
            expect(mappingManagerSvc.createNewMapping).not.toHaveBeenCalled();
            expect(mappingManagerSvc.mapping.name).toBe(controller.newName);
            expect(mapperStateSvc.editMappingName).toBe(false);
        });
        it('should set the correct state for canceling', function() {
            var controller = this.element.controller('mappingNameOverlay');
            mapperStateSvc.step = 0;
            controller.cancel();
            expect(mapperStateSvc.editMapping).toBe(false);
            expect(mapperStateSvc.newMapping).toBe(false);
            expect(mappingManagerSvc.mapping).toEqual(undefined);
            expect(mapperStateSvc.editMappingName).toBe(false);

            mapperStateSvc.editMapping = true;
            mapperStateSvc.newMapping = true;
            mappingManagerSvc.mapping = {};
            mapperStateSvc.step = 1;
            controller.cancel();
            expect(mapperStateSvc.editMapping).toBe(true);
            expect(mapperStateSvc.newMapping).toBe(true);
            expect(mappingManagerSvc.mapping).toEqual({});
            expect(mapperStateSvc.editMappingName).toBe(false);
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<mapping-name-overlay></mapping-name-overlay>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('mapping-name-overlay')).toBe(true);
            expect(this.element.querySelectorAll('form.content').length).toBe(1);
        });
        it('depending on the step', function() {
            mapperStateSvc.step = 0;
            scope.$digest();
            expect(this.element.find('h6').text()).toContain('Set');

            mapperStateSvc.step = 1;
            scope.$digest();
            expect(this.element.find('h6').text()).toContain('Edit');
        });
        it('with a mapping name input', function() {
            expect(this.element.find('mapping-name-input').length).toBe(1);
        });
        it('with custom buttons for cancel and set', function() {
            var buttons = this.element.find('custom-button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Set'].indexOf(angular.element(buttons[0]).text()) >= 0).toBe(true);
            expect(['Cancel', 'Set'].indexOf(angular.element(buttons[1]).text()) >= 0).toBe(true);
        });
    });
});
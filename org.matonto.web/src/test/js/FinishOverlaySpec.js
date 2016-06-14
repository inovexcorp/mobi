describe('Finish Overlay directive', function() {
    var $compile,
        scope,
        mappingManagerSvc,
        mapperStateSvc,
        csvManagerSvc;

    beforeEach(function() {
        module('finishOverlay');
        mockMappingManager();
        mockMapperState();
        mockCsvManager();

        inject(function(_mappingManagerService_, _mapperStateService_, _csvManagerService_) {
            mappingManagerSvc = _mappingManagerService_;
            mapperStateSvc = _mapperStateService_;
            csvManagerSvc = _csvManagerService_;
        });

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    injectDirectiveTemplate('modules/mapper/directives/finishOverlay/finishOverlay.html');

    describe('controller methods', function() {
        beforeEach(function() {
            mappingManagerSvc.mapping = {name: ''};
            this.element = $compile(angular.element('<finish-overlay></finish-overlay>'))(scope);
            scope.$digest();
        });
        it('should set the correct state for finishing', function() {
            var controller = this.element.controller('finishOverlay');
            controller.finish();
            expect(mapperStateSvc.initialize).toHaveBeenCalled();
            expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
            expect(csvManagerSvc.reset).toHaveBeenCalled();
            expect(mappingManagerSvc.mapping).toEqual(undefined);
            expect(mappingManagerSvc.sourceOntologies).toEqual([]);
        });
        it('should set the correct state for saving and finishing', function() {
            var controller = this.element.controller('finishOverlay');
            spyOn(controller, 'finish');
            controller.save();
            expect(mappingManagerSvc.downloadMapping).toHaveBeenCalled();
            expect(controller.finish).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<finish-overlay></finish-overlay>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('finish-overlay')).toBe(true);
            expect(this.element.querySelectorAll('form.content').length).toBe(1);
        });
        it('with custom buttons for saving and finishing', function() {
            var buttons = this.element.find('custom-button');
            expect(buttons.length).toBe(2);
            expect(['Save & finish', 'Finish'].indexOf(angular.element(buttons[0]).text()) >= 0).toBe(true);
            expect(['Save & finish', 'Finish'].indexOf(angular.element(buttons[1]).text()) >= 0).toBe(true);
        });
    });
});
describe('Class Mapping Overlay component', function() {
    var $compile, scope, mappingManagerSvc, mapperStateSvc;

    beforeEach(function() {
        module('templates');
        module('classMappingOverlay');
        mockMappingManager();
        mockMapperState();

        inject(function(_$compile_, _$rootScope_, _mappingManagerService_, _mapperStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            mapperStateSvc = _mapperStateService_;
            mappingManagerSvc = _mappingManagerService_;
        });

        mapperStateSvc.mapping = {jsonld: [], difference: {additions: []}};
        scope.close = jasmine.createSpy('close');
        scope.dismiss = jasmine.createSpy('dismiss');
        this.element = $compile(angular.element('<class-mapping-overlay close="close()" dismiss="dismiss()"></class-mapping-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('classMappingOverlay');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        mappingManagerSvc = null;
        mapperStateSvc = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
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
        it('should add a class mapping', function() {
            var classMapping = {'@id': 'classMapping'};
            this.controller.selectedClass = {ontologyId: '', classObj: {'@id': ''}};
            mapperStateSvc.addClassMapping.and.returnValue(classMapping);
            this.controller.addClass();
            expect(mapperStateSvc.addClassMapping).toHaveBeenCalledWith(this.controller.selectedClass);
            expect(mapperStateSvc.setProps).toHaveBeenCalledWith('');
            expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
            expect(mapperStateSvc.selectedClassMappingId).toEqual(classMapping['@id']);
            expect(scope.close).toHaveBeenCalled();
        });
        it('should cancel the overlay', function() {
            this.controller.cancel();
            expect(scope.dismiss).toHaveBeenCalled();
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('CLASS-MAPPING-OVERLAY');
            expect(this.element.querySelectorAll('.modal-header').length).toEqual(1);
            expect(this.element.querySelectorAll('.modal-body').length).toEqual(1);
            expect(this.element.querySelectorAll('.modal-footer').length).toEqual(1);
        });
        it('with a class select', function() {
            expect(this.element.find('class-select').length).toEqual(1);
        });
        it('with buttons to cancel and submit', function() {
            var buttons = this.element.querySelectorAll('.modal-footer button');
            expect(buttons.length).toEqual(2);
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[1]).text().trim());
        });
        it('depending on whether a class is selected', function() {
            var button = angular.element(this.element.querySelectorAll('.modal-footer button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeTruthy();
            expect(this.element.find('class-preview').length).toEqual(0);

            this.controller.selectedClass = {};
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
            expect(this.element.find('class-preview').length).toEqual(1);
        });
    });
    it('should call addClass when the button is clicked', function() {
        spyOn(this.controller, 'addClass');
        var continueButton = angular.element(this.element.querySelectorAll('.modal-footer button.btn-primary')[0]);
        continueButton.triggerHandler('click');
        expect(this.controller.addClass).toHaveBeenCalled();
    });
    it('should call cancel when the button is clicked', function() {
        spyOn(this.controller, 'cancel');
        var continueButton = angular.element(this.element.querySelectorAll('.modal-footer button:not(.btn-primary)')[0]);
        continueButton.triggerHandler('click');
        expect(this.controller.cancel).toHaveBeenCalled();
    });
});
describe('Mapping Name Overlay directive', function() {
    var $compile,
        scope,
        mappingManagerSvc;

    beforeEach(function() {
        module('templates');
        module('mappingNameOverlay');
        mockMappingManager();

        inject(function(_mappingManagerService_) {
            mappingManagerSvc = _mappingManagerService_;
        });

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.mappingName = '';
            scope.set = jasmine.createSpy('set');
            scope.close = jasmine.createSpy('close');

            this.element = $compile(angular.element('<mapping-name-overlay mapping-name="{{mappingName}}" set="set(name)" close="close()"></mapping-name-overlay>'))(scope);
            scope.$digest();
        });

        it('mappingName should be one way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.mappingName = 'test';
            scope.$digest();
            expect(scope.mappingName).not.toBe('test');
        });
        it('set should be called in the parent scope', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.set();

            expect(scope.set).toHaveBeenCalled();
        });
        it('close should be called in the parent scope', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.close();

            expect(scope.close).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<mapping-name-overlay mapping-name="{{mappingName}}" set="set(name)" close="close()"></mapping-name-overlay>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('mapping-name-overlay')).toBe(true);
            expect(this.element.querySelectorAll('form.content').length).toBe(1);
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
describe('Mapping Select Overlay directive', function() {
    var $compile,
        scope,
        mappingManagerSvc;

    mockMappingManager();
    beforeEach(function() {
        module('mappingSelectOverlay');

        inject(function(mappingManagerService) {
            mappingManagerSvc = mappingManagerService;
        });

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    injectDirectiveTemplate('modules/mapper/directives/mappingSelectOverlay/mappingSelectOverlay.html');

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.onClickBack = jasmine.createSpy('onClickBack');
            scope.onClickContinue = jasmine.createSpy('onClickContinue');

            this.element = $compile(angular.element('<mapping-select-overlay on-click-back="onClickBack()" on-click-continue="onClickContinue(mappingType, mappingName)"></mapping-select-overlay>'))(scope);
            scope.$digest();
        });

        it('onClickBack should be called in the parent scope', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.onClickBack();

            expect(scope.onClickBack).toHaveBeenCalled();
        });
        it('onClickContinue should be called in the parent scope', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.onClickContinue();

            expect(scope.onClickContinue).toHaveBeenCalled();
        });
    });
    describe('controller methods', function() {
        it('should update the mapping name depending on the mapping type', function() {
            var element = $compile(angular.element('<mapping-select-overlay on-click-back="onClickBack()" on-click-continue="onClickContinue(mappingType, mappingName)"></mapping-select-overlay>'))(scope);
            scope.$digest();
            var controller = element.controller('mappingSelectOverlay');
            controller.previousMappings = ['test'];
            controller.mappingType = 'new';
            controller.updateMappingName();

            expect(controller.newMappingName).toBe('');
            expect(controller.previousMappingName).toBe('');
            controller.mappingType = 'previous';
            controller.updateMappingName();
            expect(controller.newMappingName).toBe('');
            expect(controller.previousMappingName).toBe('test');
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<mapping-select-overlay on-click-back="onClickBack()" on-click-continue="onClickContinue(mappingType, mappingName)"></mapping-select-overlay>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('mapping-select-overlay')).toBe(true);
            expect(this.element.querySelectorAll('form.content').length).toBe(1);
            expect(this.element.querySelectorAll('.new-mapping').length).toBe(1);
            expect(this.element.querySelectorAll('.previous-mapping').length).toBe(1);
        });
        it('depending on the mapping type', function() {
            expect(this.element.find('mapping-name-input').length).toBe(0);
            expect(this.element.querySelectorAll('.previous-mapping select').length).toBe(0);

            var controller = this.element.controller('mappingSelectOverlay');
            controller.mappingType = 'new';
            scope.$digest();
            expect(this.element.find('mapping-name-input').length).toBe(1);
            expect(this.element.querySelectorAll('.previous-mapping select').length).toBe(0);

            controller.mappingType = 'previous';
            scope.$digest();
            expect(this.element.querySelectorAll('mapping-name-input').length).toBe(0);
            expect(this.element.querySelectorAll('.previous-mapping select').length).toBe(1);
        });
        it('with radio buttons for new and previous', function() {
            var radioBtns = this.element.find('radio-button')
            expect(this.element.find('radio-button').length).toBe(2);
            for (var i = 0; i < radioBtns.length; i++) {
                var name = angular.element(radioBtns[i]).attr('display-text');
                expect(["'New'", "'Previous'"].indexOf(name) >= 0).toBe(true);
            };
        });
        it('with the correct number of previous mapping options', function() {
            var controller = this.element.controller('mappingSelectOverlay');
            controller.mappingType = 'previous';
            controller.previousMappings = ['test'];
            controller.previousMappingName = 'test';
            scope.$digest();

            expect(this.element.querySelectorAll('.previous-mapping option').length).toBe(controller.previousMappings.length);
        });
        it('with custom buttons for back and continue', function() {
            var buttons = this.element.find('custom-button');
            expect(buttons.length).toBe(2);
            expect(['Back', 'Continue'].indexOf(angular.element(buttons[0]).text()) >= 0).toBe(true);
            expect(['Back', 'Continue'].indexOf(angular.element(buttons[1]).text()) >= 0).toBe(true);
        });
    });
});
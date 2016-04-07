describe('Finish Overlay directive', function() {
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

            expect(controller.mappingName).toBe('');
            controller.mappingType = 'previous';
            controller.updateMappingName();
            expect(controller.mappingName).toBe(controller.previousMappings[0]);
        });
        it('should set the validity of the text field depending on the mapping type', function() {
            var element = $compile(angular.element('<mapping-select-overlay on-click-back="onClickBack()" on-click-continue="onClickContinue(mappingType, mappingName)"></mapping-select-overlay>'))(scope);
            scope.$digest();
            var isolatedScope = element.isolateScope();
            var controller = element.controller('mappingSelectOverlay');
            controller.previousMappings = ['test'];
            controller.mappingType = 'new';
            controller.mappingName = 'a';
            scope.$digest();
            controller.testUniqueName();
            expect(isolatedScope.mappingForm.mappingName.$valid).toBe(true);
           
            controller.mappingName = 'test';
            scope.$digest();
            controller.testUniqueName();
            expect(isolatedScope.mappingForm.mappingName.$valid).toBe(false);
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
            expect(this.element.querySelectorAll('.new-mapping input[name="mappingName"]').length).toBe(0);
            expect(this.element.querySelectorAll('.previous-mapping select').length).toBe(0);

            var controller = this.element.controller('mappingSelectOverlay');
            controller.mappingType = 'new';
            scope.$digest();
            expect(this.element.querySelectorAll('.new-mapping input[name="mappingName"]').length).toBe(1);
            expect(this.element.querySelectorAll('.previous-mapping select').length).toBe(0);

            controller.mappingType = 'previous';
            scope.$digest();
            expect(this.element.querySelectorAll('.new-mapping input[name="mappingName"]').length).toBe(0);
            expect(this.element.querySelectorAll('.previous-mapping select').length).toBe(1);
        });
        it('with an error message if mapping name is the same as previous', function() {
            var controller = this.element.controller('mappingSelectOverlay');
            var isolatedScope = this.element.isolateScope();
            controller.mappingType = 'new';
            scope.$digest();

            isolatedScope.mappingForm.mappingName.$setValidity('uniqueName', false);
            scope.$digest();
            var errorMessages = this.element.querySelectorAll('.new-mapping div');
            expect(errorMessages.length).toBe(1);
            expect(angular.element(errorMessages[0]).text().trim()).toEqual('Mapping name must be unique');
        });
        it('with an error message if mapping name is the same as previous', function() {
            var controller = this.element.controller('mappingSelectOverlay');
            var isolatedScope = this.element.isolateScope();
            controller.mappingType = 'new';
            controller.mappingName = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
            scope.$digest();
            var errorMessages = this.element.querySelectorAll('.new-mapping div');
            expect(errorMessages.length).toBe(1);
            expect(angular.element(errorMessages[0]).text().trim()).toEqual('Mapping name must be 50 characters or less');
        });
        it('with radio buttons for new and previous', function() {
            var radioBtns = this.element.find('radio-button')
            expect(this.element.find('radio-button').length).toBe(2);
            for (var i = 0; i < radioBtns.length; i++) {
                var name = angular.element(radioBtns[i]).attr('display-text');
                expect(["'New'", "'Previous'"].indexOf(name) >= 0).toBe(true);
            };
        });
        it('with the correct class on the text field', function() {
            var controller = this.element.controller('mappingSelectOverlay');
            var isolatedScope = this.element.isolateScope();
            controller.mappingType = 'new';
            scope.$digest();
            var textLabel = angular.element(this.element.querySelectorAll('.new-mapping label')[0]);
            expect(textLabel.hasClass('has-success')).toBe(false);
            expect(textLabel.hasClass('has-error')).toBe(false);

            textLabel.find('input')[0].dispatchEvent(new Event('blur'));
            scope.$digest();
            expect(textLabel.hasClass('has-success')).toBe(false);
            expect(textLabel.hasClass('has-error')).toBe(true);

            controller.mappingName = 'a';
            scope.$digest();
            expect(textLabel.hasClass('has-success')).toBe(true);
            expect(textLabel.hasClass('has-error')).toBe(false);
        });
        it('with the correct number of previous mapping options', function() {
            var controller = this.element.controller('mappingSelectOverlay');
            controller.mappingType = 'previous';
            controller.previousMappings = ['test'];
            controller.mappingName = 'test';
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
    it('calls testUniqueName on blur of text field', function() {
        var element = $compile(angular.element('<mapping-select-overlay on-click-back="onClickBack()" on-click-continue="onClickContinue(mappingType, mappingName)"></mapping-select-overlay>'))(scope);
        scope.$digest();
        var controller = element.controller('mappingSelectOverlay');
        controller.mappingType = 'new';
        spyOn(controller, 'testUniqueName').and.callThrough();
        scope.$digest();
        angular.element(element.querySelectorAll('.new-mapping input')[0]).triggerHandler('blur');
        expect(controller.testUniqueName).toHaveBeenCalled();
    });
});
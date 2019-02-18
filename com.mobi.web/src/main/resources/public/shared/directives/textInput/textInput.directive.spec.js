describe('Text Input directive', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('textInput');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.bindModel = '';
        scope.changeEvent = jasmine.createSpy('changeEvent');
        scope.displayText = '';
        scope.mutedText = '';
        scope.required = true;
        scope.inputName = '';
        scope.isInvalid = false;
        scope.isValid = false;
        this.element = $compile(angular.element('<text-input ng-model="bindModel" change-event="changeEvent()" display-text="displayText" muted-text="mutedText" required="required" input-name="inputName" is-invalid="isInvalid" is-valid="isValid"></text-input>'))(scope);
        scope.$digest();
        this.isolatedScope = this.element.isolateScope();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('in isolated scope', function() {
        it('bindModel should be two way bound', function() {
            this.isolatedScope.bindModel = 'Test';
            scope.$digest();
            expect(scope.bindModel).toEqual('Test');
        });
        it('changeEvent should be called in parent scope when invoked', function() {
            this.isolatedScope.changeEvent();
            expect(scope.changeEvent).toHaveBeenCalled();
        });
        it('displayText should be one way bound', function() {
            this.isolatedScope.displayText = 'Test';
            scope.$digest();
            expect(scope.displayText).toBe('');
        });
        it('mutedText should be one way bound', function() {
            this.isolatedScope.mutedText = 'Test';
            scope.$digest();
            expect(scope.mutedText).toBe('');
        });
        it('required should be one way bound', function() {
            this.isolatedScope.required = false;
            scope.$digest();
            expect(scope.required).toBe(true);
        });
        it('inputName should be one way bound', function() {
            this.isolatedScope.inputName = 'Test';
            scope.$digest();
            expect(scope.inputName).toBe('');
        });
        it('isInvalid should be one way bound', function() {
            this.isolatedScope.isInvalid = true;
            scope.$digest();
            expect(scope.isInvalid).toBe(false);
        });
        it('isValid should be one way bound', function() {
            this.isolatedScope.isValid = true;
            scope.$digest();
            expect(scope.isValid).toBe(false);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('form-group')).toBe(true);
        });
        it('with a custom-label', function() {
            expect(this.element.find('custom-label').length).toBe(1);
        });
        it('with a input element for text', function() {
            expect(this.element.querySelectorAll('input[type="text"]').length).toBe(1);
        });
        it('depending on whether it is required', function() {
            var input = angular.element(this.element.querySelectorAll('input[type="text"]')[0]);
            expect(input.attr('required')).toBeTruthy();

            scope.required = false;
            scope.$digest();
            expect(input.attr('required')).toBeFalsy();
        });
        it('depending on whether it is invalid', function() {
            var input = angular.element(this.element.querySelectorAll('input[type="text"]')[0]);
            expect(input.hasClass('is-invalid')).toBeFalsy();

            scope.isInvalid = true;
            scope.$digest();
            expect(input.hasClass('is-invalid')).toBeTruthy();
        });
        it('depending on whether it is valid', function() {
            var input = angular.element(this.element.querySelectorAll('input[type="text"]')[0]);
            expect(input.hasClass('is-valid')).toBeFalsy();

            scope.isValid = true;
            scope.$digest();
            expect(input.hasClass('is-valid')).toBeTruthy();
        });
    });
    it('should call changeEvent when the text in the input changes', function() {
        var input = angular.element(this.element.querySelectorAll('input[type="text"]')[0]);
        input.val('Test').triggerHandler('input');
        expect(scope.changeEvent).toHaveBeenCalled();
    });
});
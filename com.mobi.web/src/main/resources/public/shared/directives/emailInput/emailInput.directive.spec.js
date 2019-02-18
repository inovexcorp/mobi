describe('Email Input directive', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('emailInput');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.bindModel = '';
        scope.mutedText = '';
        scope.changeEvent = jasmine.createSpy('changeEvent');
        scope.required = true;
        scope.inputName = '';
        scope.isInvalid = false;
        scope.isValid = false;
        this.element = $compile(angular.element('<email-input ng-model="bindModel" change-event="changeEvent()" muted-text="mutedText" required="required" input-name="inputName" is-invalid="isInvalid" is-valid="isValid"></email-input>'))(scope);
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
        it('depending on whether it is required or not', function() {
            var input = angular.element(this.element.querySelectorAll('input[type="text"]')[0]);
            expect(input.attr('required')).toBeTruthy();

            scope.required = false;
            scope.$digest();
            expect(input.attr('required')).toBeFalsy();
        });
        it('depending on whether the text input is a valid email', function() {
            var input = angular.element(this.element.querySelectorAll('input[type="text"]')[0]);
            var invalidInputs = ['abc', '$', '/', '#', '=', '-', '_', '+', 'example@', '@example.com', 'example@.'];
            _.forEach(invalidInputs, function(value) {
                scope.bindModel = value;
                scope.$digest();
                expect(input.hasClass('ng-invalid-pattern')).toBe(true);
            });

            var validInputs = ['example@example.com', 'example@co', 'example-@example.com', 'example_@example.com', 'example+@example.com'];
            _.forEach(validInputs, function(value) {
                scope.bindModel = value;
                scope.$digest();
                expect(input.hasClass('ng-invalid-pattern')).toBe(false);
            });
        });
        it('depending on whether it is invalid', function() {
            var input = angular.element(this.element.querySelectorAll('input[type="text"]')[0]);
            expect(input.hasClass('is-invalid')).toEqual(false);

            scope.isInvalid = true;
            scope.$digest();
            expect(input.hasClass('is-invalid')).toEqual(true);
        });
        it('depending on whether it is valid', function() {
            var input = angular.element(this.element.querySelectorAll('input[type="text"]')[0]);
            expect(input.hasClass('is-valid')).toEqual(false);

            scope.isValid = true;
            scope.$digest();
            expect(input.hasClass('is-valid')).toEqual(true);
        });
    });
    it('should call changeEvent when the text in the input changes', function() {
        var input = angular.element(this.element.querySelectorAll('input[type="text"]')[0]);
        input.val('Test').triggerHandler('input');
        expect(scope.changeEvent).toHaveBeenCalled();
    });
});
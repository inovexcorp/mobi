describe('Radio Button directive', function() {
    var $compile, $timeout, scope;

    beforeEach(function() {
        module('templates');
        module('radioButton');

        inject(function(_$compile_, _$rootScope_, _$timeout_) {
            $compile = _$compile_;
            $timeout = _$timeout_;
            scope = _$rootScope_;
        });

        scope.ngModel = false;
        scope.value = 0;
        scope.displayText = '';
        scope.isDisabled = false;
        scope.changeEvent = jasmine.createSpy('changeEvent');
        scope.inline = false;

        this.element = $compile(angular.element('<radio-button ng-model="ngModel" value="value" display-text="displayText" is-disabled="isDisabled" change-event="changeEvent()" inline="inline"></radio-button>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('radioButton');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $timeout = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('bindModel should be two way bound', function() {
            this.controller.bindModel = true;
            scope.$digest();
            expect(scope.ngModel).toEqual(true);
        });
        it('value should be one way bound', function() {
            this.controller.value = 1;
            scope.$digest();
            expect(scope.value).toEqual(0);
        });
        it('displayText should be one way bound', function() {
            this.controller.displayText = 'abc';
            scope.$digest();
            expect(scope.displayText).toEqual('');
        });
        it('isDisabled should be one way bound', function() {
            this.controller.isDisabled = true;
            scope.$digest();
            expect(scope.isDisabled).toBe(false);
        });
        it('inline should be one way bound', function() {
            this.controller.inline = true;
            scope.$digest();
            expect(scope.inline).toBe(false);
        });
        it('changeEvent should be called in parent scope when invoked', function() {
            this.controller.changeEvent();
            expect(scope.changeEvent).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('radio-button')).toBe(true);
            expect(this.element.hasClass('form-check')).toBe(true);
        });
        it('with a radio input', function() {
            expect(this.element.querySelectorAll('input[type="radio"]').length).toBe(1);
        });
        it('with a .form-check-label', function() {
            expect(this.element.querySelectorAll('.form-check-label').length).toBe(1);
        });
        it('depending on whether it should be inline', function() {
            expect(this.element.hasClass('form-check-inline')).toEqual(false);
            scope.inline = true;
            scope.$digest();
            expect(this.element.hasClass('form-check-inline')).toEqual(true);
        });
        it('depending on whether it is disabled', function() {
            var radio = this.element.find('input');
            expect(this.element.hasClass('disabled')).toBe(false);
            expect(radio.attr('disabled')).toBeFalsy();

            scope.isDisabled = true;
            scope.$digest();
            expect(this.element.hasClass('disabled')).toBe(true);
            expect(radio.attr('disabled')).toBeTruthy();
        });
    });
    it('calls changeEvent if value of radio button is changed', function() {
        spyOn(this.controller, 'onChange');
        this.element.find('input')[0].click();
        // scope.$digest();
        $timeout.flush();
        expect(this.controller.onChange).toHaveBeenCalled();
    });
});
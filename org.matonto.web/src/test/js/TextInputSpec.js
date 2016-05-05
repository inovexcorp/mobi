describe('Text Input directive', function() {
    var $compile,
        scope;

    beforeEach(function() {
        angular.module('customLabel', []);
        module('textInput');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    injectDirectiveTemplate('directives/textInput/textInput.html');

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.bindModel = '';
            scope.changeEvent = jasmine.createSpy('changeEvent');
            scope.displayText = '';
            scope.mutedText = '';

            this.element = $compile(angular.element('<text-input ng-model="bindModel" change-event="changeEvent()" display-text="displayText" muted-text="mutedText"></text-input>'))(scope);
            scope.$digest();
        });
        it('bindModel should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.bindModel = 'Test';
            scope.$digest();
            expect(scope.bindModel).toEqual('Test');
        });
        it('changeEvent should be called in parent scope when invoked', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.changeEvent();

            expect(scope.changeEvent).toHaveBeenCalled();
        });
        it('displayText should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.displayText = 'Test';
            scope.$digest();
            expect(scope.displayText).toEqual('Test');
        });
        it('mutedText should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.mutedText = 'Test';
            scope.$digest();
            expect(scope.mutedText).toEqual('Test');
        });
    });
    describe('contains the correct html', function() {
        beforeEach(function() {
            scope.bindModel = '';
            scope.changeEvent = jasmine.createSpy('changeEvent');
            scope.displayText = '';
            scope.mutedText = '';

            this.element = $compile(angular.element('<text-input ng-model="bindModel" change-event="changeEvent()" display-text="displayText" muted-text="mutedText"></text-input>'))(scope);
            scope.$digest();
            this.firstChild = angular.element(this.element.children()[0]);
        });
        it('for wrapping containers', function() {
            expect(this.firstChild.hasClass('form-group')).toBe(true);
        });
        it('with a custom label', function() {
            expect(this.firstChild.find('custom-label').length).toBe(1);
        });
        it('with a input element for text', function() {
            expect(this.firstChild.querySelectorAll('input[type="text"]').length).toBe(1);
        });
    });
    it('should call changeEvent when the text in the input changes', function() {
        scope.bindModel = '';
        scope.changeEvent = jasmine.createSpy('changeEvent');
        var element = $compile(angular.element('<text-input ng-model="bindModel" change-event="changeEvent()" display-text="displayText" muted-text="mutedText"></text-input>'))(scope);
        scope.$digest();

        var input = angular.element(element.querySelectorAll('input[type="text"]')[0]);
        input.val('Test').triggerHandler('input');
        expect(scope.changeEvent).toHaveBeenCalled();
    });
});
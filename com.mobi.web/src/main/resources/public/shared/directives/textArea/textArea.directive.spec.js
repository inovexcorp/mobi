describe('Text Area directive', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('textArea');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.bindModel = '';
        scope.changeEvent = jasmine.createSpy('changeEvent');
        scope.displayText = '';
        scope.mutedText = '';
        scope.required = true;
        scope.textAreaName = '';
        this.element = $compile(angular.element('<text-area ng-model="bindModel" change-event="changeEvent()" display-text="displayText" muted-text="mutedText" required="required" text-area-name="textAreaName"></text-area>'))(scope);
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
            expect(scope.displayText).toEqual('');
        });
        it('mutedText should be one way bound', function() {
            this.isolatedScope.mutedText = 'Test';
            scope.$digest();
            expect(scope.mutedText).toEqual('');
        });
        it('required should be one way bound', function() {
            this.isolatedScope.required = false;
            scope.$digest();
            expect(scope.required).toBe(true);
        });
        it('textAreaName should be one way bound', function() {
            this.isolatedScope.textAreaName = 'Test';
            scope.$digest();
            expect(scope.textAreaName).toBe('');
        });
    });
    describe('contains the correct html', function() {
        beforeEach(function() {
            this.firstChild = angular.element(this.element.children()[0]);
        });
        it('for wrapping containers', function() {
            expect(this.firstChild.hasClass('form-group')).toBe(true);
        });
        it('with a custom label', function() {
            expect(this.firstChild.find('custom-label').length).toBe(1);
        });
        it('with a textarea element', function() {
            expect(this.firstChild.find('textarea').length).toBe(1);
        });
        it('depending on whether it is required or not', function() {
            var textArea = angular.element(this.firstChild.find('textarea')[0]);
            expect(textArea.attr('required')).toBeTruthy();

            scope.required = false;
            scope.$digest();
            expect(textArea.attr('required')).toBeFalsy();
        });
    });
    it('should call changeEvent when the text in the textarea changes', function() {
        var input = angular.element(this.element.find('textarea')[0]);
        input.val('Test').triggerHandler('input');
        expect(scope.changeEvent).toHaveBeenCalled();
    });
});
describe('Radio Button directive', function() {
    var $compile,
        $timeout,
        scope;

    beforeEach(function(done) {
        module('radioButton');

        // To test out a directive, you need to inject $compile and $rootScope
        // and save them to use. We save $timeout because one of the methods
        // we are testing uses it
        inject(function(_$compile_, _$rootScope_, _$timeout_) {
            $compile = _$compile_;
            $timeout = _$timeout_;
            scope = _$rootScope_;
        });

        // To use the external template you need to add the template to the
        // $templateCache so angular doesn't try to go find it
        inject(function($templateCache) {
            var directiveTemplate = null;
            var req = new XMLHttpRequest();
            req.onload = function() {
                directiveTemplate = this.responseText;
                $templateCache.put('directives/radioButton/radioButton.html', directiveTemplate);
                done();
            }
            // This path is dependent on the source path definied for the 
            // jasmine-maven-plugin in the pom.xml
            req.open('get', 'src/directives/radioButton/radioButton.html');
            req.send();
        });
    });

    // To access the functions in a directive's controller to test them directly,
    // use element.controller('controllerName')
    it('calls changeEvent if value of radio button is changed', function() {
        scope.changeEvent = jasmine.createSpy('changeEvent');
        scope.ngModel = false;
        var element = $compile(angular.element('<radio-button ng-model="ngModel" value="value" display-text="displayText" is-disabled-when="isDisabledWhen" change-event="changeEvent()"></radio-button>'))(scope);
        scope.$digest();

        // This is the way I found to trigger a radio button ng-change function
        element.find('input')[0].click();
        scope.$digest();
        // If your method uses $timeout, you need to run this method to update everything
        $timeout.flush();
        expect(scope.changeEvent).toHaveBeenCalled();
    });
    describe('in isolated scope', function() {
        beforeEach(function() {
            this.model = false;
            scope.ngModel = this.model;
            scope.value = 0;
            scope.displayText = '';
            scope.isDisabledWhen = false;
            scope.changeEvent = jasmine.createSpy('changeEvent');

            // To create a copy of the directive, use the $compile(angular.element())($rootScope) 
            // syntax
            this.element = $compile(angular.element('<radio-button ng-model="ngModel" value="value" display-text="displayText" is-disabled-when="isDisabledWhen" change-event="changeEvent()"></radio-button>'))(scope);
            // This needs to be called explicitly if you change anything with the directive,
            // being either a variable change or a function call
            scope.$digest();
        });

        it('bindModel should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.bindModel = true;
            scope.$digest();
            expect(scope.ngModel).toEqual(true);
        });
        it('value should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.value = 1;
            scope.$digest();
            expect(scope.value).toEqual(1);
        });
        it('displayText should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.displayText = 'abc';
            scope.$digest();
            expect(scope.displayText).toEqual('abc');
        });
        it('isDisabledWhen should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.isDisabledWhen = true;
            scope.$digest();
            expect(scope.isDisabledWhen).toEqual(true);
        });
        it('changeEvent should be called in parent scope when invoked', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.changeEvent();

            expect(scope.changeEvent).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for a label and radio button', function() {
            var element = $compile(angular.element('<radio-button ng-model="ngModel" value="value" display-text="displayText" is-disabled-when="isDisabledWhen" change-event="changeEvent()"></radio-button>'))(scope);
            scope.$digest();

            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('form-group'));
            var labelList = element.querySelectorAll('label');
            var inputList = element.querySelectorAll('input');
            expect(labelList.length).toBe(1);
            expect(inputList.length).toBe(1);
            var input = inputList[0];
            expect(input.type).toBe('radio');
        });
    });
});
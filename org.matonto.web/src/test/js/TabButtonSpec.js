describe('Tab Button directive', function() {
    var $compile,
        scope;

    beforeEach(function() {
        module('tabButton');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    injectDirectiveTemplate('directives/tabButton/tabButton.html');

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.isActive = false;
            scope.onClick = jasmine.createSpy('onClick');

            this.element = $compile(angular.element('<tab-button is-active="isActive" on-click="onClick()"></tab-button>'))(scope);
            scope.$digest();
        });
        it('isActive should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.isActive = true;
            scope.$digest();
            expect(scope.isActive).toEqual(true);
        });
        it('onClick should be called in parent scope when invoked', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.onClick();

            expect(scope.onClick).toHaveBeenCalled();
        });
    });
    describe('replaces the directive with the correct html', function() {
        beforeEach(function() {
            scope.isActive = false;
            scope.onClick = jasmine.createSpy('onClick');

            this.element = $compile(angular.element('<tab-button is-active="isActive" on-click="onClick()"></tab-button>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('A');
            expect(this.element.hasClass('tab-button')).toBe(true);
        });
        it('with the correct class based on isActive', function() {
            expect(this.element.hasClass('active')).toBe(false);
            scope.isActive = true;
            scope.$digest();
            expect(this.element.hasClass('active')).toBe(true);
        });
    });
    it('should call onClick when the anchor is clicked', function() {
        scope.onClick = jasmine.createSpy('onClick');
        var element = $compile(angular.element('<tab-button is-active="isActive" on-click="onClick()"></tab-button>'))(scope);
        scope.$digest();

        element.triggerHandler('click');
        expect(scope.onClick).toHaveBeenCalled();
    });
});
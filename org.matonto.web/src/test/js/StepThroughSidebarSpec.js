describe('Step Through Sidebar directive', function() {
    var $compile,
        scope;

    beforeEach(function() {
        module('templates');
        module('stepThroughSidebar');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.activeIndex = 0;
            scope.steps = [];

            this.element = $compile(angular.element('<step-through-sidebar active-index="activeIndex" steps="steps"></step-through-sidebar>'))(scope);
            scope.$digest();
        });

        it('activeIndex should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.activeIndex = 1;
            scope.$digest();
            expect(scope.activeIndex).toBe(1);
        });
        it('steps should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.steps = [''];
            scope.$digest();
            expect(scope.steps).toEqual(['']);
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            scope.activeIndex = 0;
            scope.steps = ['test1', 'test2', 'test3'];

            this.element = $compile(angular.element('<step-through-sidebar active-index="activeIndex" steps="steps"></step-through-sidebar>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('sidebar-wrapper')).toBe(true);
            expect(this.element.querySelectorAll('ul.step-through').length).toBe(1);
        });
        it('with the correct number of list items depending on steps', function() {
            expect(this.element.find('li').length).toBe(scope.steps.length);
        });
        it('with the correct classes applied based on activeIndex', function() {
            var items = this.element.find('li');
            for (var i = 0; i < items.length; i++) {
                if (i < scope.activeIndex) {
                    expect(angular.element(items[i]).hasClass('complete')).toBe(true);
                } else if (i === scope.activeIndex) {
                    expect(angular.element(items[i]).hasClass('active')).toBe(true);
                } else {
                    expect(angular.element(items[i]).hasClass('upcoming')).toBe(true);
                }
            };
        });
        it('with no arrow on the last list item', function() {
            var items = this.element.find('li');
            expect(items[items.length - 1].querySelectorAll('i').length).toBe(0);
        });
    });
});
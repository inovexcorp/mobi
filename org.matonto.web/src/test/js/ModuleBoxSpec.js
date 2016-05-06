describe('Module Box directive', function() {
    var $compile,
        scope,
        element;

    beforeEach(function() {
        module('moduleBox');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    injectDirectiveTemplate('modules/home/directives/moduleBox/moduleBox.html');

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.backgroundColor = '#fff';
            scope.headerText = 'header';
            scope.iconName = 'icon';

            element = $compile(angular.element('<module-box background-color="{{backgroundColor}}" header-text="{{headerText}}" icon-name="{{iconName}}"></module-box>'))(scope);
            scope.$digest();
        });

        it('props should be one way bound', function() {
            var isolatedScope = element.isolateScope();
            isolatedScope.backgroundColor = '#000';
            isolatedScope.headerText = 'isolated-header';
            isolatedScope.iconName = 'isolated-icon';
            scope.$digest();

            expect(scope.backgroundColor).toBe('#fff');
            expect(scope.headerText).toBe('header');
            expect(scope.iconName).toBe('icon');
        });
        it('isolated scope variables should match the scope variables', function() {
            var isolatedScope = element.isolateScope();
            expect(isolatedScope.backgroundColor).toBe(scope.backgroundColor);
            expect(isolatedScope.headerText).toBe(scope.headerText);
            expect(isolatedScope.iconName).toBe(scope.iconName);
        });
    });

    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            scope.backgroundColor = '#fff';
            scope.headerText = 'header';
            scope.iconName = 'icon';

            element = $compile(angular.element('<module-box background-color="{{backgroundColor}}" header-text="{{headerText}}" icon-name="{{iconName}}"></module-box>'))(scope);
            scope.$digest();
        });
        it('for div tag', function() {
            expect(element.prop('tagName')).toBe('DIV');
        });
        it('for class selectors', function() {
            var contents = element.querySelectorAll('.content');
            expect(contents.length).toBe(1);
            var iconWrappers = element.querySelectorAll('.icon-wrapper');
            expect(iconWrappers.length).toBe(1);
            var headers = element.querySelectorAll('h2');
            expect(headers.length).toBe(1);
            var descriptions = element.querySelectorAll('.description');
            expect(descriptions.length).toBe(1);
        });
    });
});
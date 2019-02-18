describe('Breadcrumbs directive', function() {
    var $compile, scope, discoverStateSvc;

    beforeEach(function() {
        module('templates');
        module('breadcrumbs');
        mockDiscoverState();

        inject(function(_$compile_, _$rootScope_, _discoverStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            discoverStateSvc = _discoverStateService_;
        });

        scope.items = ['', ''];
        scope.onClick = jasmine.createSpy('onClick');
        this.element = $compile(angular.element('<breadcrumbs items="items" on-click="onClick()"></breadcrumbs>'))(scope);
        scope.$digest();
        this.isolatedScope = this.element.isolateScope();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        discoverStateSvc = null;
        this.element.remove();
    });

    describe('in isolated scope', function() {
        it('items should be one way bound', function() {
            this.isolatedScope.items = [];
            scope.$digest();
            expect(scope.items).toEqual(['', '']);
        });
        it('onClick to be called in parent scope', function() {
            this.isolatedScope.onClick();
            expect(scope.onClick).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('OL');
            expect(this.element.hasClass('breadcrumbs')).toBe(true);
            expect(this.element.hasClass('breadcrumb')).toBe(true);
        });
        it('depending on how many entities are in the path', function() {
            expect(this.element.find('li').length).toBe(2);
        });
        it('depending on whether an entity is the last in the list', function() {
            var items = this.element.find('li');

            var firstItem = angular.element(items[0]);
            expect(firstItem.hasClass('active')).toBe(false);
            expect(firstItem.find('span').length).toBe(0);
            expect(firstItem.find('a').length).toBe(1);

            var secondItem = angular.element(items[1]);
            expect(secondItem.hasClass('active')).toBe(true);
            expect(secondItem.find('span').length).toBe(1);
            expect(secondItem.find('a').length).toBe(0);
        });
    });
});
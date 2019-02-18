describe('Discover Tabset directive', function() {
    var $compile, scope, discoverStateSvc;

    beforeEach(function() {
        module('templates');
        module('discoverTabset');
        mockDiscoverState();

        inject(function(_$compile_, _$rootScope_, _discoverStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            discoverStateSvc = _discoverStateService_;
        });

        this.element = $compile(angular.element('<discover-tabset></discover-tabset>'))(scope);
        scope.$digest();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        discoverStateSvc = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('discover-tabset')).toBe(true);
        });
        it('with a tabset', function() {
            expect(this.element.find('tabset').length).toBe(1);
        });
        it('with tabs', function() {
            expect(this.element.find('tab').length).toBe(3);
        });
        it('with explore-tab', function() {
            expect(this.element.find('explore-tab').length).toBe(1);
        });
        it('with query-tab', function() {
            expect(this.element.find('query-tab').length).toBe(1);
        });
        it('with search-tab', function() {
            expect(this.element.find('discover-search-tab').length).toBe(1);
        });
    });
});
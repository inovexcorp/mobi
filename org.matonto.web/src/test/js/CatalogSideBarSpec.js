describe('Catalog Side Bar directive', function() {
    var $compile,
        scope;

    beforeEach(function() {
        module('templates');
        module('catalogSideBar');
        mockCatalogManager();

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    describe('fills the element with the correct html', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<catalog-side-bar></catalog-side-bar>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('CATALOG-SIDE-BAR');
            var leftNav = this.element.find('left-nav');
            expect(leftNav.length).toBe(1);
            expect(leftNav.hasClass('catalog-side-bar')).toBe(true);
        });
    });
});
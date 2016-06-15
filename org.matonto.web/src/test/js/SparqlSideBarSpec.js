describe('SPARQL Side Bar directive', function() {
    var $compile,
        scope;

    beforeEach(function() {
        module('templates');
        module('sparqlSideBar');
        mockCatalogManager();

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    describe('fills the element with the correct html', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<sparql-side-bar></sparql-side-bar>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('SPARQL-SIDE-BAR');
            var leftNav = this.element.find('left-nav');
            expect(leftNav.length).toBe(1);
            expect(leftNav.hasClass('sparql-side-bar')).toBe(true);
        });
        it('with the correct number of nav items', function() {
            expect(this.element.find('left-nav-item').length).toBe(1);
        });
    });
});
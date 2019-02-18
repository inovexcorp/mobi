describe('Discover Search Tab directive', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('discoverSearchTab');
        mockDiscoverState();

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        this.element = $compile(angular.element('<discover-search-tab></discover-search-tab>'))(scope);
        scope.$digest();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('discover-search-tab')).toBe(true);
            expect(this.element.hasClass('row')).toBe(true);
        });
        it('with a search-form', function() {
            expect(this.element.find('search-form').length).toEqual(1);
        });
        it('with a block', function() {
            expect(this.element.find('block').length).toEqual(1);
        });
        it('with a block-content', function() {
            expect(this.element.find('block-content').length).toEqual(1);
        });
        it('with a sparql-result-table', function() {
            expect(this.element.find('sparql-result-table').length).toEqual(1);
        });
    });
});
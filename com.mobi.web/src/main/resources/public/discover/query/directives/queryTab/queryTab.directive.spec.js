describe('Query Tab directive', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('queryTab');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        this.element = $compile(angular.element('<query-tab></query-tab>'))(scope);
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
            expect(this.element.hasClass('query-tab')).toBe(true);
            expect(this.element.hasClass('row')).toBe(true);
        });
        it('with a block', function() {
            expect(this.element.find('block').length).toEqual(1);
        });
        it('with a block-content', function() {
            expect(this.element.find('block-content').length).toEqual(1);
        });
        it('with a sparql-editor', function() {
            expect(this.element.find('sparql-editor').length).toEqual(1);
        });
        it('with a sparql-result-block', function() {
            expect(this.element.find('sparql-result-block').length).toEqual(1);
        });
    });
});
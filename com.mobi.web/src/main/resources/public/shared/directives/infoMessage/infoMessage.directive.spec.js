describe('Info Message directive', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('infoMessage');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        this.element = $compile(angular.element('<info-message></info-message>'))(scope);
        scope.$digest();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping-containers', function() {
            expect(this.element.prop('tagName')).toBe('P');
            expect(this.element.hasClass('info-message')).toBe(true);
            expect(this.element.hasClass('text-info')).toBe(true);
        });
        it('with a i.fa-info', function() {
            var items = this.element.find('i');
            expect(items.length).toBe(1);
            expect(items.hasClass('fa-info')).toEqual(true);
        });
        it('with a span', function() {
            expect(this.element.find('span').length).toBe(1);
        });
    });
});
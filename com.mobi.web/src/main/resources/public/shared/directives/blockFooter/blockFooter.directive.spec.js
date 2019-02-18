describe('Block footer directive', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('blockFooter');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        var parent = $compile('<div></div>')(scope);
        parent.data('$blockController', {});
        this.element = angular.element('<block-footer></block-footer>');
        parent.append(this.element);
        this.element = $compile(this.element)(scope);
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
            expect(this.element.hasClass('block-footer')).toBe(true);
        });
    });
});

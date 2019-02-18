describe('Block content directive', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('blockContent');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        var parent = $compile('<div></div>')(scope);
        parent.data('$blockController', {});
        this.element = angular.element('<block-content></block-content>');
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
        it('for wraping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('block-content')).toBe(true);
        });
    });
});

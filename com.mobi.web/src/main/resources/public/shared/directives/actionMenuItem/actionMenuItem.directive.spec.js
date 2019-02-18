describe('Action Menu Item directive', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('actionMenuItem');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        var parent = $compile('<div></div>')(scope);
        parent.data('$actionMenuController', {});
        this.element = $compile(angular.element('<action-menu-item></action-menu-item>'))(scope);
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
            expect(this.element.prop('tagName')).toBe('A');
            expect(this.element.hasClass('action-menu-item')).toBe(true);
            expect(this.element.hasClass('dropdown-item')).toBe(true);
        });
        it('with an i', function() {
            expect(this.element.find('i').length).toEqual(1);
        });
    });
});

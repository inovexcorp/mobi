describe('Action Menu directive', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('actionMenu');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        this.element = $compile(angular.element('<action-menu></action-menu>'))(scope);
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
            expect(this.element.hasClass('action-menu')).toBe(true);
        });
        it('with a button', function() {
            var button = this.element.find('button');
            expect(button.length).toEqual(1);
            expect(button.hasClass('dropdown-toggle')).toEqual(true);
        });
        it('with a .dropdown-menu', function() {
            expect(this.element.querySelectorAll('.dropdown-menu').length).toEqual(1);
        });
    });
});

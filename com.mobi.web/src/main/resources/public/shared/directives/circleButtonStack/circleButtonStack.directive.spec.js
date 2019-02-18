describe('Circle Button Stack directive', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('circleButtonStack');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        this.element = $compile(angular.element('<circle-button-stack></circle-button-stack>'))(scope);
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
        });
        it('with a .hidden-buttons', function() {
            expect(this.element.querySelectorAll('.hidden-buttons').length).toBe(1);
        });
        it('with a circle-button', function() {
            expect(this.element.find('circle-button').length).toBe(1);
        });
    });
});
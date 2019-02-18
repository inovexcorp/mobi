describe('Focus Me directive', function() {
    var $compile, scope;

    beforeEach(function() {
        module('focusMe');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.focus = false
        this.element = $compile(angular.element('<input type="text" focus-me="focus" />'))(scope);
        scope.$digest();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    it('should set the focus on timeout', function() {
        spyOn(this.element[0], 'focus');
        scope.focus = true;
        scope.$digest();
        expect(this.element[0].focus).toHaveBeenCalled();
    });
});
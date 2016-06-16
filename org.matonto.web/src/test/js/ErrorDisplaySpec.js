describe('Error Display directive', function() {
    var $compile,
        element,
        scope;

    beforeEach(function() {
        module('templates');
        module('errorDisplay');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            element = $compile(angular.element('<error-display></error-display>'))(scope);
            scope.$digest();
        });
        it('for a p', function() {
            expect(element.prop('tagName')).toBe('P');
        });
        it('based on .error-msg', function() {
            expect(element.hasClass('error-msg')).toBe(true);
        });
        it('based on i', function() {
            var items = element.querySelectorAll('i');
            expect(items.length).toBe(1);
        });
        it('based on h6', function() {
            var items = element.querySelectorAll('span');
            expect(items.length).toBe(1);
        });
    });
});
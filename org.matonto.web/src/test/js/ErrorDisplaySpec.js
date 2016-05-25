describe('Error Display directive', function() {
    var $compile,
        element,
        scope;

    beforeEach(function() {
        module('errorDisplay');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    injectDirectiveTemplate('modules/ontology-editor/directives/errorDisplay/errorDisplay.html');

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
        _.forEach(['i', 'span'], function(item) {
            it('based on ' + item, function() {
                var items = element.querySelectorAll(item);
                expect(items.length).toBe(1);
            });
        });
    });
});
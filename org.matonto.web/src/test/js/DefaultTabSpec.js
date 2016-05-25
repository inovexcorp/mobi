describe('Default Tab directive', function() {
    var $compile,
        element,
        scope;

    beforeEach(function() {
        module('defaultTab');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    injectDirectiveTemplate('modules/ontology-editor/directives/defaultTab/defaultTab.html');

    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            element = $compile(angular.element('<default-tab></default-tab>'))(scope);
            scope.$digest();
        });
        it('for a div', function() {
            expect(element.prop('tagName')).toBe('DIV');
        });
        it('based on tab .tab class', function() {
            expect(element.hasClass('tab')).toBe(true);
        });
        it('based on .lead', function() {
            var leads = element.querySelectorAll('.lead');
            expect(leads.length).toBe(1);
        });
        it('based on <p>s', function() {
            var ps = element.querySelectorAll('p');
            expect(ps.length).toBe(2);
        });
    });
});
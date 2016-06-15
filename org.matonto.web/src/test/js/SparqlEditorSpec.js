describe('SPARQL Editor directive', function() {
    var $compile,
        scope;

    injectTrustedFilter();
    injectHighlightFilter();
    mockPrefixes();

    beforeEach(function() {
        module('templates');
        module('sparqlEditor');

        module(function($provide) {
            $provide.value('escapeHTMLFilter', jasmine.createSpy('escapeHTMLFilter'));
        });

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    describe('replaces the element with the correct html', function() {
        it('for a form', function() {
            var element = $compile(angular.element('<sparql-editor></sparql-editor>'))(scope);
            scope.$digest();

            expect(element.prop('tagName')).toBe('FORM');
        });
        it('based on form-group', function() {
            var element = $compile(angular.element('<sparql-editor></sparql-editor>'))(scope);
            scope.$digest();

            var formGroups = element.querySelectorAll('.form-group');
            expect(formGroups.length).toBe(1);
        });
        it('based on ui-codemirror', function() {
            var element = $compile(angular.element('<sparql-editor></sparql-editor>'))(scope);
            scope.$digest();

            var codeMirrors = element.querySelectorAll('ui-codemirror');
            expect(codeMirrors.length).toBe(1);
        });
    });
});
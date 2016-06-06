describe('SPARQL Editor directive', function() {
    var $compile,
        scope;

    beforeEach(function() {
        module('templates');
        module('sparqlEditor');

        module(function($provide) {
            $provide.value('escapeHTMLFilter', jasmine.createSpy('escapeHTMLFilter'));
            $provide.value('highlightFilter', jasmine.createSpy('highlightFilter'));
            $provide.value('trustedFilter', jasmine.createSpy('trustedFilter'));
            $provide.value('prefixes', jasmine.createSpy('prefixes'));
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
        it('based on top-action-container', function() {
            var element = $compile(angular.element('<sparql-editor></sparql-editor>'))(scope);
            scope.$digest();

            var actionContainers = element.querySelectorAll('.top-action-container');
            expect(actionContainers.length).toBe(1);
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
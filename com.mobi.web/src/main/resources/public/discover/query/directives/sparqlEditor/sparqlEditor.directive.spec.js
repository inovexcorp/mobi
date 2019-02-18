describe('SPARQL Editor directive', function() {
    var $compile, scope, prefixes;

    beforeEach(function() {
        module('templates');
        module('sparqlEditor');
        injectTrustedFilter();
        injectHighlightFilter();
        mockPrefixes();
        mockSparqlManager();

        module(function($provide) {
            $provide.value('escapeHTMLFilter', jasmine.createSpy('escapeHTMLFilter'));
        });

        inject(function(_$compile_, _$rootScope_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            prefixes = _prefixes_;
        });

        this.element = $compile(angular.element('<sparql-editor></sparql-editor>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('sparqlEditor');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        prefixes = null;
        this.element.remove();
    });

    describe('initializes with the correct values', function() {
        it('for prefixes', function() {
            expect(this.controller.prefixList.length).toBe(_.keys(prefixes).length);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for a form', function() {
            expect(this.element.prop('tagName')).toBe('FORM');
        });
        it('based on form-group', function() {
            expect(this.element.querySelectorAll('.form-group').length).toBe(1);
        });
        it('with a dataset-form-group', function() {
            expect(this.element.find('dataset-form-group').length).toBe(1);
        });
        it('with a ui-codemirror', function() {
            expect(this.element.find('ui-codemirror').length).toBe(1);
        });
    });
});
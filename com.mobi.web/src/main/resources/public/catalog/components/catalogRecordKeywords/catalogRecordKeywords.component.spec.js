
describe('Catalog Record Keywords component', function() {
    var $compile, scope, prefixes;

    beforeEach(function() {
        module('templates');
        module('catalog');
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            prefixes = _prefixes_;
        });

        this.keywords = [{'@value': 'B'}, {'@value': 'A'}];
        scope.record = {
            [prefixes.catalog + 'keyword']: this.keywords
        };
        this.element = $compile(angular.element('<catalog-record-keywords record="record"></catalog-record-keywords>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('catalogRecordKeywords');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        prefixes = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('record should be one way bound', function() {
            this.controller.record = {a: 'b'};
            scope.$digest();
            expect(scope.record).not.toEqual({a: 'b'});
        });
    });
    describe('initializes correctly', function() {
        it('with keywords', function() {
            expect(this.controller.keywords).toEqual(['A', 'B']);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('CATALOG-RECORD-KEYWORDS');
            expect(this.element.querySelectorAll('.catalog-record-keywords').length).toBe(1);
        });
        it('depending on the number of keywords', function() {
            expect(this.element.querySelectorAll('.keyword').length).toEqual(this.keywords.length);

            this.controller.keywords = [];
            scope.$digest();
            expect(this.element.querySelectorAll('.keyword').length).toEqual(0);
        });
    });
});
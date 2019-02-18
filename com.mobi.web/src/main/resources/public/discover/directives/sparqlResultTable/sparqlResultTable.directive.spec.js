describe('SPARQL Result Table directive', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('sparqlResultTable');
        injectTrustedFilter();

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.data = [
            {
                var1: {type: 'a-type1', value: 'a-value1'},
                var2: {type: 'a-type2', value: 'a-value2'}
            },
            {
                var1: {type: 'b-type1', value: 'b-value1'},
                var2: {type: 'b-type2', value: 'b-value2'}
            }
        ];
        scope.bindings = ['var1', 'var2'];
        scope.headers = {var1: 'var1', var2: 'var2'};
        this.element = $compile(angular.element('<sparql-result-table bindings="bindings" data="data" headers="headers"></sparql-result-table>'))(scope);
        scope.$digest();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            this.isolatedScope = this.element.isolateScope();
        });
        it('data is one way bound', function() {
            this.isolatedScope.data = [];
            scope.$digest();
            expect(scope.data).toEqual([
                {
                    var1: {type: 'a-type1', value: 'a-value1'},
                    var2: {type: 'a-type2', value: 'a-value2'}
                },
                {
                    var1: {type: 'b-type1', value: 'b-value1'},
                    var2: {type: 'b-type2', value: 'b-value2'}
                }
            ]);
        });
        it('bindings is one way bound', function() {
            this.isolatedScope.bindings = [];
            scope.$digest();
            expect(scope.bindings).toEqual(['var1', 'var2']);
        });
        it('headers is one way bound', function() {
            this.isolatedScope.headers = [];
            scope.$digest();
            expect(scope.headers).toEqual({var1: 'var1', var2: 'var2'});
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('TABLE');
            expect(this.element.hasClass('sparql-result-table')).toBe(true);
            expect(this.element.hasClass('table')).toBe(true);
        });
        it('depending on how many binding names there are', function() {
            var theadList = this.element.querySelectorAll('thead');
            expect(this.element.html()).not.toContain('None');
            expect(theadList.length).toBe(1);
            var thead = theadList[0];
            expect(thead.querySelectorAll('th').length).toBe(scope.bindings.length);
        });
        it('depending on how many results there are', function() {
            var tbodyList = this.element.querySelectorAll('tbody');
            expect(this.element.html()).not.toContain('None');
            expect(tbodyList.length).toBe(1);
            var tbody = tbodyList[0];
            expect(tbody.querySelectorAll('tr').length).toBe(scope.data.length);
        });
    });
});
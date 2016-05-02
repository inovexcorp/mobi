describe('SPARQL Result Table directive', function() {
    var $compile,
        $window,
        scope,
        sparqlSvc;

    mockSparqlManager();

    beforeEach(function() {
        module('sparqlResultTable');

        inject(function(sparqlService) {
            sparqlSvc = sparqlService;
        });

        inject(function(_$compile_, _$rootScope_, _$window_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $window = _$window_;
        });
    });

    injectDirectiveTemplate('modules/sparql/directives/sparqlResultTable/sparqlResultTable.html');

    describe('replaces the element with the correct html', function() {
        it('for a div', function() {
            var element = $compile(angular.element('<sparql-result-table></sparql-result-table>'))(scope);
            scope.$digest();

            expect(element.prop('tagName')).toBe('DIV');
        });
        it('based on table', function() {
            var element = $compile(angular.element('<sparql-result-table></sparql-result-table>'))(scope);
            scope.$digest();

            var table = element.querySelectorAll('.table');
            expect(table.length).toBe(1);
        });
        it('ths should match sparqlService.response.head.vars.length', function() {
            scope.sparqlService = sparqlSvc;
            var element = $compile(angular.element('<sparql-result-table></sparql-result-table>'))(scope);
            scope.$digest();

            var theadList = element.querySelectorAll('thead');
            expect(element.html()).not.toContain('None');
            expect(theadList.length).toBe(1);
            var thead = theadList[0];
            expect(thead.querySelectorAll('th').length).toBe(scope.sparqlService.response.head.vars.length);
        });
        it('trs should match sparqlService.response.results.bindings.length', function() {
            scope.sparqlService = sparqlSvc;
            var element = $compile(angular.element('<sparql-result-table></sparql-result-table>'))(scope);
            scope.$digest();

            var tbodyList = element.querySelectorAll('tbody');
            expect(element.html()).not.toContain('None');
            expect(tbodyList.length).toBe(1);
            var tbody = tbodyList[0];
            expect(tbody.querySelectorAll('tr').length).toBe(scope.sparqlService.response.results.bindings.length);
        });
        it('shows error message if populated', function() {
            scope.sparqlService = sparqlSvc;
            var element = $compile(angular.element('<sparql-result-table></sparql-result-table>'))(scope);
            scope.$digest();

            var errorP = element.querySelectorAll('.text-danger');
            expect(errorP.length).toBe(0);

            scope.sparqlService.errorMessage = 'Error message';
            element = $compile(angular.element('<sparql-result-table></sparql-result-table>'))(scope);
            scope.$digest();

            errorP = element.querySelectorAll('.text-danger');
            expect(errorP.length).toBe(1);
        });
        it('shows info message if populated', function() {
            scope.sparqlService = sparqlSvc;
            var element = $compile(angular.element('<sparql-result-table></sparql-result-table>'))(scope);
            scope.$digest();

            var errorP = element.querySelectorAll('.text-info');
            expect(errorP.length).toBe(0);

            scope.sparqlService.infoMessage = 'Info message';
            element = $compile(angular.element('<sparql-result-table></sparql-result-table>'))(scope);
            scope.$digest();

            errorP = element.querySelectorAll('.text-info');
            expect(errorP.length).toBe(1);
        });
    });
    describe('link function code', function() {
        it('resize() is called when window is resized', function() {
            var totalHeight = 200;
            var topHeight = 100;
            var html = '<div class="sparql" style="height: ' + totalHeight + 'px;"></div><div class="sparql-editor" style="height: ' + topHeight + 'px;"></div>';
            angular.element(document.body).append(html);
            var element = $compile(angular.element('<sparql-result-table></sparql-result-table>'))(scope);
            scope.$digest();

            expect(element.attr('style')).toBe(undefined);
            angular.element($window).triggerHandler('resize');
            expect(element.attr('style')).toBe('height: ' + (totalHeight - topHeight) + 'px;');
        });
    });
});
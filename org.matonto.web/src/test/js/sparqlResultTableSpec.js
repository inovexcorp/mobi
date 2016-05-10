describe('SPARQL Result Table directive', function() {
    var $compile,
        $window,
        scope,
        sparqlManagerSvc,
        element;

    mockSparqlManager();

    beforeEach(function() {
        module('sparqlResultTable');

        inject(function(sparqlManagerService) {
            sparqlManagerSvc = sparqlManagerService;
        });

        inject(function(_$compile_, _$rootScope_, _$window_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $window = _$window_;
        });

        sparqlManagerSvc.data = {
            paginatedResults: {
                results: [
                    {
                        var1: {type: 'a-type1', value: 'a-value1'},
                        var2: {type: 'a-type2', value: 'a-value2'}
                    },
                    {
                        var1: {type: 'b-type1', value: 'b-value1'},
                        var2: {type: 'b-type2', value: 'b-value2'}
                    }
                ]
            },
            bindingNames: ['var1', 'var2']
        }

        sparqlManagerSvc.results = [

        ];
    });

    injectDirectiveTemplate('modules/sparql/directives/sparqlResultTable/sparqlResultTable.html');

    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            scope.sparqlManagerService = sparqlManagerSvc;
            element = $compile(angular.element('<sparql-result-table></sparql-result-table>'))(scope);
            scope.$digest();
        });
        it('for a div', function() {
            expect(element.prop('tagName')).toBe('DIV');
        });
        it('based on table', function() {
            var table = element.querySelectorAll('.table');
            expect(table.length).toBe(1);
        });
        it('<th>s should match bindingNames length', function() {
            var theadList = element.querySelectorAll('thead');
            expect(element.html()).not.toContain('None');
            expect(theadList.length).toBe(1);
            var thead = theadList[0];
            expect(thead.querySelectorAll('th').length).toBe(scope.sparqlManagerService.data.bindingNames.length);
        });
        it('<tr>s should match results length', function() {
            var tbodyList = element.querySelectorAll('tbody');
            expect(element.html()).not.toContain('None');
            expect(tbodyList.length).toBe(1);
            var tbody = tbodyList[0];
            expect(tbody.querySelectorAll('tr').length).toBe(scope.sparqlManagerService.data.paginatedResults.results.length);
        });
        it('shows error message if populated', function() {
            var errorP = element.querySelectorAll('.text-danger');
            expect(errorP.length).toBe(0);

            scope.sparqlManagerService.errorMessage = 'Error message';
            scope.$digest();

            errorP = element.querySelectorAll('.text-danger');
            expect(errorP.length).toBe(1);
        });
        it('shows info message if populated', function() {
            var errorP = element.querySelectorAll('.text-info');
            expect(errorP.length).toBe(0);

            scope.sparqlManagerService.infoMessage = 'Info message';
            scope.$digest();

            errorP = element.querySelectorAll('.text-info');
            expect(errorP.length).toBe(1);
        });
    });
    describe('link function code', function() {
        it('resize() is called when window is resized', function() {
            var totalHeight = 200;
            var topHeight = 100;
            var paginationHeight = 0;
            var html = '<div class="sparql" style="height: ' + totalHeight + 'px;"></div><div class="sparql-editor" style="height: ' + topHeight + 'px;"></div>';
            angular.element(document.body).append(html);
            var element = $compile(angular.element('<sparql-result-table></sparql-result-table>'))(scope);
            scope.$digest();

            expect(element.attr('style')).toBe(undefined);
            angular.element($window).triggerHandler('resize');
            expect(element.attr('style')).toBe('height: ' + (totalHeight - topHeight - paginationHeight) + 'px;');
        });
    });
});
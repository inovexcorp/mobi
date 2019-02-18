describe('Column Select directive', function() {
    var $compile, scope, delimitedManagerSvc;

    beforeEach(function() {
        module('templates');
        module('columnSelect');
        mockDelimitedManager();
        injectTrustedFilter();
        injectHighlightFilter();

        inject(function(_$compile_, _$rootScope_, _delimitedManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            delimitedManagerSvc = _delimitedManagerService_;
        });

        scope.columns = [];
        scope.selectedColumn = '';
        delimitedManagerSvc.dataRows = [[]];
        this.element = $compile(angular.element('<column-select columns="columns" selected-column="selectedColumn"></column-select>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('columnSelect');
    });

    afterEach(function () {
        $compile = null;
        scope = null;
        delimitedManagerSvc = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('selectedColumn should be two way bound', function() {
            this.controller.selectedColumn = '0';
            scope.$digest();
            expect(scope.selectedColumn).toEqual('0');
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('column-select')).toBe(true);
        });
        it('with a column select', function() {
            expect(this.element.find('ui-select').length).toBe(1);
        });
        it('with a .form-text', function() {
            expect(this.element.querySelectorAll('.form-text').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        it('should test whether the header for a column index matches', function() {
            delimitedManagerSvc.getHeader.and.returnValue('a');
            [{expected: 'a', result: true}, {expected: 'A', result: true}, {expected: 'b', result: false}]
                .forEach(function(test) {
                    expect(this.controller.compare('0', test.expected)).toBe(test.result);
                    expect(delimitedManagerSvc.getHeader).toHaveBeenCalledWith('0');
                }, this);
        });
        it('should get a preview of a column value', function() {
            delimitedManagerSvc.dataRows = [['first'], ['second']];
            this.controller.selectedColumn = '0';
            expect(this.controller.getValuePreview()).toBe('second');
            delimitedManagerSvc.containsHeaders = false;
            expect(this.controller.getValuePreview()).toBe('first');
        });
    });
});
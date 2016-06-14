describe('Column Select directive', function() {
    var $compile,
        scope;

    beforeEach(function() {
        module('templates');
        module('columnSelect');

        module(function($provide) {
            $provide.value('highlightFilter', jasmine.createSpy('highlightFilter'));
            $provide.value('trustedFilter', jasmine.createSpy('trustedFilter'));
        });

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.columns = [];
            scope.selectedColumn = '';

            this.element = $compile(angular.element('<column-select columns="columns" selected-column="selectedColumn"></column-select>'))(scope);
            scope.$digest();
        });
        it('columns should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.columns = ['test'];
            scope.$digest();
            expect(scope.columns).toEqual(['test']);
        });
        it('selectedColumn should be two way bound', function() {
            var controller = this.element.controller('columnSelect');
            controller.selectedColumn = 'test';
            scope.$digest();
            expect(scope.selectedColumn).toEqual('test');
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            var element = $compile(angular.element('<column-select columns="columns" selected-column="selectedColumn"></column-select>'))(scope);;
            scope.$digest();

            expect(element.hasClass('column-select')).toBe(true);
        });
        it('with a column select', function() {
            var element = $compile(angular.element('<column-select columns="columns" selected-column="selectedColumn"></column-select>'))(scope);;
            scope.$digest();

            expect(element.find('ui-select').length).toBe(1);
        });
    });
});
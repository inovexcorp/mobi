describe('Column Form directive', function() {
    var $compile,
        scope;

    beforeEach(function() {
        module('columnForm');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    injectDirectiveTemplate('modules/mapper/directives/columnForm/columnForm.html');

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.set = jasmine.createSpy('set');
            scope.setNext = jasmine.createSpy('setNext');
            scope.lastProp = false;
            scope.columns = [];
            scope.selectedColumn = '';

            this.element = $compile(angular.element('<column-form set="set(column)" set-next="setNext(column)" last-prop="lastProp" columns="columns" selected-column="selectedColumn"></column-form>'))(scope);
            scope.$digest();
        });
        it('lastProp should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.lastProp = true;
            scope.$digest();
            expect(scope.lastProp).toEqual(true);
        });
        it('columns should be two way bound', function() {
            var controller = this.element.controller('columnForm');
            controller.columns = ['test'];
            scope.$digest();
            expect(scope.columns).toEqual(['test']);
        });
        it('selectedColumn should be two way bound', function() {
            var controller = this.element.controller('columnForm');
            controller.selectedColumn = 'test';
            scope.$digest();
            expect(scope.selectedColumn).toEqual('test');
        });
        it('set should be called in the parent scope', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.set();

            expect(scope.set).toHaveBeenCalled();
        });
        it('setNext should be called in the parent scope', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.setNext();

            expect(scope.setNext).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            var element = $compile(angular.element('<column-form set="set(column)" set-next="setNext(column)" last-prop="lastProp" columns="columns" selected-column="selectedColumn"></column-form>'))(scope);
            scope.$digest();

            expect(element.hasClass('column-form')).toBe(true);
        });
        it('with a column select', function() {
            var element = $compile(angular.element('<column-form set="set(column)" set-next="setNext(column)" last-prop="lastProp" columns="columns" selected-column="selectedColumn"></column-form>'))(scope);
            scope.$digest();

            expect(element.find('column-select').length).toBe(1);
        });
        it('depending on whether a column is selected', function() {
            var element = $compile(angular.element('<column-form set="set(column)" set-next="setNext(column)" last-prop="lastProp" columns="columns" selected-column="selectedColumn"></column-form>'))(scope);
            scope.$digest();
            var buttons = element.find('custom-button');
            expect(buttons.length).toBe(0);
            
            element.controller('columnForm').selectedColumn = 'test';
            scope.$digest();
            buttons = element.find('custom-button');
            expect(buttons.length).toBe(2);
            expect(['Set', 'Set &amp; Next'].indexOf(angular.element(buttons[0]).text()) >= 0).toBe(true);
            expect(['Set', 'Set & Next'].indexOf(angular.element(buttons[1]).text()) >= 0).toBe(true);
        });
    });
});
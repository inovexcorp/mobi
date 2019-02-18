describe('Dataset Form Group directive', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('datasetFormGroup');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.bindModel = '';
        scope.onSelect = jasmine.createSpy('onSelect');
        this.element = $compile(angular.element('<dataset-form-group ng-model="bindModel" on-select="onSelect()"></dataset-form-group>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('datasetFormGroup');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('in isolated scope', function() {
        it('onChange should be called in parent scope', function() {
            this.element.isolateScope().onSelect();
            expect(scope.onSelect).toHaveBeenCalled();
        });
    });
    describe('controller bound variable', function() {
        it('bindModel should be two way bound', function() {
            this.controller.bindModel = 'different';
            scope.$digest();
            expect(scope.bindModel).toEqual('different');
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('dataset-form-group')).toBe(true);
            expect(this.element.hasClass('form-group')).toBe(true);
        });
        it('with a custom-label', function() {
            expect(this.element.find('custom-label').length).toBe(1);
        });
        it('with a .flex-container', function() {
            expect(this.element.querySelectorAll('.flex-container').length).toBe(1);
        });
        it('with a dataset-select', function() {
            expect(this.element.find('dataset-select').length).toBe(1);
        });
        it('with a .btn-clear', function() {
            expect(this.element.querySelectorAll('.btn-clear').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        it('clear should clear the proper value', function() {
            this.controller.bindModel = 'test';
            this.controller.clear();
            expect(this.controller.bindModel).toBe('');
            scope.$digest();
            expect(scope.bindModel).toBe('');
        });
    });
});

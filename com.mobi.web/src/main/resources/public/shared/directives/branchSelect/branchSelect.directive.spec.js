describe('Branch Select directive', function() {
    var $compile, $timeout, scope;

    beforeEach(function() {
        module('templates');
        module('branchSelect');
        injectBranchesToDisplayFilter();
        injectTrustedFilter();
        injectHighlightFilter();
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _$timeout_) {
            $compile = _$compile_;
            $timeout = _$timeout_;
            scope = _$rootScope_;
        });

        scope.ngModel = undefined;
        scope.branches = [];
        scope.required = true;
        scope.isDisabledWhen = false;
        scope.changeEvent = jasmine.createSpy('changeEvent');
        this.element = $compile(angular.element('<branch-select ng-model="ngModel" branches="branches" is-disabled-when="isDisabledWhen" required="required" change-event="changeEvent()"></branch-select>'))(scope);
        scope.$digest();
        this.isolatedScope = this.element.isolateScope();
        this.controller = this.element.controller('branchSelect');
    });

    afterEach(function() {
        $compile = null;
        $timeout = null;
        scope = null;
        this.element.remove();
    });

    describe('in isolated scope', function() {
        it('branches should be one way bound', function() {
            this.isolatedScope.branches = [{}];
            scope.$digest();
            expect(scope.branches).toEqual([]);
        });
        it('required should be one way bound', function() {
            this.isolatedScope.required = false;
            scope.$digest();
            expect(scope.required).toEqual(true);
        });
        it('isDisabledWhen should be one way bound', function() {
            this.isolatedScope.isDisabledWhen = true;
            scope.$digest();
            expect(scope.isDisabledWhen).toEqual(false);
        });
        it('changeEvent should be called in parent scope when invoked', function() {
            this.isolatedScope.changeEvent();
            expect(scope.changeEvent).toHaveBeenCalled();
        });
    });
    describe('controller bound variable', function() {
        it('bindModel should be two way bound', function() {
            this.controller.bindModel = {};
            scope.$digest();
            expect(scope.ngModel).toEqual({});
        });
    });
    describe('controller methods', function() {
        it('should call changeEvent', function() {
            this.controller.onChange();
            $timeout.flush();
            expect(scope.changeEvent).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('branch-select')).toBe(true);
            expect(this.element.hasClass('form-group')).toBe(true);
        })
        it('with a ui-select', function() {
            expect(this.element.find('ui-select').length).toBe(1);
        });
    });
});
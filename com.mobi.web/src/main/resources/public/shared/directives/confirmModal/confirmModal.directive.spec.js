describe('Confirm Modal directive', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('confirmModal');
        injectTrustedFilter();

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.resolve = {};
        scope.close = jasmine.createSpy('close');
        scope.dismiss = jasmine.createSpy('dismiss');
        this.element = $compile(angular.element('<confirm-modal resolve="resolve" close="close()" dismiss="dismiss()"></confirm-modal>'))(scope);
        scope.$digest();
        this.isolatedScope = this.element.isolateScope();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('in isolated scope', function() {
        it('resolve should be one way bound', function() {
            this.isolatedScope.resolve = {body: ''};
            scope.$digest();
            expect(scope.resolve).toEqual({});
        });
        it('close should be called in parent scope when invoked', function() {
            this.isolatedScope.close();
            expect(scope.close).toHaveBeenCalled();
        });
        it('dismiss should be called in parent scope when invoked', function() {
            this.isolatedScope.dismiss();
            expect(scope.dismiss).toHaveBeenCalled();
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('CONFIRM-MODAL');
            expect(this.element.querySelectorAll('.modal-body').length).toBe(1);
            expect(this.element.querySelectorAll('.modal-footer').length).toBe(1);
        });
        it('with buttons for canceling and confirming', function() {
            var buttons = this.element.find('button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Yes'].indexOf(angular.element(buttons[0]).text()) >= 0).toBe(true);
            expect(['Cancel', 'Yes'].indexOf(angular.element(buttons[1]).text()) >= 0).toBe(true);
        });
    });
});
describe('Finish Overlay directive', function() {
    var $compile,
        scope;

    beforeEach(function() {
        module('templates');
        module('finishOverlay');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.save = jasmine.createSpy('save');
            scope.finish = jasmine.createSpy('finish');

            this.element = $compile(angular.element('<finish-overlay save="save()" finish="finish()"></finish-overlay>'))(scope);
            scope.$digest();
        });

        it('save should be called in the parent scope', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.save();

            expect(scope.save).toHaveBeenCalled();
        });
        it('finish should be called in the parent scope', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.finish();

            expect(scope.finish).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<finish-overlay save="save()" finish="finish()"></finish-overlay>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('finish-overlay')).toBe(true);
            expect(this.element.querySelectorAll('form.content').length).toBe(1);
        });
        it('with custom buttons for saving and finishing', function() {
            var buttons = this.element.find('custom-button');
            expect(buttons.length).toBe(2);
            expect(['Save & finish', 'Finish'].indexOf(angular.element(buttons[0]).text()) >= 0).toBe(true);
            expect(['Save & finish', 'Finish'].indexOf(angular.element(buttons[1]).text()) >= 0).toBe(true);
        });
    });
});
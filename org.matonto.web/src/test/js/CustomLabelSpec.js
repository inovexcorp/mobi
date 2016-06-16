describe('Custom Label directive', function() {
    var $compile,
        scope;

    beforeEach(function() {
        module('templates');
        module('customLabel');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.mutedText = '';

            this.element = $compile(angular.element('<custom-label muted-text="mutedText"></custom-label>'))(scope);
            scope.$digest();
        });
        it('mutedText should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.mutedText = 'Muted';
            scope.$digest();
            expect(scope.mutedText).toEqual('Muted');
        });
    });
    describe('contains the correct html', function() {
        beforeEach(function() {
            scope.mutedText = '';

            this.element = $compile(angular.element('<custom-label muted-text="mutedText"></custom-label>'))(scope);
            scope.$digest();
            this.firstChild = angular.element(this.element.children()[0]);
        });
        it('for wrapping containers', function() {
            expect(this.firstChild.hasClass('control-label')).toBe(true);
        });
        it('with small text if there is muted text', function() {
            expect(this.firstChild.find('small').length).toBe(0);
            scope.mutedText = 'Muted';
            scope.$digest();
            expect(this.firstChild.find('small').length).toBe(1);
        });
    });
});
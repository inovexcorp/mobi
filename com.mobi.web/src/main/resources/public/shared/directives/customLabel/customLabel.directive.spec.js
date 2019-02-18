describe('Custom Label directive', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('customLabel');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.mutedText = '';
        this.element = $compile(angular.element('<custom-label muted-text="mutedText"></custom-label>'))(scope);
        scope.$digest();
        this.isolatedScope = this.element.isolateScope();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('in isolated scope', function() {
        it('mutedText should be one way bound', function() {
            this.isolatedScope.mutedText = 'Muted';
            scope.$digest();
            expect(scope.mutedText).toEqual('');
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('control-label')).toBe(true);
        });
        it('with small text if there is muted text', function() {
            expect(this.element.find('small').length).toBe(0);
            scope.mutedText = 'Muted';
            scope.$digest();
            expect(this.element.find('small').length).toBe(1);
        });
    });
});
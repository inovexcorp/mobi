describe('Circle Button directive', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('circleButton');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.btnIcon = 'fa-square';
        scope.btnSmall = false;
        scope.displayText = 'text';
        this.element = $compile(angular.element('<circle-button btn-icon="btnIcon" btn-small="btnSmall" display-text="displayText"></circle-button>'))(scope);
        scope.$digest();
        this.isolatedScope = this.element.isolateScope();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('in isolated scope', function() {
        it('btnIcon should be one way bound', function() {
            this.isolatedScope.btnIcon = 'fa-square-o';
            scope.$digest();
            expect(scope.btnIcon).toEqual('fa-square');
        });
        it('btnSmall should be one way bound', function() {
            this.isolatedScope.btnSmall = true;
            scope.$digest();
            expect(scope.btnSmall).toEqual(false);
        });
        it('displayText should be one way bound', function() {
            this.isolatedScope.displayText = 'new';
            scope.$digest();
            expect(scope.displayText).toEqual('text');
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('BUTTON');
        });
        it('with a btnIcon', function() {
            expect(this.element.querySelectorAll('.' + scope.btnIcon).length).toBe(1);
        });
        it('depending on btnSmall', function() {
            expect(this.element.hasClass('small')).toBe(false);
            scope.btnSmall = true;
            scope.$digest();
            expect(this.element.hasClass('small')).toBe(true);
        });
    });
});
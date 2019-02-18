describe('Block search directive', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('blockSearch');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.keyupEvent = jasmine.createSpy('keyupEvent');
        scope.clearEvent = jasmine.createSpy('clearEvent');
        scope.bindModel = '';

        var parent = $compile('<div></div>')(scope);
        parent.data('$blockController', {});
        this.element = angular.element('<block-search ng-model="bindModel" keyup-event="keyupEvent()" clear-event="clearEvent()"></block-search>');
        parent.append(this.element);
        this.element = $compile(this.element)(scope);
        scope.$digest();
        this.isolatedScope = this.element.isolateScope();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('in isolated scope', function() {
        it('bindModel should be two way bound', function() {
            this.isolatedScope.bindModel = 'test';
            scope.$digest();
            expect(scope.bindModel).toBe('test');
        })
        it('keyupEvent should be called in parent scope when invoked', function() {
            this.isolatedScope.keyupEvent();
            expect(scope.keyupEvent).toHaveBeenCalled();
        });
        it('clearEvent should be called in parent scope when invoked', function() {
            this.isolatedScope.clearEvent();
            expect(scope.clearEvent).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('search')).toBe(true);
        });
        it('with an i', function() {
            expect(this.element.find('i').length).toBe(1);
        });
        it('with a .fa-search', function() {
            expect(this.element.querySelectorAll('.fa-search').length).toBe(1);
        });
        it('with a input', function() {
            expect(this.element.find('input').length).toBe(1);
        });
        it('with an a', function() {
            expect(this.element.find('a').length).toBe(1);
        });
        it('with a .fa-times-circle', function() {
            expect(this.element.querySelectorAll('.fa-times-circle').length).toBe(1);
        });
    });
});
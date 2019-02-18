describe('Search Bar directive', function() {
    var $compile, scope, $timeout;

    beforeEach(function() {
        module('templates');
        module('searchBar');

        inject(function(_$compile_, _$rootScope_, _$timeout_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $timeout = _$timeout_;
        });

        scope.bindModal = '';
        scope.submitEvent = jasmine.createSpy('submitEvent');
        this.element = $compile(angular.element('<search-bar ng-model="bindModel" submit-event="submitEvent()"></search-bar>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('searchBar');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $timeout = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('bindModel should be two way bound', function() {
            this.controller.bindModel = 'test';
            scope.$digest();
            expect(scope.bindModel).toBe('test');
        });
        it('submitEvent should be called in parent scope when invoked', function() {
            this.controller.submitEvent();
            expect(scope.submitEvent).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('search-bar')).toBe(true);
            expect(this.element.hasClass('input-group')).toBe(true);
        });
        it('with an input', function() {
            expect(this.element.find('input').length).toBe(1);
        });
        it('with a .input-group-icon', function() {
            expect(this.element.querySelectorAll('.input-group-icon').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        it('should perform a search if the key pressed was ENTER', function() {
            this.controller.onKeyUp({});
            expect(scope.submitEvent).not.toHaveBeenCalled();

            this.controller.onKeyUp({keyCode: 13});
            expect(scope.submitEvent).toHaveBeenCalled();
        });
    });
});
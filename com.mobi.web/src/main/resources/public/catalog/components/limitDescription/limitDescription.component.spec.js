describe('Limit Description component', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('catalog');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.description = 'test';
        scope.limit = 10;
        this.element = $compile(angular.element('<limit-description description="description" limit="limit"></limit-description>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('limitDescription');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('should initialize', function() {
        it('with a limited description', function() {
            expect(this.controller.display).toEqual(scope.description);
        });
    });
    describe('controller bound variable', function() {
        it('description is one way bound', function() {
            this.controller.description = '';
            scope.$digest();
            expect(scope.description).toEqual('test');
        });
        it('limit is one way bound', function() {
            this.controller.limit = 100;
            scope.$digest();
            expect(scope.limit).toEqual(10);
        });
    });
    describe('controller methods', function() {
        it('should toggle whether the full description should be shown', function() {
            this.controller.full = true;
            this.controller.description = 'AAAAAAAAAAAAAAAAAAAA';
            this.controller.toggleFull();
            expect(this.controller.full).toEqual(false);
            expect(this.controller.display).toEqual('AAAAAAA...');
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('LIMIT-DESCRIPTION');
        });
        it('depending on whether there is a description', function() {
            expect(this.element.querySelectorAll('.no-description').length).toEqual(0);
            expect(this.element.querySelectorAll('.description').length).toEqual(1);

            this.controller.description = '';
            scope.$digest();
            expect(this.element.querySelectorAll('.no-description').length).toEqual(1);
            expect(this.element.querySelectorAll('.description').length).toEqual(0);
        });
    });
    it('should call toggleFull when the Show link is clicked', function() {
        this.controller.description = 'AAAAAAAAAAAAAAAAAAAA';
        scope.$digest();
        spyOn(this.controller, 'toggleFull');
        var link = angular.element(this.element.querySelectorAll('.description a')[0]);
        link.triggerHandler('click');
        expect(this.controller.toggleFull).toHaveBeenCalled();
    });
});
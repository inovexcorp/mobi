describe('Advanced Language Select directive', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('advancedLanguageSelect');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.bindModel = 'test';
        this.element = $compile(angular.element('<advanced-language-select ng-model="bindModel"></advanced-language-select>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('advancedLanguageSelect');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('bindModel should be two way bound', function() {
            this.controller.bindModel = 'different';
            scope.$apply();
            expect(scope.bindModel).toEqual('different');
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('advanced-language-select')).toBe(true);
        });
        it('for correct links', function() {
            expect(this.element.querySelectorAll('.btn-link .fa-plus').length).toBe(1);
            expect(this.element.querySelectorAll('.btn-link .fa-times').length).toBe(0);
            this.controller.isShown = true;
            scope.$apply();
            expect(this.element.querySelectorAll('.btn-link .fa-plus').length).toBe(0);
            expect(this.element.querySelectorAll('.btn-link .fa-times').length).toBe(1);
        });
        it('for language-select', function() {
            expect(this.element.find('language-select').length).toBe(0);
            this.controller.isShown = true;
            scope.$apply();
            expect(this.element.find('language-select').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        it('show sets the proper variables', function() {
            this.controller.show();
            expect(this.controller.isShown).toBe(true);
            expect(this.controller.bindModel).toBe('en');
        });
        it('hide sets the proper variables', function() {
            this.controller.hide();
            expect(this.controller.isShown).toBe(false);
            expect(this.controller.bindModel).toBeUndefined();
        });
    });
});
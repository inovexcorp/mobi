describe('Language Select directive', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('languageSelect');
        mockPropertyManager();
        injectHighlightFilter();
        injectTrustedFilter();

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.bindModel = 'test';
    });

    beforeEach(function compile() {
        this.compile = function(html) {
            if (!html) {
                html = '<language-select ng-model="bindModel"></language-select>';
            }
            this.element = $compile(angular.element(html))(scope);
            scope.$digest();
            this.controller = this.element.controller('languageSelect');
            this.isolatedScope = this.element.isolateScope();
        };
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove()
    });

    describe('controller bound variable', function() {
        beforeEach(function() {
            this.compile();
        });
        it('bindModel should be two way bound', function() {
            this.controller.bindModel = 'different';
            scope.$apply();
            expect(scope.bindModel).toEqual('different');
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            this.compile();
        });
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('language-select')).toBe(true);
            expect(this.element.hasClass('form-group')).toBe(true);
        });
        it('with a custom-label', function() {
            expect(this.element.find('custom-label').length).toBe(1);
        });
        it('with a ui-select', function() {
            expect(this.element.find('ui-select').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            this.compile();
        });
        it('clear properly sets the variable', function() {
            this.controller.clear();
            scope.$apply();
            expect(scope.bindModel).toBeUndefined();
        });
    });
    describe('check required attribute', function() {
        it('when present', function() {
            this.compile('<language-select ng-model="bindModel" required></language-select>');
            expect(this.isolatedScope.required).toBe(true);
        });
        it('when missing', function() {
            this.compile();
            expect(this.isolatedScope.required).toBe(false);
        });
    });
});
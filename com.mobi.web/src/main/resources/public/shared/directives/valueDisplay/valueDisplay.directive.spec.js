describe('Value Display directive', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('valueDisplay');
        injectPrefixationFilter();
        injectTrustedFilter();
        injectHighlightFilter();
        mockUtil();
        mockDiscoverState();

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.value = {'@id': 'new'};
        scope.highlightText = 'text';
        this.element = $compile(angular.element('<value-display value="value" highlight-text="highlightText"></value-display>'))(scope);
        scope.$digest();
        this.isolatedScope = this.element.isolateScope();
        this.controller = this.element.controller('valueDisplay');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('in isolated scope', function() {
        it('value should be one way bound', function() {
            this.isolatedScope.value = {'@id': 'different'};
            scope.$digest();
            expect(this.controller.value).toEqual({'@id': 'new'});
        });
        it('highlightText should be one way bound', function() {
            this.isolatedScope.highlightText = 'new text';
            scope.$digest();
            expect(this.controller.highlightText).toEqual('text');
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('SPAN');
            expect(this.element.hasClass('value-display')).toBe(true);
        });
        it('with a .has-id', function() {
            expect(this.element.querySelectorAll('.has-id').length).toBe(1);

            this.controller.value = {};
            scope.$apply();

            expect(this.element.querySelectorAll('.has-id').length).toBe(0);
        });
        it('with a .has-value', function() {
            expect(this.element.querySelectorAll('.has-value').length).toBe(0);

            this.controller.value = {'@value': 'value'};
            scope.$apply();

            expect(this.element.querySelectorAll('.has-value').length).toBe(1);
        });
        it('with a .text-muted.lang-display', function() {
            expect(this.element.querySelectorAll('.text-muted.lang-display').length).toBe(0);

            this.controller.value = {'@value': 'value', '@language': 'en'};
            scope.$apply();

            expect(this.element.querySelectorAll('.text-muted.lang-display').length).toBe(1);
        });
        it('with a .text-muted.type-display', function() {
            expect(this.element.querySelectorAll('.text-muted.type-display').length).toBe(0);

            this.controller.value = {'@value': 'value', '@type': 'type'};
            scope.$apply();

            expect(this.element.querySelectorAll('.text-muted.type-display').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        describe('has should return', function() {
            beforeEach(function() {
                this.obj = {prop: 'value'};
            });
            it('true when property is present', function() {
                expect(this.controller.has(this.obj, 'prop')).toBe(true);
            });
            it('false when property is not present', function() {
                expect(this.controller.has(this.obj, 'missing')).toBe(false);
            });
        });
    });
});
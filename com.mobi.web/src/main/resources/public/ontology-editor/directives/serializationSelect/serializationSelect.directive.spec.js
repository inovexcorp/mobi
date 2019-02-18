describe('Serialization Select directive', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('serializationSelect');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.bindModel = '';
        this.element = $compile(angular.element('<serialization-select ng-model="bindModel"></serialization-select>'))(scope);
        scope.$digest();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('in isolated scope', function() {
        it('bindModel should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.bindModel = 'turtle';
            scope.$digest();
            expect(scope.bindModel).toEqual('turtle');
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('serialization-select')).toBe(true);
            expect(this.element.hasClass('form-group')).toBe(true);
        });
        it('with a select', function() {
            expect(this.element.find('select').length).toBe(1);
        });
        it('with options', function() {
            expect(this.element.find('option').length).toBe(5);
        });
    });
});
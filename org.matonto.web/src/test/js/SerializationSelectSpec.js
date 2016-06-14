describe('Serialization Select directive', function() {
    var $compile,
        scope,
        element;

    beforeEach(function() {
        module('templates');
        module('serializationSelect');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    beforeEach(function() {
        scope.bindModel = '';

        element = $compile(angular.element('<serialization-select ng-model="bindModel"></serialization-select>'))(scope);
        scope.$digest();
    });

    describe('in isolated scope', function() {
        it('bindModel should be two way bound', function() {
            var isolatedScope = element.isolateScope();
            isolatedScope.bindModel = 'turtle';
            scope.$digest();
            expect(scope.bindModel).toEqual('turtle');
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for a DIV', function() {
            expect(element.prop('tagName')).toBe('DIV');
        });
        it('based on select', function() {
            var selects = element.querySelectorAll('select');
            expect(selects.length).toBe(1);
        });
        it('based on options', function() {
            var options = element.querySelectorAll('option');
            expect(options.length).toBe(5);
        });
    });
});
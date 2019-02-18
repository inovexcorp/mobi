describe('Unique Value directive', function() {
    var $compile, scope;

    beforeEach(function() {
        module('uniqueValue');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.list = [];
        scope.value = '';
        this.element = $compile(angular.element('<form name="exampleForm"><input unique-value="list" ng-model="value" /></form>'))(scope);
        scope.$digest();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('should set the correct validity state', function() {
        it('if the value is empty', function() {
            expect(scope.exampleForm.$invalid).toBe(false);
        });
        it('if the value is not contained within the passed list', function() {
            scope.value = 'test';
            scope.$digest();
            expect(scope.exampleForm.$invalid).toBe(false);
        });
        it('if the value is contained within the passed list', function() {
            scope.value = 'test';
            scope.list = ['test'];
            scope.$digest();
            expect(scope.exampleForm.$invalid).toBe(true);
        });
    });
});
describe('Preferences Container component', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('settings');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.header = '';
        this.element = $compile(angular.element('<preferences-container header="header"></preferences-container>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('preferencesContainer');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('header should be one way bound', function() {
            this.controller.header = 'test';
            scope.$digest();
            expect(scope.header).toBe('');
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('PREFERENCES-CONTAINER');
        });
    });
});
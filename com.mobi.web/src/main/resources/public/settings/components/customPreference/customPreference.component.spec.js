describe('Custom Preference component', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('settings');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.header = '';
        scope.question = '';
        this.element = $compile(angular.element('<custom-preference header="header" question="question"></custom-preference>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('customPreference');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('controller bound variables', function() {
        it('header should be one way bound', function() {
            this.controller.header = 'test';
            scope.$digest();
            expect(scope.header).toBe('');
        });
        it('question should be one way bound', function() {
            this.controller.question = 'test';
            scope.$digest();
            expect(scope.question).toBe('');
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('CUSTOM-PREFERENCE');
        });
        ['.question', '.answer'].forEach(test => {
            it('with a ' + test, function() {
                expect(this.element.querySelectorAll(test).length).toBe(1);
            });
        });
    });
});
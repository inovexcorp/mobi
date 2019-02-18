describe('Settings Page component', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('settings');
        mockComponent('settings', 'profileTab');
        mockComponent('settings', 'passwordTab');
        mockComponent('settings', 'groupTab');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        this.element = $compile(angular.element('<settings-page></settings-page>'))(scope);
        scope.$digest();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('SETTINGS-PAGE');
            expect(this.element.querySelectorAll('.settings-page').length).toEqual(1);
        });
        it('with tabs', function() {
            expect(this.element.find('tab').length).toEqual(3);
        });
        ['tabset', 'profile-tab', 'group-tab', 'password-tab'].forEach(test => {
            it('with a ' + test, function() {
                expect(this.element.find(test).length).toEqual(1);
            });
        });
    });
});
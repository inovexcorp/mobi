
describe('Home Page component', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('home');
        mockComponent('home', 'quickActionGrid');
        mockComponent('home', 'activityCard');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        this.element = $compile(angular.element('<home-page></home-page>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('homePage');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('HOME-PAGE');
            expect(this.element.querySelectorAll('.home-page').length).toEqual(1);
            expect(this.element.querySelectorAll('.welcome-banner').length).toEqual(1);
        });
        ['activity-card', 'quick-action-grid'].forEach(test => {
            it('with a ' + test, function() {
                expect(this.element.find(test).length).toEqual(1);
            });
        });
    });
});
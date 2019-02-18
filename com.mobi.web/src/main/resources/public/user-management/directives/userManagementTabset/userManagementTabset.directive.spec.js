describe('User Management Tabset directive', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('userManagementTabset');
        mockUserState();

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        this.element = $compile(angular.element('<user-management-tabset></user-management-tabset>'))(scope);
        scope.$digest();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('user-management-tabset')).toBe(true);
        });
        it('with a tabset', function() {
            var tabset = this.element.find('tabset');
            expect(tabset.length).toBe(1);
            expect(tabset.hasClass('centered')).toBe(true);
        });
        it('with tabs', function() {
            expect(this.element.find('tab').length).toBe(3);
        });
    });
});
describe('Material Tab directive', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('materialTab');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.active = true;
        scope.hideTab = false;
        scope.heading = '';
        scope.onClick = jasmine.createSpy('onClick');
        var parent = angular.element('<div><material-tab active="active" heading="heading" hide-tab="hideTab" on-click="onClick()"></material-tab></div>');
        parent.data('$materialTabsetController', {
            addTab: jasmine.createSpy('addTab'),
            removeTab: jasmine.createSpy('removeTab')
        });
        this.element = $compile(parent)(scope);
        scope.$digest();
        this.elementSansWrapper = angular.element(this.element.children()[0]);
        this.isolatedScope = this.elementSansWrapper.scope();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('in isolated scope', function() {
        // TODO: Figure out how to do this test at some point
        /*it('active should be two way bound', function() {
            this.isolatedScope.active = false;
            scope.$digest();
            expect(scope.active).toEqual(false);
        });*/
        it('heading should be one way bound', function() {
            this.isolatedScope.heading = 'new';
            scope.$digest();
            expect(scope.heading).toEqual('');
        });
        it('hideTab should be one way bound', function() {
            this.isolatedScope.hideTab = true;
            scope.$digest();
            expect(scope.hideTab).toEqual(false);
        });
        it('onClick should be called in parent scope when invoked', function() {
            this.isolatedScope.onClick();
            expect(scope.onClick).toHaveBeenCalled();
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.elementSansWrapper.hasClass('material-tab')).toBe(true);
        });
    });
});

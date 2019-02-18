describe('Explore Tab directive', function() {
    var $compile, scope, discoverStateSvc;

    beforeEach(function() {
        module('templates');
        module('exploreTab');
        mockDiscoverState();

        inject(function(_$compile_, _$rootScope_, _discoverStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            discoverStateSvc = _discoverStateService_;
        });

        this.element = $compile(angular.element('<explore-tab></explore-tab>'))(scope);
        scope.$digest();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        discoverStateSvc = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('explore-tab')).toBe(true);
            expect(this.element.hasClass('row')).toBe(true);
        });
        it('with a class-block.col', function() {
            expect(this.element.querySelectorAll('class-block.col').length).toBe(1);

            discoverStateSvc.explore.breadcrumbs = ['', ''];
            scope.$apply();

            expect(this.element.querySelectorAll('class-block.col').length).toBe(0);
        });
        it('with a instance-block.col', function() {
            expect(this.element.querySelectorAll('instance-block.col').length).toBe(0);

            discoverStateSvc.explore.breadcrumbs = ['', ''];
            scope.$apply();

            expect(this.element.querySelectorAll('instance-block.col').length).toBe(1);
        });
        it('with a instance-view.col', function() {
            expect(this.element.querySelectorAll('instance-view.col').length).toBe(0);

            discoverStateSvc.explore.breadcrumbs = ['', '', ''];
            scope.$apply();

            expect(this.element.querySelectorAll('instance-view.col').length).toBe(1);
        });
        it('with a instance-editor.col', function() {
            expect(this.element.querySelectorAll('instance-editor.col').length).toBe(0);

            discoverStateSvc.explore.breadcrumbs = ['', '', ''];
            discoverStateSvc.explore.editing = true;
            scope.$apply();

            expect(this.element.querySelectorAll('instance-editor.col').length).toBe(1);
        });
        it('with a instance-creator.col', function() {
            expect(this.element.querySelectorAll('instance-creator.col').length).toBe(0);

            discoverStateSvc.explore.breadcrumbs = ['', '', ''];
            discoverStateSvc.explore.creating = true;
            scope.$apply();

            expect(this.element.querySelectorAll('instance-creator.col').length).toBe(1);
        });
    });
});
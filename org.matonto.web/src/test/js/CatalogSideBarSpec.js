describe('Catalog Side Bar directive', function() {
    var $compile,
        scope,
        windowSvc;

    beforeEach(function() {
        module('catalogSideBar');
        mockCatalogManager();
        module(function($provide) {
            $provide.service('$window', function() {
                this.open = jasmine.createSpy('open');
            });
        });

        inject(function(_$compile_, _$rootScope_, _$window_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            windowSvc = _$window_;
        });
    });

    injectDirectiveTemplate('modules/catalog/directives/catalogSideBar/catalogSideBar.html');

    describe('controller methods', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<catalog-side-bar></catalog-side-bar>'))(scope);
            scope.$digest();
        });
        it('should open the Catalog documentation', function() {
            var controller = this.element.controller('catalogSideBar');
            controller.openDocs();
            expect(windowSvc.open).toHaveBeenCalledWith('http://docs.matonto.org/#catalog');
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<catalog-side-bar></catalog-side-bar>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('catalog-side-bar')).toBe(true);
            expect(this.element.hasClass('left-nav')).toBe(true);
        });
        it('with the correct number of nav items', function() {
            expect(this.element.find('left-nav-item').length).toBe(2);
        });
    });
});
describe('SPARQL Side Bar directive', function() {
    var $compile,
        scope,
        windowSvc;

    beforeEach(function() {
        module('templates');
        module('sparqlSideBar');
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

    describe('controller methods', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<sparql-side-bar></sparql-side-bar>'))(scope);
            scope.$digest();
        });
        it('should open the SPARQL Query Editor documentation', function() {
            var controller = this.element.controller('sparqlSideBar');
            controller.openDocs();
            expect(windowSvc.open).toHaveBeenCalledWith('http://docs.matonto.org/#sparql_query_editor');
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<sparql-side-bar></sparql-side-bar>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('sparql-side-bar')).toBe(true);
            expect(this.element.hasClass('left-nav')).toBe(true);
        });
        it('with the correct number of nav items', function() {
            expect(this.element.find('left-nav-item').length).toBe(2);
        });
    });
});
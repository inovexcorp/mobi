describe('Pagination directive', function() {
    var $compile,
        scope;

    beforeEach(function() {
        module('templates');
        module('pagination');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.links = {};
            scope.currentPage = 0;
            scope.getPage = jasmine.createSpy('getPage');

            this.element = $compile(angular.element('<pagination links="links" current-page="currentPage" get-page="getPage(direction)"></pagination>'))(scope);
            scope.$digest();
        });
        it('links should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.links = {prev: 'prev'};
            scope.$digest();
            expect(scope.links).toEqual({prev: 'prev'});
        });
        it('currentPage should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.currentPage = 1;
            scope.$digest();
            expect(scope.currentPage).toBe(1);
        });
        it('getPage should be called in parent scope when invoked', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.getPage();

            expect(scope.getPage).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            scope.links = undefined;
            scope.currentPage = 0;

            this.element = $compile(angular.element('<pagination links="links" current-page="currentPage" get-page="getPage(direction)"></pagination>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('page-nav')).toBe(true);
        });
        it('depending on whether links were passed', function() {
            expect(this.element.querySelectorAll('ul.pagination').length).toBe(0);
            
            scope.links = {};
            scope.$digest();
            expect(this.element.querySelectorAll('ul.pagination').length).toBe(1);
        });
        it('depending on which links were passed', function() {
            scope.links = {};
            scope.$digest();
            expect(this.element.querySelectorAll('li a[aria-label="Previous"]').length).toBe(0);
            expect(this.element.querySelectorAll('li a[aria-label="Next"]').length).toBe(0);

            scope.links = {next: 'next', prev: 'prev'};
            scope.$digest();
            expect(this.element.querySelectorAll('li a[aria-label="Previous"]').length).toBe(1);
            expect(this.element.querySelectorAll('li a[aria-label="Next"]').length).toBe(1);
        });
    });
    it('should call getPage when either the Next or Previous link is clicked', function() {
        scope.links = {next: 'next', prev: 'prev'};
        scope.getPage = jasmine.createSpy('getPage');

        var element = $compile(angular.element('<pagination links="links" current-page="currentPage" get-page="getPage(direction)"></pagination>'))(scope);
        scope.$digest();

        var prevLink = element.querySelectorAll('li a[aria-label="Previous"]')[0];
        angular.element(prevLink).triggerHandler('click');
        expect(scope.getPage).toHaveBeenCalledWith('prev');
 
        var nextLink = element.querySelectorAll('li a[aria-label="Next"]')[0];
        angular.element(nextLink).triggerHandler('click');
        expect(scope.getPage).toHaveBeenCalledWith('next');
    });
});
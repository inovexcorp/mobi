describe('Result List directive', function() {
    var $compile,
        scope,
        catalogManagerSvc;

    mockCatalogManager();
    beforeEach(function() {
        module('resultList');

        inject(function(catalogManagerService) {
            catalogManagerSvc = catalogManagerService;
        });

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    injectDirectiveTemplate('modules/catalog/directives/resultList/resultList.html');

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.results = {};
            scope.orderBy = '';
            scope.currentPage = 0;
            scope.clickResource = jasmine.createSpy('clickResource');
            scope.changeOrder = jasmine.createSpy('changeOrder');
            scope.clickLink = jasmine.createSpy('clickLink');

            this.element = $compile(angular.element('<result-list results="results" order-by="orderBy" current-page="currentPage" click-resource="clickResource(resource)" change-order="changeOrder()" click-link="clickLink(direction, link)"></result-list>'))(scope);
            scope.$digest();
        });
        it('results should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.results = {size: 0};
            scope.$digest();
            expect(scope.results).toEqual({size: 0});
        });
        it('orderBy should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.orderBy = 'title';
            scope.$digest();
            expect(scope.orderBy).toEqual('title');
        });
        it('currentPage should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.currentPage = 1;
            scope.$digest();
            expect(scope.currentPage).toEqual(1);
        });
        it('clickResource should be called in the parent scope', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.clickResource();
            expect(scope.clickResource).toHaveBeenCalled();
        });
        it('changeOrder should be called in the parent scope', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.changeOrder();
            expect(scope.changeOrder).toHaveBeenCalled();
        });
        it('clickLink should be called in the parent scope', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.clickLink();
            expect(scope.clickLink).toHaveBeenCalled();
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            scope.results = {};
            scope.orderBy = '';
            scope.currentPage = 0;
            scope.clickResource = jasmine.createSpy('clickResource');
            scope.changeOrder = jasmine.createSpy('changeOrder');
            scope.clickLink = jasmine.createSpy('clickLink');

            this.element = $compile(angular.element('<result-list results="results" order-by="orderBy" current-page="currentPage" click-resource="clickResource(resource)" change-order="changeOrder()" click-link="clickLink(direction, link)"></result-list>'))(scope);
            scope.$digest();
        });
        it('should get the date from a resource', function() {
            var controller = this.element.controller('resultList');
            var result = controller.getDate({});

            expect(typeof result).toBe('string');
            expect(catalogManagerSvc.getDate).toHaveBeenCalledWith({});
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            scope.results = {size: 0, results: [{}]};
            scope.orderBy = '';
            scope.currentPage = 0;

            this.element = $compile(angular.element('<result-list results="results" order-by="orderBy" current-page="currentPage" click-resource="clickResource(resource)" change-order="changeOrder()" click-link="clickLink(direction, link)"></result-list>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('results')).toBe(true);
            expect(this.element.querySelectorAll('.results-header').length).toBe(1);
            expect(this.element.querySelectorAll('.results-list').length).toBe(1);
            expect(this.element.querySelectorAll('.page-nav').length).toBe(1);
        });
        it('depending on whether results were found', function() {
            var resultsHeader = angular.element(this.element.querySelectorAll('.results-header')[0]);
            expect(resultsHeader.html()).toContain('No results found');
            expect(resultsHeader.querySelectorAll('div.contents').length).toBe(0);

            scope.results.size = 1;
            scope.$digest();
            expect(resultsHeader.html()).not.toContain('No results found');
            expect(resultsHeader.querySelectorAll('div.contents').length).toBe(1);
        });
        it('with the correct number of results', function() {
            var resultsList = angular.element(this.element.querySelectorAll('.results-list')[0]);
            var results = resultsList.querySelectorAll('.result');
            expect(results.length).toBe(scope.results.results.length);
            for (var i = 0; i < results.length; i++) {
                expect(results[i].querySelectorAll('resource-type').length).toBe(1);
            }
        });
        it('depending on whether there are links', function() {
            var pageNav = angular.element(this.element.querySelectorAll('.page-nav')[0]);
            expect(pageNav.querySelectorAll('ul.pagination').length).toBe(0);
            
            scope.results.links = {};
            scope.$digest();
            expect(pageNav.querySelectorAll('ul.pagination').length).toBe(1);
            expect(pageNav.querySelectorAll('ul.pagination li').length).toBe(1);

            scope.results.links = {prev: 'test', next: 'test'};
            scope.$digest();
            expect(pageNav.querySelectorAll('ul.pagination li').length).toBe(3);
        });
    });
    it('should call changeOrder when a different order option is chosen', function() {
        scope.results = {size: 1, results: [{}]};
        scope.orderBy = '';
        scope.changeOrder = jasmine.createSpy('changeOrder');

        var element = $compile(angular.element('<result-list results="results" order-by="orderBy" current-page="currentPage" click-resource="clickResource(resource)" change-order="changeOrder()" click-link="clickLink(direction, link)"></result-list>'))(scope);
        scope.$digest();
        
        var orderSelect = element.querySelectorAll('.order-select')[0];
        angular.element(orderSelect).triggerHandler('change');
        expect(scope.changeOrder).toHaveBeenCalled();
    });
    it('should call clickResource when a resource title is clicked', function() {
        scope.results = {size: 1, results: [{}]};
        scope.clickResource = jasmine.createSpy('clickResource');

        var element = $compile(angular.element('<result-list results="results" order-by="orderBy" current-page="currentPage" click-resource="clickResource(resource)" change-order="changeOrder()" click-link="clickLink(direction, link)"></result-list>'))(scope);
        scope.$digest();
        
        var resourceTitle = element.querySelectorAll('.results-list .result a')[0];
        angular.element(resourceTitle).triggerHandler('click');
        expect(scope.clickResource).toHaveBeenCalled();
    });
    it('should call lickLink when a change page link is clicked', function() {
        scope.results = {links: {prev: 'prev', next: 'next'}, size: 1, results: [{}]};
        scope.currentPage = 0;
        scope.clickLink = jasmine.createSpy('clickLink');

        var element = $compile(angular.element('<result-list results="results" order-by="orderBy" current-page="currentPage" click-resource="clickResource(resource)" change-order="changeOrder()" click-link="clickLink(direction, link)"></result-list>'))(scope);
        scope.$digest();
        
        var prevLink = element.querySelectorAll('.page-nav .pagination li a')[0];
        angular.element(prevLink).triggerHandler('click');
        expect(scope.clickLink).toHaveBeenCalledWith('prev', scope.results.links.prev);

        var nextLink = element.querySelectorAll('.page-nav .pagination li a')[2];
        angular.element(nextLink).triggerHandler('click');
        expect(scope.clickLink).toHaveBeenCalledWith('next', scope.results.links.next);
    });
});
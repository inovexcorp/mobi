describe('Result List directive', function() {
    var $compile,
        scope,
        catalogManagerSvc;

    mockCatalogManager();
    mockOntologyManager();
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

    describe('controller methods', function() {
        beforeEach(function() {
            scope.catalogManagerService = catalogManagerSvc;
            this.element = $compile(angular.element('<result-list></result-list>'))(scope);
            scope.$digest();
        });
        it('should get the date from a resource', function() {
            var controller = this.element.controller('resultList');
            var result = controller.getDate({});

            expect(typeof result).toBe('string');
            expect(scope.catalogManagerService.getDate).toHaveBeenCalledWith({});
        });
        it('should get the ending number for the results range', function() {
            var controller = this.element.controller('resultList');
            scope.catalogManagerService.results.totalSize = 10;
            scope.catalogManagerService.results.limit = 5;
            scope.catalogManagerService.results.start = 0;
            scope.$digest();

            var result = controller.getEndingNumber();
            expect(typeof result).toBe('number');
            expect(result).toBe(5);
            scope.catalogManagerService.results.totalSize = 1;
            scope.$digest();
            result = controller.getEndingNumber();
            expect(result).toBe(1);
        });
        it('should change the result list sort', function() {
            var controller = this.element.controller('resultList');
            controller.sortOption = {
                field: 'test',
                asc: true,
                label: 'test'
            };
            controller.changeSort();
            expect(scope.catalogManagerService.sortBy).toBe(controller.sortOption.field);
            expect(scope.catalogManagerService.asc).toBe(controller.sortOption.asc);
            expect(scope.catalogManagerService.getResources).toHaveBeenCalled();
        });
        it('should get a page of results', function() {
            var controller = this.element.controller('resultList');
            var currentPage = scope.catalogManagerService.currentPage;
            var currentLinks = _.clone(scope.catalogManagerService.results.links);
            controller.getPage('next');
            expect(scope.catalogManagerService.currentPage).toBe(currentPage + 1);
            expect(scope.catalogManagerService.getResultsPage).toHaveBeenCalledWith(currentLinks.base + currentLinks.next);

            currentPage = scope.catalogManagerService.currentPage;
            currentLinks = _.clone(scope.catalogManagerService.results.links);
            controller.getPage('prev');
            expect(scope.catalogManagerService.currentPage).toBe(currentPage - 1);
            expect(scope.catalogManagerService.getResultsPage).toHaveBeenCalledWith(currentLinks.base + currentLinks.next);
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            scope.catalogManagerService = catalogManagerSvc;
            this.element = $compile(angular.element('<result-list></result-list>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('results')).toBe(true);
            expect(this.element.querySelectorAll('.results-header').length).toBe(1);
            expect(this.element.querySelectorAll('.results-list').length).toBe(1);
        });
        it('depending on whether results were found', function() {
            var resultsHeader = angular.element(this.element.querySelectorAll('.results-header')[0]);
            expect(resultsHeader.html()).toContain('No results found');
            expect(resultsHeader.querySelectorAll('div.contents').length).toBe(0);

            scope.catalogManagerService.results.size = 1;
            scope.$digest();
            expect(resultsHeader.html()).not.toContain('No results found');
            expect(resultsHeader.querySelectorAll('div.contents').length).toBe(1);
        });
        it('with the correct number of results', function() {
            scope.catalogManagerService.results.results = [{}, {distributions: []}, {distributions: [{}]}];
            scope.$digest();
            var resultsList = angular.element(this.element.querySelectorAll('.results-list')[0]);
            var results = resultsList.querySelectorAll('.result');
            expect(results.length).toBe(scope.catalogManagerService.results.results.length);
            for (var i = 0; i < results.length; i++) {
                expect(results[i].querySelectorAll('resource-type').length).toBe(1);
            }
        });
        it('depending on whether a resource has distributions', function() {
            scope.catalogManagerService.results.results = [{}, {distributions: []}, {distributions: [{}]}];
            scope.$digest();
            var resultsList = angular.element(this.element.querySelectorAll('.results-list')[0]);
            var results = resultsList.querySelectorAll('.result');
            for (var i = 0; i < results.length; i++) {
                var resource = scope.catalogManagerService.results.results[i];
                if (_.has(resource, 'distributions') && resource.distributions.length) {
                    expect(results[i].querySelectorAll('.download-btn').length).toBe(1);
                }
            }
        });
        it('with a pagination', function() {
            expect(this.element.find('pagination').length).toBe(1);
        });
    });
    it('should call changeSort when a different order option is chosen', function() {
        scope.catalogManagerService = catalogManagerSvc;
        scope.catalogManagerService.results.size = 1;
        scope.catalogManagerService.results.results = [{}];
        var element = $compile(angular.element('<result-list></result-list>'))(scope);
        scope.$digest();
        var controller = element.controller('resultList');
        spyOn(controller, 'changeSort');

        var orderSelect = element.querySelectorAll('.order-select')[0];
        angular.element(orderSelect).triggerHandler('change');
        expect(controller.changeSort).toHaveBeenCalled();
    });
    it('should set the selectedResource when a resource title is clicked', function() {
        scope.catalogManagerService = catalogManagerSvc;
        scope.catalogManagerService.results.size = 1;
        scope.catalogManagerService.results.results = [{}];
        var element = $compile(angular.element('<result-list></result-list>'))(scope);
        scope.$digest();
        
        var resourceTitle = element.querySelectorAll('.results-list .result a')[0];
        angular.element(resourceTitle).triggerHandler('click');
        expect(scope.catalogManagerService.selectedResource).toEqual(scope.catalogManagerService.results.results[0]);
    });
    it('should call downloadResource when a resource download button is clicked', function() {
        scope.catalogManagerService = catalogManagerSvc;
        scope.catalogManagerService.results.size = 1;
        scope.catalogManagerService.results.results = [{id: '0', distributions: [{}]}];
        var element = $compile(angular.element('<result-list></result-list>'))(scope);
        scope.$digest();

        var downloadButton = element.querySelectorAll('.results-list .result .download-btn')[0];
        angular.element(downloadButton).triggerHandler('click');
        expect(scope.catalogManagerService.downloadResource).toHaveBeenCalledWith(scope.catalogManagerService.results.results[0].id);
    });
});
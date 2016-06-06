describe('Resource Preview directive', function() {
    var $compile,
        scope,
        catalogManagerSvc;

    beforeEach(function() {
        module('templates');
        module('resourcePreview');
        mockCatalogManager();

        inject(function(_catalogManagerService_) {
            catalogManagerSvc = _catalogManagerService_;
        });

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    describe('controller methods', function() {
        beforeEach(function() {
            scope.catalogManagerService = catalogManagerSvc;
            this.element = $compile(angular.element('<resource-preview></resource-preview>'))(scope);
            scope.$digest();
        });
        it('should get the date from a resource', function() {
            var controller = this.element.controller('resourcePreview');
            var result = controller.getDate({});

            expect(typeof result).toBe('string');
            expect(scope.catalogManagerService.getDate).toHaveBeenCalledWith({});
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            scope.catalogManagerService = catalogManagerSvc;
            this.element = $compile(angular.element('<resource-preview></resource-preview>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('resource-preview')).toBe(true);
        });
        it('depending on whether a resource was passed', function() {
            expect(this.element.querySelectorAll('h3.text-muted').length).toBe(1);
            expect(this.element.querySelectorAll('.preview').length).toBe(0);

            scope.catalogManagerService.selectedResource = {};
            scope.$digest();
            expect(this.element.querySelectorAll('h3.text-muted').length).toBe(0);
            expect(this.element.querySelectorAll('.preview').length).toBe(1);            
        });
        it('with resource types if the resource has them', function() {
            scope.catalogManagerService.selectedResource = {};
            scope.$digest();
            expect(this.element.find('resource-type').length).toBe(0);
            scope.catalogManagerService.selectedResource = {types: []};
            scope.$digest();
            expect(this.element.find('resource-type').length).toBe(0);
            scope.catalogManagerService.selectedResource = {types: ['test']};
            scope.$digest();
            expect(this.element.find('resource-type').length).toBe(1);
        });
        it('depending on whether the resource has keywords', function() {
            scope.catalogManagerService.selectedResource = {};
            scope.$digest();
            expect(this.element.querySelectorAll('.keywords p').length).toBe(1);
            expect(angular.element(this.element.querySelectorAll('.keywords p')[0]).text().trim()).toBe('None');
            expect(this.element.querySelectorAll('.keywords ul').length).toBe(0);

            scope.catalogManagerService.selectedResource.keywords = [];
            scope.$digest();
            expect(this.element.querySelectorAll('.keywords p').length).toBe(1);
            expect(angular.element(this.element.querySelectorAll('.keywords p')[0]).text().trim()).toBe('None');
            expect(this.element.querySelectorAll('.keywords ul').length).toBe(0);

            scope.catalogManagerService.selectedResource.keywords = ['test'];
            scope.$digest();
            expect(this.element.querySelectorAll('.keywords p').length).toBe(0);
            expect(this.element.querySelectorAll('.keywords ul').length).toBe(1);
            expect(this.element.querySelectorAll('.keywords ul li').length).toBe(scope.catalogManagerService.selectedResource.keywords.length);
        });
    });
});
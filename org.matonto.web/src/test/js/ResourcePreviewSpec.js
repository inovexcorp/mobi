describe('Resource Preview directive', function() {
    var $compile,
        scope,
        catalogManagerSvc;

    mockCatalogManager();
    beforeEach(function() {
        module('resourcePreview');

        inject(function(catalogManagerService) {
            catalogManagerSvc = catalogManagerService;
        });

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    injectDirectiveTemplate('modules/catalog/directives/resourcePreview/resourcePreview.html');

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.resource = {};

            this.element = $compile(angular.element('<resource-preview resource="resource"></resource-preview>'))(scope);
            scope.$digest();
        });
        it('resource should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.resource = {'type': 'test'};
            scope.$digest();
            expect(scope.resource).toEqual({'type': 'test'});
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            scope.resource = {};

            this.element = $compile(angular.element('<resource-preview resource="resource"></resource-preview>'))(scope);
            scope.$digest();
        });
        it('should get the date from a resource', function() {
            var controller = this.element.controller('resourcePreview');
            var result = controller.getDate({});

            expect(typeof result).toBe('string');
            expect(catalogManagerSvc.getDate).toHaveBeenCalledWith({});
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            scope.resource = {};

            this.element = $compile(angular.element('<resource-preview resource="resource"></resource-preview>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('resource-preview')).toBe(true);
            expect(this.element.querySelectorAll('.keywords').length).toBe(1);
        });
        it('depending on whether a resource was passed', function() {
            expect(this.element.querySelectorAll('h3.text-muted').length).toBe(0);
            expect(this.element.querySelectorAll('.preview').length).toBe(1);

            scope.resource = undefined;
            scope.$digest();
            expect(this.element.querySelectorAll('h3.text-muted').length).toBe(1);
            expect(this.element.querySelectorAll('.preview').length).toBe(0);
        });
        it('with a resource type', function() {
            expect(this.element.find('resource-type').length).toBe(1);
        });
        it('depending on whether the resource has keywords', function() {
            expect(this.element.querySelectorAll('.keywords p').length).toBe(1);
            expect(angular.element(this.element.querySelectorAll('.keywords p')[0]).text().trim()).toBe('None');
            expect(this.element.querySelectorAll('.keywords ul').length).toBe(0);

            scope.resource.keywords = ['test'];
            scope.$digest();
            expect(this.element.querySelectorAll('.keywords p').length).toBe(0);
            expect(this.element.querySelectorAll('.keywords ul').length).toBe(1);
            expect(this.element.querySelectorAll('.keywords ul li').length).toBe(scope.resource.keywords.length);
        });
    });
});
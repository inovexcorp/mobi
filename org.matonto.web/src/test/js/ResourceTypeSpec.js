describe('Resource Type directive', function() {
    var $compile,
        scope,
        catalogManagerSvc;

    mockCatalogManager();
    beforeEach(function() {
        module('resourceType');

        inject(function(catalogManagerService) {
            catalogManagerSvc = catalogManagerService;
        });

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    injectDirectiveTemplate('modules/catalog/directives/resourceType/resourceType.html');

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.resource = {type: ''};

            this.element = $compile(angular.element('<resource-type resource="resource"></resource-type>'))(scope);
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
            scope.resource = {type: ''};

            this.element = $compile(angular.element('<resource-type resource="resource"></resource-type>'))(scope);
            scope.$digest();
        });
        it('should get the type of a resource', function() {
            var controller = this.element.controller('resourceType');
            var result = controller.getType(scope.resource);

            expect(typeof result).toBe('string');
            expect(catalogManagerSvc.getType).toHaveBeenCalledWith(scope.resource.type);
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            scope.resource = {type: ''};

            this.element = $compile(angular.element('<resource-type resource="resource"></resource-type>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('label')).toBe(true);
        });
        it('with the correct classes depending on the resource type', function() {
            var controller = this.element.controller('resourceType');
            spyOn(controller, 'getType').and.callFake(function(resource) {
                return resource.type;
            });
            scope.$digest();
            expect(this.element.hasClass('label-default')).toBe(true);

            scope.resource.type = 'Ontology';
            scope.$digest();
            expect(this.element.hasClass('label-primary')).toBe(true);

            scope.resource.type = 'Mapping';
            scope.$digest();
            expect(this.element.hasClass('label-success')).toBe(true);
        });
    });
});
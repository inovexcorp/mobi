describe('Resource Type directive', function() {
    var $compile,
        scope,
        catalogManagerSvc;

    beforeEach(function() {
        module('resourceType');
        mockCatalogManager();

        inject(function(_catalogManagerService_) {
            catalogManagerSvc = _catalogManagerService_;
        });

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    injectDirectiveTemplate('modules/catalog/directives/resourceType/resourceType.html');

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.type = '';

            this.element = $compile(angular.element('<resource-type type="type"></resource-type>'))(scope);
            scope.$digest();
        });
        it('type should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.type = 'test';
            scope.$digest();
            expect(scope.type).toEqual('test');
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            scope.type = '';

            this.element = $compile(angular.element('<resource-type type="type"></resource-type>'))(scope);
            scope.$digest();
        });
        it('should get the shorthand type string', function() {
            var controller = this.element.controller('resourceType');
            var result = controller.getType(scope.type);

            expect(typeof result).toBe('string');
            expect(catalogManagerSvc.getType).toHaveBeenCalledWith(scope.type);
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            scope.type = '';

            this.element = $compile(angular.element('<resource-type type="type"></resource-type>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('label')).toBe(true);
        });
        it('with the correct classes depending on the resource type', function() {
            var controller = this.element.controller('resourceType');
            spyOn(controller, 'getType').and.callFake(_.identity);
            scope.$digest();
            expect(this.element.hasClass('label-default')).toBe(true);

            scope.type = 'Ontology';
            scope.$digest();
            expect(this.element.hasClass('label-primary')).toBe(true);

            scope.type = 'Mapping';
            scope.$digest();
            expect(this.element.hasClass('label-success')).toBe(true);
        });
    });
});
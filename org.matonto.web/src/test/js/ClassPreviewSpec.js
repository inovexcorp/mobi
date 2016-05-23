describe('Class Preview directive', function() {
    var $compile,
        scope,
        ontologyManagerSvc;

    beforeEach(function() {
        module('classPreview');
        mockOntologyManager();

        inject(function(_ontologyManagerService_) {
            ontologyManagerSvc = _ontologyManagerService_;
        });

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    injectDirectiveTemplate('modules/mapper/directives/classPreview/classPreview.html');

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.classObj = {};

            this.element = $compile(angular.element('<class-preview class-obj="classObj"></class-preview>'))(scope);
            scope.$digest();
        });

        it('classObj should be two way bound', function() {
            var controller = this.element.controller('classPreview');
            controller.classObj = {matonto: {}};
            scope.$digest();
            expect(scope.classObj).toEqual({matonto: {}});
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            scope.classObj = {matonto: {properties: [{}]}};

            this.element = $compile(angular.element('<class-preview class-obj="classObj"></class-preview>'))(scope);
            scope.$digest();
        });
        it('should create a title for classObj', function() {
            var controller = this.element.controller('classPreview');
            var result = controller.createTitle();

            expect(ontologyManagerSvc.getEntityName).toHaveBeenCalledWith(controller.classObj);
            expect(typeof result).toBe('string');
        });
        it('should retrieve the list of properties for classObj', function() {
            ontologyManagerSvc.getEntityName.calls.reset();
            var controller = this.element.controller('classPreview');
            var result = controller.createPropList();

            expect(ontologyManagerSvc.getEntityName.calls.count()).toBe(scope.classObj.matonto.properties.length);
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(scope.classObj.matonto.properties.length);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            var element = $compile(angular.element('<class-preview class-obj="classObj"></class-preview>'))(scope);
            scope.$digest();

            expect(element.hasClass('class-preview')).toBe(true);
        });
        it('depending on whether classObj was passed', function() {
            var element = $compile(angular.element('<class-preview class-obj="classObj"></class-preview>'))(scope);
            scope.$digest();
            expect(element.html()).not.toContain('Properties');
            scope.classObj = {};
            scope.$digest();
            expect(element.html()).toContain('Properties');
        });
        it('depending on whether classObj has any properties', function() {
            scope.classObj = {matonto: {properties: []}};
            var element = $compile(angular.element('<class-preview class-obj="classObj"></class-preview>'))(scope);
            scope.$digest();
            var propList = angular.element(element.querySelectorAll('ul')[0]);
            expect(propList.html()).toContain('None');

            scope.classObj = {matonto: {properties: [{}]}};
            scope.$digest();
            expect(propList.html()).not.toContain('None');
            expect(propList.children().length).toBe(scope.classObj.matonto.properties.length);
        });
    });
});
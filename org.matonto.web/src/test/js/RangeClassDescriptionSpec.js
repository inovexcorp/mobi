describe('Range Class Description directive', function() {
    var $compile,
        scope,
        ontologyManagerSvc;

    mockPrefixes();
    mockOntologyManager();
    beforeEach(function() {
        module('rangeClassDescription');

        inject(function(ontologyManagerService) {
            ontologyManagerSvc = ontologyManagerService;
        });

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    injectDirectiveTemplate('modules/mapper/directives/rangeClassDescription/rangeClassDescription.html');

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.ontologyId = '';
            scope.classId = '';
            scope.selectedProp = '';

            this.element = $compile(angular.element('<range-class-description ontology-id="ontologyId" class-id="{{classId}}" selected-prop="selectedProp"></range-class-description>'))(scope);
            scope.$digest();
        });

        it('ontologyId should be two way bound', function() {
            var controller = this.element.controller('rangeClassDescription');
            controller.ontologyId = 'test';
            scope.$digest();
            expect(scope.ontologyId).toEqual('test');
        });
        it('classId should be one way bound', function() {
            var controller = this.element.controller('rangeClassDescription');
            controller.classId = 'test';
            scope.$digest();
            expect(scope.classId).not.toEqual('test');
        });
        it('selectedProp should be one way bound', function() {
            var controller = this.element.controller('rangeClassDescription');
            controller.selectedProp = 'test';
            scope.$digest();
            expect(scope.selectedProp).not.toEqual('test');
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            scope.ontologyId = '';
            scope.classId = '';
            scope.selectedProp = '';

            this.element = $compile(angular.element('<range-class-description ontology-id="ontologyId" class-id="classId" selected-prop="selectedProp"></range-class-description>'))(scope);
            scope.$digest();
        });
        it('should get the name of the range class', function() {
            var controller = this.element.controller('rangeClassDescription');
            var result = controller.getRangeClassName();
            expect(ontologyManagerSvc.getEntityName).toHaveBeenCalled();
            expect(typeof result).toBe('string');
        });
        it('should get the description of the range class', function() {
            var controller = this.element.controller('rangeClassDescription');
            var result = controller.getRangeClassDescription();
            expect(typeof result).toBe('string');
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            scope.ontologyId = '';
            scope.classId = '';
            scope.selectedProp = '';

            var element = $compile(angular.element('<range-class-description ontology-id="ontologyId" class-id="classId" selected-prop="selectedProp"></range-class-description>'))(scope);
            scope.$digest();
            expect(element.hasClass('class-description')).toBe(true);
        });
    });
});
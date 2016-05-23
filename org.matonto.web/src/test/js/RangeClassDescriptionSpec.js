describe('Range Class Description directive', function() {
    var $compile,
        scope,
        ontologyManagerSvc;

    mockPrefixes();
    beforeEach(function() {
        module('rangeClassDescription');
        mockOntologyManager();

        inject(function(_ontologyManagerService_) {
            ontologyManagerSvc = _ontologyManagerService_;
        });

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    injectDirectiveTemplate('modules/mapper/directives/rangeClassDescription/rangeClassDescription.html');

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.ontologies = [{}];
            scope.classId = '';
            scope.selectedProp = '';

            this.element = $compile(angular.element('<range-class-description ontologies="ontologies" class-id="{{classId}}" selected-prop="selectedProp"></range-class-description>'))(scope);
            scope.$digest();
        });

        it('ontologies should be two way bound', function() {
            var controller = this.element.controller('rangeClassDescription');
            controller.ontologies = [{'@id': ''}];
            scope.$digest();
            expect(scope.ontologies).toEqual([{'@id': ''}]);
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
            scope.ontologies = [{}];
            scope.classId = '';
            scope.selectedProp = '';

            this.element = $compile(angular.element('<range-class-description ontologies="ontologies" class-id="{{classId}}" selected-prop="selectedProp"></range-class-description>'))(scope);
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
            scope.ontologies = [{}];
            scope.classId = '';
            scope.selectedProp = '';

            var element = $compile(angular.element('<range-class-description ontologies="ontologies" class-id="{{classId}}" selected-prop="selectedProp"></range-class-description>'))(scope);
            scope.$digest();
            expect(element.hasClass('class-description')).toBe(true);
        });
    });
});
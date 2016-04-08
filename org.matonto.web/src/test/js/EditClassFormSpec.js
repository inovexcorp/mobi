describe('Edit Class Form directive', function() {
    var $compile,
        scope,
        ontologyManagerSvc,
        mappingManagerSvc;

    mockOntologyManager();
    mockMappingManager();
    beforeEach(function() {
        module('editClassForm');

        inject(function(mappingManagerService, ontologyManagerService) {
            ontologyManagerSvc = ontologyManagerService;
            mappingManagerSvc = mappingManagerService;
        });

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    injectDirectiveTemplate('modules/mapper/directives/editClassForm/editClassForm.html');

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.props = [];
            scope.isLastClass = true;
            scope.clickDelete = jasmine.createSpy('clickDelete');
            scope.openProp = jasmine.createSpy('openProp');
            scope.mapping = {};
            scope.classMappingId = '';

            this.element = $compile(angular.element('<edit-class-form props="props" is-last-class="isLastClass" click-delete="clickDelete(classMappingId)" open-prop="openProp(propId)" mapping="mapping" class-mapping-id="classMappingId"></edit-class-form>'))(scope);
            scope.$digest();
        });

        it('props should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.props = [{}];
            scope.$digest();
            expect(scope.props).toEqual([{}]);
        });
        it('isLastClass should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.isLastClass = false;
            scope.$digest();
            expect(scope.isLastClass).toEqual(false);
        });
        it('clickDelete should be called in the parent scope', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.clickDelete();

            expect(scope.clickDelete).toHaveBeenCalled();
        });
        it('openProp should be called in the parent scope', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.openProp();

            expect(scope.openProp).toHaveBeenCalled();
        });
        it('mapping should be two way bound', function() {
            var controller = this.element.controller('editClassForm');
            controller.mapping = {jsonld: []};
            scope.$digest();
            expect(scope.mapping).toEqual({jsonld: []});
        });
        it('classMappingId should be two way bound', function() {
            var controller = this.element.controller('editClassForm');
            controller.classMappingId = 'test';
            scope.$digest();
            expect(scope.classMappingId).toEqual('test');
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            scope.props = [];
            scope.isLastClass = true;
            scope.clickDelete = jasmine.createSpy('clickDelete');
            scope.openProp = jasmine.createSpy('openProp');
            scope.mapping = {};
            scope.classMappingId = '';

            this.element = $compile(angular.element('<edit-class-form props="props" is-last-class="isLastClass" click-delete="clickDelete(classMappingId)" open-prop="openProp(propId)" mapping="mapping" class-mapping-id="classMappingId"></edit-class-form>'))(scope);
            scope.$digest();
        });
        it('should call openProp with passed propId', function() {
            var controller = this.element.controller('editClassForm');
            controller.openProperty('test');

            expect(scope.openProp).toHaveBeenCalledWith('test');
        });
        it('should get a class title', function() {
            var controller = this.element.controller('editClassForm');
            var result = controller.getTitle();

            expect(mappingManagerSvc.getSourceOntologyId).toHaveBeenCalled();
            expect(mappingManagerSvc.getClassIdByMappingId).toHaveBeenCalled();
            expect(ontologyManagerSvc.getClass).toHaveBeenCalled();
            expect(ontologyManagerSvc.getEntityName).toHaveBeenCalled();
            expect(typeof result).toBe('string');
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<edit-class-form props="props" is-last-class="isLastClass" click-delete="clickDelete(classMappingId)" open-prop="openProp(propId)" mapping="mapping" class-mapping-id="classMappingId"></edit-class-form>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('edit-class')).toBe(true);
        });
        it('with an available prop list', function() {
            expect(this.element.find('available-prop-list').length).toBe(1);
        });
        it('with a custom button to delete', function() {
            var buttons = this.element.find('custom-button');
            expect(buttons.length).toBe(1);
            expect(angular.element(buttons[0]).text()).toBe('Delete');
        });
    });
});
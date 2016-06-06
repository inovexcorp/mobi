describe('Edit Prop Form directive', function() {
    var $compile,
        scope,
        ontologyManagerSvc,
        mappingManagerSvc;

    beforeEach(function() {
        module('templates');
        module('editPropForm');
        mockOntologyManager();
        mockMappingManager();
        
        inject(function(_mappingManagerService_, _ontologyManagerService_) {
            ontologyManagerSvc = _ontologyManagerService_;
            mappingManagerSvc = _mappingManagerService_;
        });

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.columns = [];
            scope.set = jasmine.createSpy('set');
            scope.clickDelete = jasmine.createSpy('clickDelete');
            scope.mapping = {};
            scope.ontologies = [{}];
            scope.classMappingId = '';
            scope.selectedPropMapping = '';
            scope.selectedColumn = '';

            this.element = $compile(angular.element('<edit-prop-form columns="columns" set="set(column)" click-delete="clickDelete(classMappingId, propMappingId)" mapping="mapping" ontologies="ontologies" class-mapping-id="classMappingId" selected-prop-mapping="selectedPropMapping" selected-column="selectedColumn"></edit-prop-form>'))(scope);
            scope.$digest();
        });

        it('columns should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.columns = [''];
            scope.$digest();
            expect(scope.columns).toEqual(['']);
        });
        it('set should be called in the parent scope', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.set();

            expect(scope.set).toHaveBeenCalled();
        });
        it('clickDelete should be called in the parent scope', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.clickDelete();

            expect(scope.clickDelete).toHaveBeenCalled();
        });
        it('mapping should be two way bound', function() {
            var controller = this.element.controller('editPropForm');
            controller.mapping = {jsonld: []};
            scope.$digest();
            expect(scope.mapping).toEqual({jsonld: []});
        });
        it('ontologies should be two way bound', function() {
            var controller = this.element.controller('editPropForm');
            controller.ontologies = [{'@id': ''}];
            scope.$digest();
            expect(scope.ontologies).toEqual([{'@id': ''}]);
        });
        it('classMappingId should be two way bound', function() {
            var controller = this.element.controller('editPropForm');
            controller.classMappingId = 'test';
            scope.$digest();
            expect(scope.classMappingId).toEqual('test');
        });
        it('selectedPropMapping should be two way bound', function() {
            var controller = this.element.controller('editPropForm');
            controller.selectedPropMapping = 'test';
            scope.$digest();
            expect(scope.selectedPropMapping).toEqual('test');
        });
        it('selectedColumn should be two way bound', function() {
            var controller = this.element.controller('editPropForm');
            controller.selectedColumn = 'test';
            scope.$digest();
            expect(scope.selectedColumn).toEqual('test');
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            scope.columns = [];
            scope.set = jasmine.createSpy('set');
            scope.clickDelete = jasmine.createSpy('clickDelete');
            scope.mapping = {jsonld: []};
            scope.ontologies = [{'@id': ''}];
            scope.classMappingId = '';
            scope.selectedPropMapping = '';
            scope.selectedColumn = '';

            this.element = $compile(angular.element('<edit-prop-form columns="columns" set="set(column)" click-delete="clickDelete(classMappingId, propMappingId)" mapping="mapping" ontologies="ontologies" class-mapping-id="classMappingId" selected-prop-mapping="selectedPropMapping" selected-column="selectedColumn"></edit-prop-form>'))(scope);
            scope.$digest();
        });
        it('should get the class id', function() {
            var controller = this.element.controller('editPropForm');
            var result = controller.getClassId();

            expect(mappingManagerSvc.getClassIdByMappingId).toHaveBeenCalledWith(controller.mapping.jsonld, controller.classMappingId);
            expect(typeof result).toBe('string')
        });
        it('should get the prop id', function() {
            var controller = this.element.controller('editPropForm');
            var result = controller.getPropId();

            expect(mappingManagerSvc.getPropIdByMappingId).toHaveBeenCalledWith(controller.mapping.jsonld, controller.selectedPropMapping);
            expect(typeof result).toBe('string')
        });
        it('should get the property title', function() {
            var controller = this.element.controller('editPropForm');
            var result = controller.getTitle();

            expect(ontologyManagerSvc.getEntityName).toHaveBeenCalled();
            expect(ontologyManagerSvc.getClass).toHaveBeenCalled();
            expect(typeof result).toBe('string')
        });
        it('should test whether property is an object property', function() {
            var controller = this.element.controller('editPropForm');
            var result = controller.isObjectProperty();
            expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalled();
            expect(result).toBe(false);
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            scope.columns = [];
            scope.set = jasmine.createSpy('set');
            scope.clickDelete = jasmine.createSpy('clickDelete');
            scope.mapping = {};
            scope.ontologies = [{'@id': ''}];
            scope.classMappingId = '';
            scope.selectedPropMapping = '';
            scope.selectedColumn = '';

            this.element = $compile(angular.element('<edit-prop-form columns="columns" set="set(column)" click-delete="clickDelete(classMappingId, propMappingId)" mapping="mapping" ontologies="ontologies" class-mapping-id="classMappingId" selected-prop-mapping="selectedPropMapping" selected-column="selectedColumn"></edit-prop-form>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('edit-prop')).toBe(true);
        });
        it('depending on what type of property it is', function() {
            var buttons = this.element.find('custom-button');
            expect(this.element.find('column-select').length).toBe(1);
            expect(this.element.find('range-class-description').length).toBe(0);
            expect(buttons.length).toBe(2);
            expect(['Set', 'Delete'].indexOf(angular.element(buttons[0]).text()) >= 0).toBe(true);
            expect(['Set', 'Delete'].indexOf(angular.element(buttons[1]).text()) >= 0).toBe(true);

            spyOn(this.element.controller('editPropForm'), 'isObjectProperty').and.returnValue(true);
            scope.$digest();
            buttons = this.element.find('custom-button');
            expect(this.element.find('range-class-description').length).toBe(1);
            expect(this.element.find('column-select').length).toBe(0);
            expect(buttons.length).toBe(1);
            expect(angular.element(buttons[0]).text()).toBe('Delete');
        });
    });
});
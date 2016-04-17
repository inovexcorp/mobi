describe('Class List directive', function() {
    var $compile,
        scope,
        ontologyManagerSvc,
        mappingManagerSvc;

    mockOntologyManager();
    mockMappingManager();
    mockPrefixes();
    beforeEach(function() {
        module('classList');

        inject(function(ontologyManagerService, mappingManagerService) {
            ontologyManagerSvc = ontologyManagerService;
            mappingManagerSvc = mappingManagerService;
        });

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    injectDirectiveTemplate('modules/mapper/directives/classList/classList.html');

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.clickAddProp = jasmine.createSpy('clickAddProp');
            scope.clickClass = jasmine.createSpy('clickClass');
            scope.clickProp = jasmine.createSpy('clickProp');
            scope.clickDelete = jasmine.createSpy('clickDelete');
            scope.mapping = {};
            scope.ontology = {};
            scope.columns = [];
            scope.invalidPropIds = [];

            this.element = $compile(angular.element('<class-list click-add-prop="clickAddProp(classMappingId)" click-class="clickClass(classMappingId)" click-prop="clickProp(classMappingId, propMappingId)" click-delete="clickDelete(classMappingId, propMappingId)" mapping="mapping" ontology="ontology" columns="columns" invalid-prop-ids="invalidPropIds"></class-list>'))(scope);
            scope.$digest();
        });
        it('mapping should be two way bound', function() {
            var controller = this.element.controller('classList');
            controller.mapping = {jsonld: []};
            scope.$digest();
            expect(scope.mapping).toEqual({jsonld: []});
        });
        it('ontology should be two way bound', function() {
            var controller = this.element.controller('classList');
            controller.ontology = {'@id': ''};
            scope.$digest();
            expect(scope.ontology).toEqual({'@id': ''});
        });
        it('columns should be two way bound', function() {
            var controller = this.element.controller('classList');
            controller.columns = ['test'];
            scope.$digest();
            expect(scope.columns).toEqual(['test']);
        });
        it('invalidPropIds should be two way bound', function() {
            var controller = this.element.controller('classList');
            controller.invalidPropIds = ['test'];
            scope.$digest();
            expect(scope.invalidPropIds).toEqual(['test']);
        });
        it('clickAddProp should be called in parent scope when invoked', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.clickAddProp();

            expect(scope.clickAddProp).toHaveBeenCalled();
        });
        it('clickClass should be called in parent scope when invoked', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.clickClass();

            expect(scope.clickClass).toHaveBeenCalled();
        });
        it('clickProp should be called in parent scope when invoked', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.clickProp();

            expect(scope.clickProp).toHaveBeenCalled();
        });
        it('clickDelete should be called in parent scope when invoked', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.clickDelete();

            expect(scope.clickDelete).toHaveBeenCalled();
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            scope.mapping = {jsonld: []};
            scope.ontology = {'@id': ''};
            scope.columns = [];
            scope.invalidPropIds = [];

            this.element = $compile(angular.element('<class-list click-add-prop="clickAddProp(classMappingId)" click-class="clickClass(classMappingId)" click-prop="clickProp(classMappingId, propMappingId)" click-delete="clickDelete(classMappingId, propMappingId)" mapping="mapping" ontology="ontology" columns="columns" invalid-prop-ids="invalidPropIds"></class-list>'))(scope);
            scope.$digest();
        });
        it('should collect ClassMappings if they exist', function() {
            var controller = this.element.controller('classList');
            var result = controller.getClassMappings();
            expect(result.length).toBe(0);

            controller.mapping.jsonld = [{'@type': ['ClassMapping']}];
            result = controller.getClassMappings();
            expect(result.length).toBe(1);
        });
        it('should collect prop mappings', function() {
            var controller = this.element.controller('classList');
            var result = controller.getPropMappings({'@id': 'classMapping'});

            expect(mappingManagerSvc.getPropMappingsByClass).toHaveBeenCalledWith(controller.mapping, 'classMapping');
        });
        it('should get a property title', function() {
            var controller = this.element.controller('classList');
            var dataMapping = {'@type': 'DataMapping', 'columnIndex': [{'@value': 0}]};
            var objectMapping = {'@type': 'ObjectMapping', 'classMapping': [{'@id': ''}]};
            var result = controller.getPropTitle(objectMapping, {});
            expect(mappingManagerSvc.isObjectMapping).toHaveBeenCalledWith(objectMapping);
            expect(typeof result).toBe('string');

            result = controller.getPropTitle(dataMapping, {});
            expect(mappingManagerSvc.isDataMapping).toHaveBeenCalledWith(dataMapping);
            expect(typeof result).toBe('string');
        });
        it('should test whether all properties have been mapped', function() {
            var controller = this.element.controller('classList');
            var result = controller.mappedAllProps({'@id': ''});
            expect(mappingManagerSvc.getPropMappingsByClass).toHaveBeenCalledWith(controller.mapping, '');
            expect(ontologyManagerSvc.getClassProperties).toHaveBeenCalledWith(controller.ontology, '');
            expect(typeof result).toBe('boolean');
        });
        it('should get a list of properties linking to a class mapping', function() {
            scope.mapping.jsonld.push({'@type': ['ObjectMapping'], 'classMapping': [{'@id': ''}]});
            scope.$digest();
            var controller = this.element.controller('classList');
            var result = controller.getLinks({'@id': ''});
            expect(mappingManagerSvc.findClassWithObjectMapping).toHaveBeenCalled();
            expect(typeof result).toBe('string');
        });
        it('should get a class title', function() {
            var controller = this.element.controller('classList');
            spyOn(controller, 'getLinks');
            var result = controller.getClassTitle({'@id': ''});
            expect(controller.getLinks).toHaveBeenCalledWith({'@id': ''});
            expect(typeof result).toBe('string');
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            scope.mapping = {jsonld: []};
            scope.ontology = {'@id': ''};
            scope.columns = [];
            scope.invalidPropIds = [];
            this.element = $compile(angular.element('<class-list click-add-prop="clickAddProp(classMappingId)" click-class="clickClass(classMappingId)" click-prop="clickProp(classMappingId, propMappingId)" click-delete="clickDelete(classMappingId, propMappingId)" mapping="mapping" ontology="ontology" columns="columns" invalid-prop-ids="invalidPropIds"></class-list>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('class-list-container')).toBe(true);
            var classList = this.element.querySelectorAll('ul.class-list');
            expect(classList.length).toBe(1);
        });
        it('depending on the number of class mappings', function() {
            var classMappings = [{'@id': ''}];
            spyOn(this.element.controller('classList'), 'getClassMappings').and.returnValue(classMappings);
            scope.$digest();

            var classList = this.element.querySelectorAll('ul.class-list');
            expect(classList[0].childElementCount).toBe(classMappings.length);
        });
        it('depending on the number of property mappings', function() {
            var classMappings = [{'@id': ''}];
            var propMappings = [{'@id': ''}];
            spyOn(this.element.controller('classList'), 'getClassMappings').and.returnValue(classMappings);
            spyOn(this.element.controller('classList'), 'getPropMappings').and.returnValue(propMappings);
            scope.$digest();

            var propList = this.element.querySelectorAll('ul.class-list ul.props');
            expect(propList.length).toBe(1);
            expect(propList[0].childElementCount).toBe(propMappings.length);
        });
        it('depending on whether all properties have been mapped', function() {
            var classMappings = [{'@id': ''}];
            var propMappings = [{'@id': ''}];
            spyOn(this.element.controller('classList'), 'getClassMappings').and.returnValue(classMappings);
            spyOn(this.element.controller('classList'), 'getPropMappings').and.returnValue(propMappings);
            scope.$digest();

            var propList = angular.element(this.element.querySelectorAll('ul.class-list ul.props')[0]);
            expect(propList.html()).not.toContain('Add Property');

            spyOn(this.element.controller('classList'), 'mappedAllProps').and.returnValue(false);
            scope.$digest();
            expect(propList.html()).toContain('Add Property');
        });
        it('if prop mapping is invalid', function() {
            var classMappings = [{'@id': ''}];
            var propMappings = [{'@id': ''}];
            spyOn(this.element.controller('classList'), 'getClassMappings').and.returnValue(classMappings);
            spyOn(this.element.controller('classList'), 'getPropMappings').and.returnValue(propMappings);
            scope.invalidPropIds = [''];
            scope.$digest();

            var propItem = this.element.querySelectorAll('ul.class-list ul.props li')[0];
            expect(angular.element(propItem.querySelectorAll('a')[0]).hasClass('text-danger')).toBe(true);
        });
    });
    it('should call clickClass when a class title is clicked', function() {
        scope.clickClass = jasmine.createSpy('clickClass');
        scope.mapping = {jsonld: []};
        scope.ontology = {'@id': ''};
        scope.columns = [];
        scope.invalidPropIds = [];
        var element = $compile(angular.element('<class-list click-add-prop="clickAddProp(classMappingId)" click-class="clickClass(classMappingId)" click-prop="clickProp(classMappingId, propMappingId)" click-delete="clickDelete(classMappingId, propMappingId)" mapping="mapping" columns="columns" invalid-prop-ids="invalidPropIds"></class-list>'))(scope);
        scope.$digest();
        spyOn(element.controller('classList'), 'getClassMappings').and.returnValue([{'@id': ''}]);
        scope.$digest();

        var classItem = angular.element(element.querySelectorAll('ul.class-list li a')[0]);
        classItem.triggerHandler('click');
        expect(scope.clickClass).toHaveBeenCalledWith('');
    });
    it('should call clickProp when a prop title is clicked', function() {
        scope.clickProp = jasmine.createSpy('clickProp');
        scope.mapping = {jsonld: []};
        scope.ontology = {'@id': ''};
        scope.columns = [];
        scope.invalidPropIds = [];
        var element = $compile(angular.element('<class-list click-add-prop="clickAddProp(classMappingId)" click-class="clickClass(classMappingId)" click-prop="clickProp(classMappingId, propMappingId)" click-delete="clickDelete(classMappingId, propMappingId)" mapping="mapping" columns="columns" invalid-prop-ids="invalidPropIds"></class-list>'))(scope);
        scope.$digest();
        spyOn(element.controller('classList'), 'getClassMappings').and.returnValue([{'@id': ''}]);
        spyOn(element.controller('classList'), 'getPropMappings').and.returnValue([{'@id': ''}]);
        scope.$digest();

        var propItem = angular.element(element.querySelectorAll('ul.class-list ul.props li a')[0]);
        propItem.triggerHandler('click');
        expect(scope.clickProp).toHaveBeenCalledWith('', '');
    });
    it('should call clickDelete when a prop delete button is clicked', function() {
        scope.clickDelete = jasmine.createSpy('clickDelete');
        scope.mapping = {jsonld: []};
        scope.ontology = {'@id': ''};
        scope.columns = [];
        scope.invalidPropIds = [];
        var element = $compile(angular.element('<class-list click-add-prop="clickAddProp(classMappingId)" click-class="clickClass(classMappingId)" click-prop="clickProp(classMappingId, propMappingId)" click-delete="clickDelete(classMappingId, propMappingId)" mapping="mapping" columns="columns" invalid-prop-ids="invalidPropIds"></class-list>'))(scope);
        scope.$digest();
        spyOn(element.controller('classList'), 'getClassMappings').and.returnValue([{'@id': ''}]);
        spyOn(element.controller('classList'), 'getPropMappings').and.returnValue([{'@id': ''}]);
        scope.$digest();

        var propDeleteBtn = angular.element(element.querySelectorAll('ul.class-list ul.props li button')[0]);
        propDeleteBtn.triggerHandler('click');
        expect(scope.clickDelete).toHaveBeenCalledWith('', '');
    });
    it('should call clickAddProp when an add prop link is clicked', function() {
        scope.clickAddProp = jasmine.createSpy('clickAddProp');
        scope.mapping = {jsonld: []};
        scope.ontology = {'@id': ''};
        scope.columns = [];
        scope.invalidPropIds = [];
        var element = $compile(angular.element('<class-list click-add-prop="clickAddProp(classMappingId)" click-class="clickClass(classMappingId)" click-prop="clickProp(classMappingId, propMappingId)" click-delete="clickDelete(classMappingId, propMappingId)" mapping="mapping" columns="columns" invalid-prop-ids="invalidPropIds"></class-list>'))(scope);
        scope.$digest();
        spyOn(element.controller('classList'), 'getClassMappings').and.returnValue([{'@id': ''}]);
        spyOn(element.controller('classList'), 'mappedAllProps').and.returnValue(false);
        scope.$digest();

        var addProp = angular.element(element.querySelectorAll('ul.class-list ul.props li a')[0]);
        addProp.triggerHandler('click');
        expect(scope.clickAddProp).toHaveBeenCalledWith('');
    });
});
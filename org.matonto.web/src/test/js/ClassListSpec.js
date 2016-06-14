describe('Class List directive', function() {
    var $compile,
        scope,
        ontologyManagerSvc,
        mappingManagerSvc,
        mapperStateSvc,
        csvManagerSvc;

    mockPrefixes();
    beforeEach(function() {
        module('templates');
        module('classList');
        mockOntologyManager();
        mockMappingManager();
        mockMapperState();
        mockCsvManager();

        inject(function(_ontologyManagerService_, _mappingManagerService_, _mapperStateService_, _csvManagerService_) {
            ontologyManagerSvc = _ontologyManagerService_;
            mappingManagerSvc = _mappingManagerService_;
            mapperStateSvc = _mapperStateService_;
            csvManagerSvc = _csvManagerService_;
        });

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    describe('controller methods', function() {
        beforeEach(function() {
            mappingManagerSvc.mapping = {jsonld: []};
            csvManagerSvc.filePreview = {
                headers: [],
                rows: []
            };
            this.element = $compile(angular.element('<class-list></class-list>'))(scope);
            scope.$digest();
        });
        it('should test whether a class has properties', function() {
            var controller = this.element.controller('classList');
            var result = controller.hasProps('test');
            expect(result).toBe(false);

            mappingManagerSvc.getPropMappingsByClass.and.returnValue([{}]);
            result = controller.hasProps('test');
        });
        it('should test whether a class is open', function() {
            var controller = this.element.controller('classList');
            var result = controller.isOpen('test');
            expect(result).toBe(false);

            mapperStateSvc.openedClasses = ['test'];
            var result = controller.isOpen('test');
            expect(result).toBe(true);
        });
        it('should toggle whether a class is open', function() {
            var controller = this.element.controller('classList');
            controller.toggleOpen('test');
            expect(mapperStateSvc.openedClasses).toContain('test');
            controller.toggleOpen('test');
            expect(mapperStateSvc.openedClasses).not.toContain('test');
        });
        it('should set the proper state for editing a class', function() {
            var controller = this.element.controller('classList');
            controller.clickClass({'@id': ''});
            expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
            expect(mapperStateSvc.updateAvailableProps).toHaveBeenCalled();
            expect(mapperStateSvc.selectedClassMappingId).toBe('');
        });
        it('should set the proper state for editing a property', function() {
            var controller = this.element.controller('classList');
            csvManagerSvc.filePreview.headers = [''];
            controller.clickProp({'@id': '', columnIndex: [{'@value': 0}]}, {'@id': ''});
            expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
            expect(mapperStateSvc.updateAvailableColumns).toHaveBeenCalled();
            expect(mapperStateSvc.selectedClassMappingId).toBe('');
            expect(mapperStateSvc.selectedPropMappingId).toBe('');
            expect(mapperStateSvc.selectedColumn).toBe('');
        });
        it('should set the proper state for adding a property', function() {
            var controller = this.element.controller('classList');
            controller.clickAddProp({'@id': ''});
            expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
            expect(mapperStateSvc.newProp).toBe(true);
            expect(mapperStateSvc.updateAvailableProps).toHaveBeenCalled();
            expect(mapperStateSvc.updateAvailableColumns).toHaveBeenCalled();
            expect(mapperStateSvc.selectedClassMappingId).toBe('');
        });
        it('should retrieve the list of invalid property ids', function() {
            mapperStateSvc.invalidProps = [{'@id': ''}];
            var controller = this.element.controller('classList');
            var result = controller.getInvalidPropIds();
            _.forEach(result, function(id, index) {
                expect(id).toBe(mapperStateSvc.invalidProps[index]['@id']);
            });
        });
        it('should get a class title', function() {
            var controller = this.element.controller('classList');
            spyOn(controller, 'getLinks');
            var result = controller.getClassTitle({'@id': ''});
            expect(controller.getLinks).toHaveBeenCalledWith({'@id': ''});
            expect(typeof result).toBe('string');
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
            expect(mappingManagerSvc.getPropMappingsByClass).toHaveBeenCalledWith(mappingManagerSvc.mapping.jsonld, '');
            expect(ontologyManagerSvc.getClassProperties).toHaveBeenCalled();
            expect(typeof result).toBe('boolean');
        });
        it('should get a list of properties linking to a class mapping', function() {
            mappingManagerSvc.mapping.jsonld.push({'@type': ['ObjectMapping'], 'classMapping': [{'@id': ''}]});
            var controller = this.element.controller('classList');
            var result = controller.getLinks({'@id': ''});
            expect(mappingManagerSvc.findClassWithObjectMapping).toHaveBeenCalled();
            expect(mappingManagerSvc.getPropMappingTitle).toHaveBeenCalled();
            expect(typeof result).toBe('string');
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            mappingManagerSvc.mapping = {jsonld: []};
            csvManagerSvc.filePreview = {
                headers: [],
                rows: []
            };
            this.element = $compile(angular.element('<class-list></class-list>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('class-list')).toBe(true);
            expect(this.element.querySelectorAll('.boxed').length).toBe(1);
        });
        it('depending on whether there is a file preview', function() {
            expect(this.element.querySelectorAll('ul.list').length).toBe(1);

            csvManagerSvc.filePreview = undefined;
            scope.$digest();
            expect(this.element.querySelectorAll('ul.list').length).toBe(0);
        });
        it('depending on the number of class mappings', function() {
            var classMappings = [{'@id': ''}];
            mappingManagerSvc.getAllClassMappings.and.returnValue(classMappings);
            scope.$digest();

            var classList = this.element.querySelectorAll('ul.list');
            expect(classList[0].childElementCount).toBe(classMappings.length);
        });
        it('depending on whether a class is selected', function() {
            var controller = this.element.controller('classList');
            var classMappings = [{'@id': 'class'}];
            mappingManagerSvc.getAllClassMappings.and.returnValue(classMappings);
            scope.$digest();
            var classItem = angular.element(this.element.querySelectorAll('ul.list li a')[0]);
            expect(classItem.hasClass('active')).toBe(false);

            mapperStateSvc.selectedClassMappingId = 'class';
            scope.$digest();
            expect(classItem.hasClass('active')).toBe(true);

            mapperStateSvc.selectedPropMappingId = 'prop';
            scope.$digest();
            expect(classItem.hasClass('active')).toBe(false);

            mapperStateSvc.selectedPropMappingId = '';
            mapperStateSvc.newProp = true;
            scope.$digest();
            expect(classItem.hasClass('active')).toBe(false);
        });
        it('depending on whether a class is open and has props', function() {
            var controller = this.element.controller('classList');
            var classMappings = [{'@id': ''}];
            var propMappings = [{'@id': ''}];
            mappingManagerSvc.getAllClassMappings.and.returnValue(classMappings);
            scope.$digest();
            var toggleBtn = angular.element(this.element.querySelectorAll('ul.list li i')[0]);
            expect(toggleBtn.hasClass('fa-minus-square-o')).toBe(false);
            expect(toggleBtn.hasClass('fa-plus-square-o')).toBe(false);
            expect(toggleBtn.hasClass('fa-square-o')).toBe(true);
            var propList = this.element.querySelectorAll('ul.list ul.props');
            expect(propList.length).toBe(1);
            expect(propList[0].childElementCount).toBe(0);

            mappingManagerSvc.getPropMappingsByClass.and.returnValue(propMappings);
            scope.$digest();
            expect(toggleBtn.hasClass('fa-minus-square-o')).toBe(false);
            expect(toggleBtn.hasClass('fa-plus-square-o')).toBe(true);
            expect(toggleBtn.hasClass('fa-square-o')).toBe(false);
            expect(propList[0].childElementCount).toBe(1);
          
            mapperStateSvc.openedClasses = [''];
            scope.$digest();
            expect(toggleBtn.hasClass('fa-minus-square-o')).toBe(true);
            expect(toggleBtn.hasClass('fa-plus-square-o')).toBe(false);
            expect(toggleBtn.hasClass('fa-square-o')).toBe(false);
            expect(propList[0].childElementCount).toBe(propMappings.length + 1);
        });
        it('depending on whether a prop is selected', function() {
            var controller = this.element.controller('classList');
            var classMappings = [{'@id': ''}];
            var propMappings = [{'@id': 'prop'}];
            mappingManagerSvc.getAllClassMappings.and.returnValue(classMappings);
            mappingManagerSvc.getPropMappingsByClass.and.returnValue(propMappings);
            mapperStateSvc.openedClasses = [''];
            scope.$digest();
            var propItem = angular.element(this.element.querySelectorAll('ul.list li .props li a')[0]);
            expect(propItem.hasClass('active')).toBe(false);

            mapperStateSvc.selectedPropMappingId = 'prop';
            scope.$digest();
            expect(propItem.hasClass('active')).toBe(true);

            mapperStateSvc.newProp = true;
            scope.$digest();
            expect(propItem.hasClass('active')).toBe(false);
        });
        it('depending on whether all properties have been mapped', function() {
            var controller = this.element.controller('classList');
            var classMappings = [{'@id': ''}];
            var propMappings = [{'@id': ''}];
            mappingManagerSvc.getAllClassMappings.and.returnValue(classMappings);
            mappingManagerSvc.getPropMappingsByClass.and.returnValue(propMappings);
            spyOn(controller, 'mappedAllProps').and.returnValue(true);
            mapperStateSvc.openedClasses = [''];
            scope.$digest();

            var propList = angular.element(this.element.querySelectorAll('ul.list ul.props')[0]);
            expect(propList.html()).not.toContain('Add Property');

            controller.mappedAllProps.and.returnValue(false);
            scope.$digest();
            expect(propList.html()).toContain('Add Property');
        });
        it('if prop mapping is invalid', function() {
            var controller = this.element.controller('classList');
            var classMappings = [{'@id': ''}];
            var propMappings = [{'@id': ''}];
            mappingManagerSvc.getAllClassMappings.and.returnValue(classMappings);
            mappingManagerSvc.getPropMappingsByClass.and.returnValue(propMappings);
            mapperStateSvc.openedClasses = [''];
            spyOn(controller, 'getInvalidPropIds').and.returnValue(['']);
            scope.$digest();

            var propItem = this.element.querySelectorAll('ul.list ul.props li')[0];
            expect(angular.element(propItem.querySelectorAll('a')[0]).hasClass('invalid')).toBe(true);
        });
    });
    it('should call clickClass when a class title is clicked', function() {
        mappingManagerSvc.mapping = {jsonld: []};
        csvManagerSvc.filePreview = {};
        var classMapping = {'@id': ''};
        var element = $compile(angular.element('<class-list></class-list>'))(scope);
        scope.$digest();
        var controller = element.controller('classList');
        mappingManagerSvc.getAllClassMappings.and.returnValue([classMapping]);
        spyOn(controller, 'clickClass');
        mapperStateSvc.openedClasses = [''];
        scope.$digest();

        var classItem = angular.element(element.querySelectorAll('ul.list li a')[0]);
        classItem.triggerHandler('click');
        expect(controller.clickClass).toHaveBeenCalledWith(classMapping);
    });
    it('should call toggleOpen when a class title is double clicked', function() {
        mappingManagerSvc.mapping = {jsonld: []};
        csvManagerSvc.filePreview = {};
        var classMapping = {'@id': ''};
        var element = $compile(angular.element('<class-list></class-list>'))(scope);
        scope.$digest();
        var controller = element.controller('classList');
        mappingManagerSvc.getAllClassMappings.and.returnValue([classMapping]);
        spyOn(controller, 'toggleOpen');
        mapperStateSvc.openedClasses = [''];
        scope.$digest();

        var classItem = angular.element(element.querySelectorAll('ul.list li a')[0]);
        classItem.triggerHandler('dblclick');
        expect(controller.toggleOpen).toHaveBeenCalledWith(classMapping['@id']);
    });
    it('should call clickProp when a prop title is clicked', function() {
        mappingManagerSvc.mapping = {jsonld: []};
        csvManagerSvc.filePreview = {};
        var classMapping = {'@id': ''};
        var propMapping = {'@id': ''};
        var element = $compile(angular.element('<class-list></class-list>'))(scope);
        scope.$digest();
        var controller = element.controller('classList');
        mappingManagerSvc.getAllClassMappings.and.returnValue([classMapping]);
        mappingManagerSvc.getPropMappingsByClass.and.returnValue([propMapping]);
        spyOn(controller, 'clickProp');
        mapperStateSvc.openedClasses = [''];
        scope.$digest();

        var propItem = angular.element(element.querySelectorAll('ul.list ul.props li a')[0]);
        propItem.triggerHandler('click');
        expect(controller.clickProp).toHaveBeenCalledWith(propMapping, classMapping);
    });
    it('should call clickAddProp when an add prop link is clicked', function() {
        mappingManagerSvc.mapping = {jsonld: []};
        csvManagerSvc.filePreview = {};
        var classMapping = {'@id': ''};
        var element = $compile(angular.element('<class-list></class-list>'))(scope);
        scope.$digest();
        var controller = element.controller('classList');
        mappingManagerSvc.getAllClassMappings.and.returnValue([classMapping]);
        spyOn(controller, 'mappedAllProps').and.returnValue(false);
        spyOn(controller, 'clickAddProp');
        mapperStateSvc.openedClasses = [''];
        scope.$digest();

        var addProp = angular.element(element.querySelectorAll('ul.list ul.props li a')[0]);
        addProp.triggerHandler('click');
        expect(controller.clickAddProp).toHaveBeenCalledWith(classMapping);
    });
});
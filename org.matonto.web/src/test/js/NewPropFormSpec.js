describe('New Prop Form directive', function() {
    var $compile,
        scope,
        ontologyManagerSvc,
        mappingManagerSvc,
        mapperStateSvc,
        delimitedManagerSvc;

    mockPrefixes();
    beforeEach(function() {
        module('templates');
        module('newPropForm');
        mockOntologyManager();
        mockMappingManager();
        mockMapperState();
        mockDelimitedManager();
        
        inject(function(_ontologyManagerService_, _mappingManagerService_, _mapperStateService_, _delimitedManagerService_) {
            ontologyManagerSvc = _ontologyManagerService_;
            mappingManagerSvc = _mappingManagerService_;
            mapperStateSvc = _mapperStateService_;
            delimitedManagerSvc = _delimitedManagerService_;
        });

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    describe('controller methods', function() {
        beforeEach(function() {
            mappingManagerSvc.mapping = {jsonld: []};
            delimitedManagerSvc.filePreview = {headers: []};
            this.element = $compile(angular.element('<new-prop-form></new-prop-form>'))(scope);
            scope.$digest();
        });
        it('should test whether the selected property is an object property', function() {
            var controller = this.element.controller('newPropForm');
            mapperStateSvc.selectedProp = {'@type': ['ObjectProperty']};
            var result = controller.isObjectProperty();
            expect(result).toBe(true);

            mapperStateSvc.selectedProp = {};
            result = controller.isObjectProperty();
            expect(result).toBe(false);
        });
        it('should update the available columns based on the type of the selected property', function() {
            var controller = this.element.controller('newPropForm');
            spyOn(controller, 'isObjectProperty').and.returnValue(true);
            controller.update();
            expect(mapperStateSvc.updateAvailableColumns).not.toHaveBeenCalled();
            controller.isObjectProperty.and.returnValue(false);
            controller.update();
            expect(mapperStateSvc.updateAvailableColumns).toHaveBeenCalled();
        });
        it('should return the name of the selected class', function() {
            var controller = this.element.controller('newPropForm');
            var result = controller.getClassName();
            expect(mappingManagerSvc.getClassIdByMappingId).toHaveBeenCalledWith(mappingManagerSvc.mapping.jsonld, mapperStateSvc.selectedClassMappingId);
            expect(ontologyManagerSvc.findOntologyWithClass).toHaveBeenCalled();
            expect(ontologyManagerSvc.getEntityName).toHaveBeenCalled();
            expect(typeof result).toBe('string');
        });
        it('should set the corrcet state for setting a property', function() {
            var controller = this.element.controller('newPropForm');
            mapperStateSvc.selectedProp = {'@id': ''};
            spyOn(controller, 'isObjectProperty').and.returnValue(true);
            mappingManagerSvc.getClassIdByMappingId.calls.reset();
            ontologyManagerSvc.findOntologyWithClass.calls.reset();
            var classMappingId = mapperStateSvc.selectedClassMappingId;
            controller.set();
            expect(mappingManagerSvc.addObjectProp).toHaveBeenCalledWith(mappingManagerSvc.mapping.jsonld, mappingManagerSvc.sourceOntologies, 
                mapperStateSvc.selectedClassMappingId, mapperStateSvc.selectedProp['@id']);
            expect(mappingManagerSvc.getClassIdByMappingId).not.toHaveBeenCalled();
            expect(ontologyManagerSvc.findOntologyWithClass).not.toHaveBeenCalled();
            expect(mappingManagerSvc.addDataProp).not.toHaveBeenCalled();
            expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
            expect(mapperStateSvc.changedMapping).toHaveBeenCalled();
            expect(mapperStateSvc.openedClasses).toContain(classMappingId);

            controller.isObjectProperty.and.returnValue(false);
            mappingManagerSvc.addObjectProp.calls.reset();
            classMappingId = mapperStateSvc.selectedClassMappingId;
            controller.set();
            expect(mappingManagerSvc.addObjectProp).not.toHaveBeenCalled();
            expect(mappingManagerSvc.getClassIdByMappingId).toHaveBeenCalledWith(mappingManagerSvc.mapping.jsonld, mapperStateSvc.selectedClassMappingId);
            expect(ontologyManagerSvc.findOntologyWithClass).toHaveBeenCalled();
            expect(mappingManagerSvc.addDataProp).toHaveBeenCalled();
            expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
            expect(mapperStateSvc.changedMapping).toHaveBeenCalled();
            expect(mapperStateSvc.openedClasses).toContain(classMappingId);
        });
        it('should set the correct state for setting a property and continuing to the next', function() {
            var controller = this.element.controller('newPropForm');
            mapperStateSvc.selectedClassMappingId = 'test';
            spyOn(controller, 'set');
            controller.setNext();
            expect(controller.set).toHaveBeenCalled();
            expect(mapperStateSvc.newProp).toBe(true);
            expect(mapperStateSvc.selectedClassMappingId).toBe('test');
            expect(mapperStateSvc.updateAvailableProps).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            mappingManagerSvc.mapping = {jsonld: []};
            this.element = $compile(angular.element('<new-prop-form></new-prop-form>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('new-prop-form')).toBe(true);
        });
        it('with a prop-select', function() {
            expect(this.element.find('prop-select').length).toBe(1);
        });
        it('depending on the type of selected property', function() {
            var controller = this.element.controller('newPropForm');
            mapperStateSvc.selectedProp = undefined;
            scope.$digest();
            expect(this.element.find('range-class-description').length).toBe(0);
            expect(this.element.find('column-select').length).toBe(0);

            mapperStateSvc.selectedProp = {};
            spyOn(controller, 'isObjectProperty').and.returnValue(false);
            scope.$digest();
            expect(this.element.find('range-class-description').length).toBe(0);
            expect(this.element.find('column-select').length).toBe(1);

            controller.isObjectProperty.and.returnValue(true);
            scope.$digest();
            expect(this.element.find('range-class-description').length).toBe(1);
            expect(this.element.find('column-select').length).toBe(0);
        });
        it('with custom buttons for set and set and next', function() {
            var buttons = this.element.find('custom-button');
            expect(buttons.length).toBe(2);
            expect(['Set', 'Set & Next'].indexOf(angular.element(buttons[0]).text()) >= 0).toBe(true);
            expect(['Back', 'Set & Next'].indexOf(angular.element(buttons[1]).text()) >= 0).toBe(true);
        });
    });
});
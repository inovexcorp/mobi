describe('Mapping Editor directive', function() {
    var $compile,
        scope,
        mappingManagerSvc,
        mapperStateSvc,
        csvManagerSvc,
        ontologyManagerSvc;

    beforeEach(function() {
        module('mappingEditor');
        mockMappingManager();
        mockMapperState();
        mockCsvManager();
        mockOntologyManager();

        inject(function(_mappingManagerService_, _mapperStateService_, _csvManagerService_, _ontologyManagerService_) {
            mappingManagerSvc = _mappingManagerService_;
            mapperStateSvc = _mapperStateService_;
            csvManagerSvc = _csvManagerService_;
            ontologyManagerSvc = _ontologyManagerService_;
        });

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    injectDirectiveTemplate('modules/mapper/directives/mappingEditor/mappingEditor.html');

    describe('controller methods', function() {
        beforeEach(function() {
            mappingManagerSvc.mapping = {jsonld: []};
            this.element = $compile(angular.element('<mapping-editor></mapping-editor>'))(scope);
            scope.$digest();
        });
        it('should get the name of the mapping\'s source ontology', function() {
            var controller = this.element.controller('mappingEditor');
            var result = controller.getSourceOntologyName();
            expect(mappingManagerSvc.getSourceOntology).toHaveBeenCalled();
            expect(ontologyManagerSvc.getEntityName).toHaveBeenCalled();
            expect(typeof result).toBe('string');
        });
        it('should set the correct state for changing the ontology', function() {
            var controller = this.element.controller('mappingEditor');
            controller.changeOntology();
            expect(mapperStateSvc.changeOntology).toBe(true);
            expect(mapperStateSvc.cacheSourceOntologies).toHaveBeenCalled();
            expect(mapperStateSvc.step).toBe(2);
        });
        it('should submit the mapping', function() {
            var controller = this.element.controller('mappingEditor');
            mappingManagerSvc.mapping.name = 'test';
            mappingManagerSvc.previousMappingNames = [mappingManagerSvc.mapping.name];
            controller.submit();
            scope.$apply();
            expect(mappingManagerSvc.uploadPut).not.toHaveBeenCalled();
            expect(csvManagerSvc.map).toHaveBeenCalledWith(mappingManagerSvc.mapping.name);
            expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
            expect(mapperStateSvc.step).toBe(5);

            mappingManagerSvc.previousMappingNames = [];
            controller.submit();
            scope.$apply();
            expect(mappingManagerSvc.uploadPut).toHaveBeenCalledWith(mappingManagerSvc.mapping.jsonld, mappingManagerSvc.mapping.name);
            expect(csvManagerSvc.map).toHaveBeenCalledWith(mappingManagerSvc.mapping.name);
            expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
            expect(mapperStateSvc.step).toBe(5);
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            mappingManagerSvc.mapping = {jsonld: []};
            this.element = $compile(angular.element('<mapping-editor></mapping-editor>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('mapping-editor')).toBe(true);
            expect(this.element.querySelectorAll('.ontology-section').length).toBe(1);
            expect(this.element.querySelectorAll('.submit-mapping').length).toBe(1);
            expect(this.element.querySelectorAll('.actions').length).toBe(1);
            expect(this.element.querySelectorAll('.mapping-title').length).toBe(1);
            expect(this.element.querySelectorAll('.edit-mapping').length).toBe(1);
        });
        it('depending on the state step', function() {
            mapperStateSvc.step = 0;
            scope.$digest();
            expect(this.element.hasClass('ng-hide')).toBe(true);

            mapperStateSvc.step = 1;
            scope.$digest();
            expect(this.element.hasClass('ng-hide')).toBe(false);
        });
        it('with a RDF preview', function() {
            expect(this.element.find('rdf-preview').length).toBe(1);
        });
        it('with a class list', function() {
            expect(this.element.find('class-list').length).toBe(1);
        });
        it('with a file preview table', function() {
            expect(this.element.find('file-preview-table').length).toBe(1);
        });
        it('depending on the selected item and whether it is a new prop', function() {
            mapperStateSvc.selectedClassMappingId = '';
            mapperStateSvc.selectedPropMappingId = '';
            mapperStateSvc.newProp = false;
            scope.$digest();
            expect(this.element.find('edit-class-form').length).toBe(0);
            expect(this.element.find('edit-prop-form').length).toBe(0);
            expect(this.element.find('new-prop-form').length).toBe(0);
            expect(this.element.querySelectorAll('.edit-cancel').length).toBe(0);

            mapperStateSvc.selectedClassMappingId = 'class';
            scope.$digest();
            expect(this.element.find('edit-class-form').length).toBe(1);
            expect(this.element.find('edit-prop-form').length).toBe(0);
            expect(this.element.find('new-prop-form').length).toBe(0);
            expect(this.element.querySelectorAll('.edit-cancel').length).toBe(1);

            mapperStateSvc.selectedPropMappingId = 'prop';
            scope.$digest();
            expect(this.element.find('edit-class-form').length).toBe(0);
            expect(this.element.find('edit-prop-form').length).toBe(1);
            expect(this.element.find('new-prop-form').length).toBe(0);
            expect(this.element.querySelectorAll('.edit-cancel').length).toBe(1);

            mapperStateSvc.selectedPropMappingId = '';
            mapperStateSvc.newProp = true;
            scope.$digest();
            expect(this.element.find('edit-class-form').length).toBe(0);
            expect(this.element.find('edit-prop-form').length).toBe(0);
            expect(this.element.find('new-prop-form').length).toBe(1);
            expect(this.element.querySelectorAll('.edit-cancel').length).toBe(1);
        });
    });
    it('should set the correct state when the ontology name is clicked', function() {
        mappingManagerSvc.mapping = {jsonld: []};
        var element = $compile(angular.element('<mapping-editor></mapping-editor>'))(scope);
        scope.$digest();

        var link = angular.element(element.querySelectorAll('.ontology-section a')[0]);
        link.triggerHandler('click');
        expect(mapperStateSvc.previewOntology).toBe(true);
    });
    it('should call changeOntology when the change button is clicked', function() {
        mappingManagerSvc.mapping = {jsonld: []};
        var element = $compile(angular.element('<mapping-editor></mapping-editor>'))(scope);
        scope.$digest();

        var controller = element.controller('mappingEditor');
        spyOn(controller, 'changeOntology');
        var button = angular.element(element.querySelectorAll('.ontology-section button')[0]);
        button.triggerHandler('click');
        expect(controller.changeOntology).toHaveBeenCalled();
    });
    it('should call submit when the submit button is clicked', function() {
        mappingManagerSvc.mapping = {jsonld: []};
        var element = $compile(angular.element('<mapping-editor></mapping-editor>'))(scope);
        scope.$digest();

        var controller = element.controller('mappingEditor');
        spyOn(controller, 'submit');
        var button = angular.element(element.querySelectorAll('.submit-mapping button')[0]);
        button.triggerHandler('click');
        expect(controller.submit).toHaveBeenCalled();
    });
    it('should set the correct state when the mapping cancel link is clicked', function() {
        mappingManagerSvc.mapping = {jsonld: []};
        var element = $compile(angular.element('<mapping-editor></mapping-editor>'))(scope);
        scope.$digest();

        var link = angular.element(element.querySelectorAll('.submit-mapping a')[0]);
        link.triggerHandler('click');
        expect(mapperStateSvc.displayCancelConfirm).toBe(true);
    });
    it('should set the correct state when the mapping name edit button is clicked', function() {
        mappingManagerSvc.mapping = {jsonld: []};
        var element = $compile(angular.element('<mapping-editor></mapping-editor>'))(scope);
        scope.$digest();

        var button = angular.element(element.querySelectorAll('.mapping-title button')[0]);
        button.triggerHandler('click');
        expect(mapperStateSvc.editMappingName).toBe(true);
    });
    it('should call resetEdit when the edit cancel link is clicked', function() {
        mappingManagerSvc.mapping = {jsonld: []};
        mapperStateSvc.selectedClassMappingId = 'class';
        var element = $compile(angular.element('<mapping-editor></mapping-editor>'))(scope);
        scope.$digest();

        var link = angular.element(element.querySelectorAll('.edit-cancel')[0]);
        link.triggerHandler('click');
        expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
    });
});
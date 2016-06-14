describe('Mapping Preview directive', function() {
    var $compile,
        scope,
        ontologyManagerSvc,
        mappingManagerSvc,
        mapperStateSvc;

    mockPrefixes();
    beforeEach(function() {
        module('mappingPreview');
        mockOntologyManager();
        mockMappingManager();
        mockMapperState();
        
        inject(function(_ontologyManagerService_, _mappingManagerService_, _mapperStateService_) {
            ontologyManagerSvc = _ontologyManagerService_;
            mappingManagerSvc = _mappingManagerService_;
            mapperStateSvc = _mapperStateService_;
        });

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    injectDirectiveTemplate('modules/mapper/directives/mappingPreview/mappingPreview.html');

    describe('controller methods', function() {
        beforeEach(function() {
            mappingManagerSvc.mapping = {jsonld: []};
            this.element = $compile(angular.element('<mapping-preview></mapping-preview>'))(scope);
            scope.$digest();
        });
        it('should test whether an ontology exists', function() {
            var controller = this.element.controller('mappingPreview');
            var result = controller.ontologyExists();
            expect(result).toBe(false);

            ontologyManagerSvc.getOntologyIds.and.returnValue(['']);
            mappingManagerSvc.getSourceOntologyId.and.returnValue('');
            result = controller.ontologyExists();
            expect(result).toBe(true);
        });
        it('should get a class name', function() {
            var controller = this.element.controller('mappingPreview');
            var classMapping = {};
            var result = controller.getClassName(classMapping);
            expect(mappingManagerSvc.getClassIdByMapping).toHaveBeenCalledWith(classMapping);
            expect(ontologyManagerSvc.getBeautifulIRI).toHaveBeenCalled();
            expect(typeof result).toBe('string');
        });
        it('should get a prop name', function() {
            var controller = this.element.controller('mappingPreview');
            var propMapping = {};
            var result = controller.getPropName(propMapping);
            expect(mappingManagerSvc.getPropIdByMapping).toHaveBeenCalledWith(propMapping);
            expect(ontologyManagerSvc.getBeautifulIRI).toHaveBeenCalled();
            expect(typeof result).toBe('string');
        });
        describe('should set the correct state for using a mapping', function() {
            it('if the ontology is valid', function() {
                var controller = this.element.controller('mappingPreview');
                var ontology = {'@id': 'test'};
                ontologyManagerSvc.getList.and.returnValue([ontology]);
                mappingManagerSvc.getSourceOntologyId.and.returnValue(ontology['@id']);
                controller.useMapping();
                scope.$apply();
                expect(mapperStateSvc.editMapping).toBe(true);
                expect(mapperStateSvc.newMapping).toBe(false);
                expect(ontologyManagerSvc.getThenRestructure).not.toHaveBeenCalled();
                expect(ontologyManagerSvc.getImportedOntologies).toHaveBeenCalledWith(ontology['@id']);
                expect(mappingManagerSvc.sourceOntologies).toContain(ontology);
                expect(mapperStateSvc.step).toBe(mapperStateSvc.fileUploadStep);

                ontologyManagerSvc.getList.and.returnValue([]);
                controller.useMapping();
                scope.$apply();
                expect(mapperStateSvc.editMapping).toBe(true);
                expect(mapperStateSvc.newMapping).toBe(false);
                expect(ontologyManagerSvc.getThenRestructure).toHaveBeenCalledWith(ontology['@id']);
                expect(ontologyManagerSvc.getImportedOntologies).toHaveBeenCalled();
                expect(mapperStateSvc.step).toBe(mapperStateSvc.fileUploadStep);
            });
            it('if the ontology is invalid', function() {
                var controller = this.element.controller('mappingPreview');
                var ontology = {'@id': 'test'};
                ontologyManagerSvc.getList.and.returnValue([ontology]);
                mappingManagerSvc.getSourceOntologyId.and.returnValue(ontology['@id']);
                mappingManagerSvc.getAllClassMappings.and.returnValue([{'mapsTo': 'test'}]);
                ontologyManagerSvc.getClass.and.returnValue(undefined);
                controller.useMapping();
                scope.$apply();
                expect(mapperStateSvc.editMapping).toBe(true);
                expect(mapperStateSvc.newMapping).toBe(false);
                expect(ontologyManagerSvc.getThenRestructure).not.toHaveBeenCalled();
                expect(ontologyManagerSvc.getImportedOntologies).not.toHaveBeenCalled();
                expect(mappingManagerSvc.sourceOntologies).not.toContain(ontology);
                expect(mapperStateSvc.step).toBe(0);
                expect(mapperStateSvc.invalidOntology).toBe(true);
            });
        });
        it('should get the column index of a data mapping', function() {
            var controller = this.element.controller('mappingPreview');
            var propMapping = {'columnIndex': [{'@value': '0'}]};
            var result = controller.getColumnIndex(propMapping);
            expect(result).toBe(0);
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<mapping-preview></mapping-preview>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('mapping-preview')).toBe(true);
            expect(this.element.querySelectorAll('.boxed').length).toBe(1);
        });
        it('depending on whether a mpaping has been selected', function() {
            mappingManagerSvc.mapping = undefined;
            scope.$digest();
            expect(this.element.querySelectorAll('.lead').length).toBe(1);
            expect(this.element.find('custom-button').length).toBe(0);
            expect(this.element.querySelectorAll('.class-list').length).toBe(0);
            expect(this.element.querySelectorAll('.list').length).toBe(0);

            mappingManagerSvc.mapping = {jsonld: []};
            scope.$digest();
            expect(this.element.querySelectorAll('.lead').length).toBe(0);
            expect(this.element.find('custom-button').length).toBe(1);
            expect(this.element.querySelectorAll('.class-list').length).toBe(1);
            expect(this.element.querySelectorAll('.list').length).toBe(1);
        });
        it('with the correct classes based on whether the source ontology exists', function() {
            mappingManagerSvc.mapping = {jsonld: []};
            var controller = this.element.controller('mappingPreview');
            spyOn(controller, 'ontologyExists').and.returnValue(true);
            scope.$digest();
            var sourceOntologyName = angular.element(this.element.querySelectorAll('.source-ontology')[0]);
            expect(sourceOntologyName.hasClass('text-danger')).toBe(false);
            expect(sourceOntologyName.find('span').length).toBe(0);

            controller.ontologyExists.and.returnValue(false);
            scope.$digest();
            expect(sourceOntologyName.hasClass('text-danger')).toBe(true);
            expect(sourceOntologyName.find('span').length).toBe(1);
        });
        it('with all class and property mappings displayed', function() {
            mappingManagerSvc.mapping = {jsonld: []};
            var classMappings = [{'@id': ''}];
            var propMappings = [{'@id': ''}];
            mappingManagerSvc.getAllClassMappings.and.returnValue(classMappings);
            mappingManagerSvc.getPropMappingsByClass.and.returnValue(propMappings);
            scope.$digest();
            var classListItems = this.element.querySelectorAll('.list > li');
            expect(classListItems.length).toBe(classMappings.length);
            _.forEach(classListItems, function(item) {
                expect(item.querySelectorAll('.props > li').length).toBe(propMappings.length);
            });
        });
        it('depending on the type of property mapping', function() {
            mappingManagerSvc.mapping = {jsonld: []};
            var classMappings = [{'@id': ''}];
            var propMappings = [{'@id': '', '@type': 'DataMapping', 'columnIndex': [{'@value': '0'}]}];
            mappingManagerSvc.getAllClassMappings.and.returnValue(classMappings);
            mappingManagerSvc.getPropMappingsByClass.and.returnValue(propMappings);
            scope.$digest();
            var propItem = angular.element(this.element.querySelectorAll('.props > li')[0]);
            expect(propItem.html()).toContain('Column');

            var propMappings = [{'@id': ''}];
            mappingManagerSvc.getPropMappingsByClass.and.returnValue(propMappings);
            scope.$digest();
            propItem = angular.element(this.element.querySelectorAll('.props > li')[0]);
            expect(propItem.html()).not.toContain('Column');
        });
    });
});
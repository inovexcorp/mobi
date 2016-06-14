describe('Starting Class Select Overlay directive', function() {
    var $compile,
        scope,
        ontologyManagerSvc,
        mappingManagerSvc,
        mapperStateSvc;

    mockPrefixes();
    beforeEach(function() {
        module('startingClassSelectOverlay');
        mockOntologyManager();
        mockMappingManager();
        mockMapperState();

        module(function($provide) {
            $provide.value('highlightFilter', jasmine.createSpy('highlightFilter'));
            $provide.value('trustedFilter', jasmine.createSpy('trustedFilter'));
        });
        
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

    injectDirectiveTemplate('modules/mapper/directives/startingClassSelectOverlay/startingClassSelectOverlay.html');

    describe('controller methods', function() {
        beforeEach(function() {
            mappingManagerSvc.mapping = {jsonld: []};
            this.element = $compile(angular.element('<starting-class-select-overlay></starting-class-select-overlay>'))(scope);
            scope.$digest();
        });
        it('should get the id of the ontology with a class', function() {
            var controller = this.element.controller('startingClassSelectOverlay');
            var result = controller.getOntologyId({});
            expect(typeof result).toBe('string');
            expect(ontologyManagerSvc.findOntologyWithClass).toHaveBeenCalled();
        });
        it('should get the classes in the ontology and imported ontologies', function() {
            ontologyManagerSvc.getClasses.calls.reset();
            var controller = this.element.controller('startingClassSelectOverlay');
            var result = controller.getClasses();
            expect(ontologyManagerSvc.getClasses.calls.count()).toBe(mappingManagerSvc.sourceOntologies.length);
            expect(Array.isArray(result)).toBe(true);
        });
        it('should set the correct state for going back', function() {
            var controller = this.element.controller('startingClassSelectOverlay');
            controller.back();
            expect(mapperStateSvc.step).toBe(mapperStateSvc.ontologySelectStep);
        });
        it('should set the correct state for continuing', function() {
            var controller = this.element.controller('startingClassSelectOverlay');
            mapperStateSvc.changeOntology = false;
            controller.selectedClass = {'@id': ''};
            controller.continue();
            expect(mapperStateSvc.clearCachedSourceOntologies).not.toHaveBeenCalled();
            expect(mappingManagerSvc.getSourceOntologyId).not.toHaveBeenCalled();
            expect(mappingManagerSvc.createNewMapping).not.toHaveBeenCalled();
            expect(mappingManagerSvc.setSourceOntology).not.toHaveBeenCalled();
            expect(mapperStateSvc.changedMapping).not.toHaveBeenCalled();
            expect(ontologyManagerSvc.findOntologyWithClass).toHaveBeenCalledWith(mappingManagerSvc.sourceOntologies, controller.selectedClass['@id']);
            expect(mappingManagerSvc.addClass).toHaveBeenCalled();
            expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
            expect(mapperStateSvc.updateAvailableProps).toHaveBeenCalled();
            expect(mapperStateSvc.step).toBe(mapperStateSvc.editMappingStep);

            mapperStateSvc.changeOntology = true;
            controller.continue();
            expect(mapperStateSvc.clearCachedSourceOntologies).toHaveBeenCalled();
            expect(mappingManagerSvc.getSourceOntologyId).toHaveBeenCalledWith(mappingManagerSvc.mapping.jsonld);
            expect(mappingManagerSvc.createNewMapping).toHaveBeenCalledWith(mappingManagerSvc.mapping.name);
            expect(mappingManagerSvc.setSourceOntology).toHaveBeenCalled();
            expect(mapperStateSvc.changedMapping).toHaveBeenCalled();
            expect(ontologyManagerSvc.findOntologyWithClass).toHaveBeenCalledWith(mappingManagerSvc.sourceOntologies, controller.selectedClass['@id']);
            expect(mappingManagerSvc.addClass).toHaveBeenCalled();
            expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
            expect(mapperStateSvc.updateAvailableProps).toHaveBeenCalled();
            expect(mapperStateSvc.step).toBe(mapperStateSvc.editMappingStep);
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            mappingManagerSvc.mapping = {jsonld: []};
            this.element = $compile(angular.element('<starting-class-select-overlay></starting-class-select-overlay>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('starting-class-select-overlay')).toBe(true);
            expect(this.element.querySelectorAll('form.content').length).toBe(1);
            expect(this.element.querySelectorAll('div.class-select').length).toBe(1);
        });
        it('with a ui-select', function() {
            expect(this.element.find('ui-select').length).toBe(1);
        });
        it('with a class preview', function() {
            expect(this.element.find('class-preview').length).toBe(1);
        });
        it('with custom buttons for back and continue', function() {
            var buttons = this.element.find('custom-button');
            expect(buttons.length).toBe(2);
            expect(['Back', 'Continue'].indexOf(angular.element(buttons[0]).text()) >= 0).toBe(true);
            expect(['Back', 'Continue'].indexOf(angular.element(buttons[1]).text()) >= 0).toBe(true);
        });
    });
});
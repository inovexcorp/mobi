describe('Ontology Select Overlay directive', function() {
    var $compile,
        scope,
        ontologyManagerSvc,
        mappingManagerSvc,
        mapperStateSvc;

    beforeEach(function() {
        module('ontologySelectOverlay');
        mockOntologyManager();
        mockMappingManager();
        mockMapperState();

        module(function($provide) {
            $provide.value('beautifyFilter', jasmine.createSpy('beautifyFilter').and.callFake(function(str) {
                return '';
            }));
            $provide.value('splitIRIFilter', jasmine.createSpy('splitIRIFilter').and.callFake(function(iri) {
                return {
                    begin: '',
                    then: '',
                    end: ''
                }
            }));
            $provide.value('highlightFilter', jasmine.createSpy('highlightFilter'));
            $provide.value('trustedFilter', jasmine.createSpy('trustedFilter'));
        });

        inject(function(_ontologyManagerService_, _mappingManagerService_, _mapperStateService_) {
            ontologyManagerSvc = _ontologyManagerService_;
            mapperStateSvc = _mapperStateService_;
            mappingManagerSvc = _mappingManagerService_;
        });

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    injectDirectiveTemplate('modules/mapper/directives/ontologySelectOverlay/ontologySelectOverlay.html');

    describe('should intialize with the correct values', function() {
        it('using opened and closed ontologies', function() {
            ontologyManagerSvc.getList.and.returnValue([{'@id': 'open'}]);
            ontologyManagerSvc.getOntologyIds.and.returnValue(['closed']);
            var element = $compile(angular.element('<ontology-select-overlay></ontology-select-overlay>'))(scope);
            scope.$digest();
            var controller = element.controller('ontologySelectOverlay');
            expect(controller.ontologyIds).toContain('open');
            expect(controller.ontologyIds).toContain('closed');
        });
        it('if a mapping has not been set', function() {
            mappingManagerSvc.mapping = {jsonld: []};
            mappingManagerSvc.sourceOntologies = [];
            var element = $compile(angular.element('<ontology-select-overlay></ontology-select-overlay>'))(scope);
            scope.$digest();
            var controller = element.controller('ontologySelectOverlay');
            expect(controller.ontologyIds.length).toBe(0);
            expect(controller.selectedOntology).toEqual(undefined);
            expect(controller.selectedOntologyId).toBe('');
        });
        it('if a mapping has already been set', function() {
            mappingManagerSvc.mapping = {jsonld: []};
            var sourceOntology = {'@id': ''};
            mappingManagerSvc.sourceOntologies = [sourceOntology];
            mappingManagerSvc.getSourceOntology.and.returnValue(sourceOntology);
            var element = $compile(angular.element('<ontology-select-overlay></ontology-select-overlay>'))(scope);
            scope.$digest();
            var controller = element.controller('ontologySelectOverlay');
            expect(controller.ontologyIds.length).toBe(1);
            expect(controller.selectedOntology).toEqual(sourceOntology);
            expect(controller.selectedOntologyId).toBe(sourceOntology['@id']);
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            mappingManagerSvc.mapping = {jsonld: []};
            this.sourceOntology = {'@id': ''};
            mappingManagerSvc.sourceOntologies = [this.sourceOntology];
            mappingManagerSvc.getSourceOntology.and.returnValue(this.sourceOntology);
            this.element = $compile(angular.element('<ontology-select-overlay></ontology-select-overlay>'))(scope);
            scope.$digest();
        });
        it('should test whether an ontology is open', function() {
            var controller = this.element.controller('ontologySelectOverlay');
            var result = controller.isOpen('test');
            expect(result).toBe(false);
            result = controller.isOpen('');
            expect(result).toBe(true);
        });
        it('should get an ontology by id', function() {
            var controller = this.element.controller('ontologySelectOverlay');
            controller.getOntology('test');
            scope.$digest();
            expect(ontologyManagerSvc.getThenRestructure).toHaveBeenCalledWith('test');
            expect(typeof controller.selectedOntology).toBe('object');
            expect(controller.selectedOntology['@id']).toBe('test');

            ontologyManagerSvc.getThenRestructure.calls.reset();
            controller.getOntology('test');
            scope.$digest();
            expect(ontologyManagerSvc.getThenRestructure).not.toHaveBeenCalled();
            expect(typeof controller.selectedOntology).toBe('object');
            expect(controller.selectedOntology['@id']).toBe('test');
        });
        it('should get the name of the passed ontology', function() {
            var controller = this.element.controller('ontologySelectOverlay');
            var result = controller.getName('test');
            expect(ontologyManagerSvc.getEntityName).not.toHaveBeenCalled();
            expect(typeof result).toBe('string');

            controller.getOntology('test');
            scope.$digest();
            result = controller.getName('test');
            expect(ontologyManagerSvc.getEntityName).toHaveBeenCalled();
            expect(typeof result).toBe('string');
        });
        it('should set the correct state for continuing', function() {
            var sourceOntologies = angular.copy(mappingManagerSvc.sourceOntologies);
            mapperStateSvc.step = 2;
            mapperStateSvc.changeOntology = false;
            var controller = this.element.controller('ontologySelectOverlay');
            controller.selectedOntologyId = '';
            controller.continue();
            expect(mapperStateSvc.cacheSourceOntologies).not.toHaveBeenCalled();
            expect(mapperStateSvc.getCachedSourceOntologyId).toHaveBeenCalled();
            expect(mappingManagerSvc.setSourceOntology).not.toHaveBeenCalled();
            expect(ontologyManagerSvc.getImportedOntologies).not.toHaveBeenCalled();
            expect(mappingManagerSvc.sourceOntologies).toEqual(sourceOntologies);
            expect(mapperStateSvc.step).toBe(3);

            mapperStateSvc.step = 2;
            mapperStateSvc.changeOntology = true;
            controller.continue();
            expect(mapperStateSvc.cacheSourceOntologies).toHaveBeenCalled();
            expect(mapperStateSvc.getCachedSourceOntologyId).toHaveBeenCalled();
            expect(mappingManagerSvc.setSourceOntology).not.toHaveBeenCalled();
            expect(ontologyManagerSvc.getImportedOntologies).not.toHaveBeenCalled();
            expect(mappingManagerSvc.sourceOntologies).toEqual(sourceOntologies);
            expect(mapperStateSvc.step).toBe(3);

            mapperStateSvc.step = 2;
            controller.selectedOntology = {'@id': 'test'};
            controller.selectedOntologyId = controller.selectedOntology['@id'];
            controller.continue();
            expect(mapperStateSvc.cacheSourceOntologies).toHaveBeenCalled();
            expect(mapperStateSvc.getCachedSourceOntologyId).toHaveBeenCalled();
            expect(mappingManagerSvc.setSourceOntology).toHaveBeenCalledWith(mappingManagerSvc.mapping.jsonld, controller.selectedOntologyId);
            expect(ontologyManagerSvc.getImportedOntologies).toHaveBeenCalledWith(controller.selectedOntologyId);
            expect(mappingManagerSvc.sourceOntologies).not.toEqual(sourceOntologies);
            expect(mapperStateSvc.step).toBe(3);
        });
        it('should set the correct state for going back', function() {
            var controller = this.element.controller('ontologySelectOverlay');
            var sourceOntologies = angular.copy(mappingManagerSvc.sourceOntologies);
            mapperStateSvc.changeOntology = true;
            controller.back();
            expect(mapperStateSvc.restoreCachedSourceOntologies).toHaveBeenCalled();
            expect(mapperStateSvc.step).toBe(4);
            expect(mapperStateSvc.changeOntology).toBe(false);
            expect(mappingManagerSvc.sourceOntologies).toEqual(sourceOntologies);
            expect(mappingManagerSvc.setSourceOntology).not.toHaveBeenCalled();

            mapperStateSvc.restoreCachedSourceOntologies.calls.reset();
            mapperStateSvc.changeOntology = false;
            controller.back();
            expect(mapperStateSvc.restoreCachedSourceOntologies).not.toHaveBeenCalled();
            expect(mapperStateSvc.step).toBe(1);
            expect(mappingManagerSvc.sourceOntologies).toEqual([]);
            expect(mappingManagerSvc.setSourceOntology).toHaveBeenCalledWith(mappingManagerSvc.mapping.jsonld, '');
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            mappingManagerSvc.mapping = {jsonld: []};
            this.element = $compile(angular.element('<ontology-select-overlay ontology="ontology" on-click-back="onClickBack()" on-click-continue="onClickContinue(ontologyId)"></ontology-select-overlay>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('ontology-select-overlay')).toBe(true);
            expect(this.element.querySelectorAll('form.content').length).toBe(1);
            expect(this.element.querySelectorAll('div.ontology-select').length).toBe(1);
        });
        it('with a ui-select', function() {
            expect(this.element.find('ui-select').length).toBe(1);
        });
        it('with an ontology preview', function() {
            expect(this.element.find('ontology-preview').length).toBe(1);
        });
        it('with custom buttons to go back and continue', function() {
            var buttons = this.element.find('custom-button');
            expect(buttons.length).toBe(2);
            expect(['Back', 'Continue'].indexOf(angular.element(buttons[0]).text()) >= 0).toBe(true);
            expect(['Back', 'Continue'].indexOf(angular.element(buttons[1]).text()) >= 0).toBe(true);
        });
    });
});
describe('RDF Preview directive', function() {
    var $compile,
        scope,
        jsonFilter = jasmine.createSpy('jsonFilter'),
        csvManagerSvc,
        mappingManagerSvc;

    beforeEach(function() {
        module('rdfPreview');
        mockMappingManager();
        mockCsvManager();

        module(function($provide) {
            $provide.value('jsonFilter', jsonFilter);
        });

        inject(function(_csvManagerService_, _mappingManagerService_) {
            csvManagerSvc = _csvManagerService_;
            mappingManagerSvc = _mappingManagerService_;
        });

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    injectDirectiveTemplate('modules/mapper/directives/rdfPreview/rdfPreview.html');

    describe('controller methods', function() {
        it('should generate an RDF preview', function() {
            mappingManagerSvc.mapping = {jsonld: []};
            var element = $compile(angular.element('<rdf-preview></rdf-preview>'))(scope);
            scope.$digest();
            var controller = element.controller('rdfPreview');
            controller.serializeOption = 'jsonld';
            controller.generatePreview();
            scope.$apply();
            expect(csvManagerSvc.previewMap).toHaveBeenCalledWith(mappingManagerSvc.mapping.jsonld, controller.serializeOption);
            expect(typeof controller.preview).toBe('object');

            controller.serializeOption = 'turtle';
            controller.generatePreview();
            scope.$apply();
            expect(csvManagerSvc.previewMap).toHaveBeenCalledWith(mappingManagerSvc.mapping.jsonld, controller.serializeOption);
            expect(typeof controller.preview).toBe('string');
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            mappingManagerSvc.mapping = {jsonld: []};
            this.element = $compile(angular.element('<rdf-preview></rdf-preview>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('rdf-preview')).toBe(true);
            expect(this.element.hasClass('slide')).toBe(true);
        });
        it('with the correct classes depending on whether it is visible', function() {
            var toggleIcon = angular.element(this.element.querySelectorAll('.toggle-btn i')[0]);
            expect(this.element.hasClass('out')).toBe(false);
            expect(this.element.hasClass('in')).toBe(true);
            expect(toggleIcon.hasClass('fa-chevron-right')).toBe(false);
            expect(toggleIcon.hasClass('fa-chevron-left')).toBe(true);

            var controller = this.element.controller('rdfPreview');
            controller.visible = true;
            scope.$digest();
            expect(this.element.hasClass('out')).toBe(true);
            expect(this.element.hasClass('in')).toBe(false);
            expect(toggleIcon.hasClass('fa-chevron-right')).toBe(true);
            expect(toggleIcon.hasClass('fa-chevron-left')).toBe(false);
        });
        it('with the correctly formatted preview', function() {
            jsonFilter.calls.reset();
            var controller = this.element.controller('rdfPreview');
            controller.preview = '';
            scope.$digest();
            expect(jsonFilter).not.toHaveBeenCalled();

            controller.preview = {};
            scope.$digest();
            expect(jsonFilter).toHaveBeenCalledWith({}, 4);
        });
    });
    it('should set the visibility when the toggle button is clicked', function() {
        var element = $compile(angular.element('<rdf-preview></rdf-preview>'))(scope);
        scope.$digest();
        var controller = element.controller('rdfPreview');
        expect(controller.visible).toBe(false);
        angular.element(element.querySelectorAll('.toggle-btn')).triggerHandler('click');
        expect(controller.visible).toBe(true);
    });
    it('should call generatePreview when the Refresh button is clicked', function() {
        scope.createPreview = jasmine.createSpy('createPreview');
        var element = $compile(angular.element('<rdf-preview></rdf-preview>'))(scope);
        scope.$digest();
        var controller = element.controller('rdfPreview');
        spyOn(controller, 'generatePreview');
        angular.element(element.querySelectorAll('.controls button')).triggerHandler('click');
        expect(controller.generatePreview).toHaveBeenCalled();
    });
});
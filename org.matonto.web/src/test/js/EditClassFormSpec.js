describe('Edit Class Form directive', function() {
    var $compile,
        scope,
        ontologyManagerSvc,
        mappingManagerSvc,
        mapperStateSvc;

    mockPrefixes();
    beforeEach(function() {
        module('templates');
        module('editClassForm');
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

    describe('controller methods', function() {
        beforeEach(function() {
            mappingManagerSvc.mapping = {
                jsonld: [{'@id': ''}]
            };

            this.element = $compile(angular.element('<edit-class-form></edit-class-form>'))(scope);
            scope.$digest();
        });
        it('should create the IRI template for the class mapping', function() {
            var controller = this.element.controller('editClassForm');
            var result = controller.getIriTemplate();
            expect(typeof result).toBe('string');
        });
        it('should get a class title', function() {
            var controller = this.element.controller('editClassForm');
            var result = controller.getTitle();

            expect(mappingManagerSvc.getClassIdByMappingId).toHaveBeenCalled();
            expect(ontologyManagerSvc.getClass).toHaveBeenCalled();
            expect(ontologyManagerSvc.getEntityName).toHaveBeenCalled();
            expect(typeof result).toBe('string');
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            mappingManagerSvc.mapping = {
                jsonld: [{'@id': ''}]
            };

            this.element = $compile(angular.element('<edit-class-form></edit-class-form>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('edit-class')).toBe(true);
            expect(this.element.querySelectorAll('.iri-template').length).toBe(1);
        });
    });
    it('should set the correct state when the edit link is clicked', function() {
        mappingManagerSvc.mapping = {
            jsonld: [{'@id': ''}]
        };

        var element = $compile(angular.element('<edit-class-form></edit-class-form>'))(scope);
        scope.$digest();

        angular.element(element.querySelectorAll('.iri-template a')[0]).triggerHandler('click');
        expect(mapperStateSvc.editIriTemplate).toBe(true);
    });
});
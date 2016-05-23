describe('Edit Class Form directive', function() {
    var $compile,
        scope,
        ontologyManagerSvc,
        mappingManagerSvc;

    mockPrefixes();
    beforeEach(function() {
        module('editClassForm');
        mockOntologyManager();
        mockMappingManager();

        inject(function(_ontologyManagerService_, _mappingManagerService_) {
            ontologyManagerSvc = _ontologyManagerService_;
            mappingManagerSvc = _mappingManagerService_;
        });

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    injectDirectiveTemplate('modules/mapper/directives/editClassForm/editClassForm.html');

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.props = [];
            scope.isLastClass = true;
            scope.clickDelete = jasmine.createSpy('clickDelete');
            scope.openProp = jasmine.createSpy('openProp');
            scope.editIri = jasmine.createSpy('editIri');
            scope.mapping = {jsonld: []};
            scope.ontologies = [{}];
            scope.classMappingId = '';

            this.element = $compile(angular.element('<edit-class-form props="props" ontologies="ontologies" is-last-class="isLastClass" click-delete="clickDelete(classMappingId)" open-prop="openProp(propId)" edit-iri="editIri()" mapping="mapping" class-mapping-id="classMappingId"></edit-class-form>'))(scope);
            scope.$digest();
        });

        it('props should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.props = [{}];
            scope.$digest();
            expect(scope.props).toEqual([{}]);
        });
        it('isLastClass should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.isLastClass = false;
            scope.$digest();
            expect(scope.isLastClass).toEqual(false);
        });
        it('clickDelete should be called in the parent scope', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.clickDelete();

            expect(scope.clickDelete).toHaveBeenCalled();
        });
        it('openProp should be called in the parent scope', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.openProp();

            expect(scope.openProp).toHaveBeenCalled();
        });
        it('editIri should be called in the parent scope', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.editIri();

            expect(scope.editIri).toHaveBeenCalled();
        });
        it('mapping should be two way bound', function() {
            var controller = this.element.controller('editClassForm');
            controller.mapping = {jsonld: [{}]};
            scope.$digest();
            expect(scope.mapping).toEqual({jsonld: [{}]});
        });
        it('ontologies should be two way bound', function() {
            var controller = this.element.controller('editClassForm');
            controller.ontologies = [{'@id': ''}];
            scope.$digest();
            expect(scope.ontologies).toEqual([{'@id': ''}]);
        });
        it('classMappingId should be two way bound', function() {
            var controller = this.element.controller('editClassForm');
            controller.classMappingId = 'test';
            scope.$digest();
            expect(scope.classMappingId).toEqual('test');
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            scope.props = [];
            scope.isLastClass = true;
            scope.clickDelete = jasmine.createSpy('clickDelete');
            scope.openProp = jasmine.createSpy('openProp');
            scope.editIri = jasmine.createSpy('editIri');
            scope.mapping = {jsonld: [{'@id': ''}]};
            scope.ontologies = [{'@id': ''}];
            scope.classMappingId = '';

            this.element = $compile(angular.element('<edit-class-form props="props" ontologies="ontologies" is-last-class="isLastClass" click-delete="clickDelete(classMappingId)" open-prop="openProp(propId)" edit-iri="editIri()" mapping="mapping" class-mapping-id="classMappingId"></edit-class-form>'))(scope);
            scope.$digest();
        });
        it('should create the IRI template for the class mapping', function() {
            var controller = this.element.controller('editClassForm');
            var result = controller.getIriTemplate();
            expect(typeof result).toBe('string');
        });
        it('should call openProp with passed propId', function() {
            var controller = this.element.controller('editClassForm');
            controller.openProperty('test');

            expect(scope.openProp).toHaveBeenCalledWith('test');
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
            scope.mapping = {jsonld: []}
            scope.ontologies = [{'@id': ''}];

            this.element = $compile(angular.element('<edit-class-form props="props" ontologies="ontologies" is-last-class="isLastClass" click-delete="clickDelete(classMappingId)" open-prop="openProp(propId)" edit-iri="editIri()" mapping="mapping" class-mapping-id="classMappingId"></edit-class-form>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('edit-class')).toBe(true);
            expect(this.element.querySelectorAll('.iri-template').length).toBe(1);
        });
        it('with an available prop list', function() {
            expect(this.element.find('available-prop-list').length).toBe(1);
        });
        it('with a custom button to delete', function() {
            var buttons = this.element.find('custom-button');
            expect(buttons.length).toBe(1);
            expect(angular.element(buttons[0]).text()).toBe('Delete');
        });
    });
    it('should call editIri when the edit link is clicked', function() {
        scope.editIri = jasmine.createSpy('editIri');
        scope.mapping = {jsonld: [{'@id': ''}]};
        scope.ontologies = [{'@id': ''}];
        scope.classMappingId = '';

        var element = $compile(angular.element('<edit-class-form props="props" ontologies="ontologies" is-last-class="isLastClass" click-delete="clickDelete(classMappingId)" open-prop="openProp(propId)" edit-iri="editIri()" mapping="mapping" class-mapping-id="classMappingId"></edit-class-form>'))(scope);
        scope.$digest();

        angular.element(element.querySelectorAll('.iri-template a')[0]).triggerHandler('click');
        expect(scope.editIri).toHaveBeenCalled();
    });
});
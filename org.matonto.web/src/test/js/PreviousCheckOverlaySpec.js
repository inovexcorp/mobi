describe('Previous Check Overlay directive', function() {
    var $compile,
        scope,
        ontologyManagerSvc,
        mappingManagerSvc;

    beforeEach(function() {
        module('previousCheckOverlay');
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

    injectDirectiveTemplate('modules/mapper/directives/previousCheckOverlay/previousCheckOverlay.html');

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.onClickBack = jasmine.createSpy('onClickBack');
            scope.onClickContinue = jasmine.createSpy('onClickContinue');
            scope.mapping = {};
            scope.ontology = {};
            scope.filePreview = {};

            this.element = $compile(angular.element('<previous-check-overlay on-click-back="onClickBack()" on-click-continue="onClickContinue()" mapping="mapping" ontology="ontology" file-preview="filePreview"></previous-check-overlay>'))(scope);
            scope.$digest();
        });

        it('onClickBack should be called in the parent scope', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.onClickBack();

            expect(scope.onClickBack).toHaveBeenCalled();
        });
        it('onClickContinue should be called in the parent scope', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.onClickContinue();

            expect(scope.onClickContinue).toHaveBeenCalled();
        });
        it('mapping should be two way bound', function() {
            var controller = this.element.controller('previousCheckOverlay');
            controller.mapping = {jsonld: []};
            scope.$digest();
            expect(scope.mapping).toEqual({jsonld: []});
        });
        it('ontology should be two way bound', function() {
            var controller = this.element.controller('previousCheckOverlay');
            controller.ontology = {'@id': ''};
            scope.$digest();
            expect(scope.ontology).toEqual({'@id': ''});
        });
        it('filePreview should be two way bound', function() {
            var controller = this.element.controller('previousCheckOverlay');
            controller.filePreview = {headers: []};
            scope.$digest();
            expect(scope.filePreview).toEqual({headers: []});
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            scope.mapping = {jsonld: []};
            scope.ontology = {};
            scope.filePreview = {};

            this.element = $compile(angular.element('<previous-check-overlay on-click-back="onClickBack()" on-click-continue="onClickContinue()" mapping="mapping" ontology="ontology" file-preview="filePreview"></previous-check-overlay>'))(scope);
            scope.$digest();
        });
        it('should get the name of a data mapping', function() {
            var controller = this.element.controller('previousCheckOverlay');
            var result = controller.getDataMappingName('');

            expect(mappingManagerSvc.getPropIdByMappingId).toHaveBeenCalledWith(controller.mapping.jsonld, '');
            expect(mappingManagerSvc.findClassWithDataMapping).toHaveBeenCalled();
            expect(mappingManagerSvc.getClassIdByMapping).toHaveBeenCalled();
            expect(ontologyManagerSvc.getClassProperty).toHaveBeenCalled();
            expect(ontologyManagerSvc.getClass).toHaveBeenCalled();
            expect(ontologyManagerSvc.getEntityName).toHaveBeenCalled();
            expect(typeof result).toBe('string');
        });
        it('should set the validity of the form based on the invalid columns', function() {
            var controller = this.element.controller('previousCheckOverlay');
            controller.setValidity();
            expect(controller.validateForm.$valid).toBe(true);
            
            controller.invalidColumns = [{index: 0, propId: ''}];
            controller.setValidity();
            expect(controller.validateForm.$valid).toBe(false);
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            scope.mapping = {};
            scope.ontology = {};
            scope.filePreview = {};

            this.element = $compile(angular.element('<previous-check-overlay on-click-back="onClickBack()" on-click-continue="onClickContinue()" mapping="mapping" ontology="ontology" file-preview="filePreview"></previous-check-overlay>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('previous-check-overlay')).toBe(true);
            expect(this.element.querySelectorAll('form.content').length).toBe(1);
        });
        it('with custom buttons to go back and continue', function() {
            var buttons = this.element.find('custom-button');
            expect(buttons.length).toBe(2);
            expect(['Back', 'Continue'].indexOf(angular.element(buttons[0]).text()) >= 0).toBe(true);
            expect(['Back', 'Continue'].indexOf(angular.element(buttons[1]).text()) >= 0).toBe(true);
        });
        it('depending on the validity of the form', function() {
            var controller = this.element.controller('previousCheckOverlay');
            expect(this.element.querySelectorAll('.valid').length).toBe(1);
            expect(this.element.querySelectorAll('.invalid-columns').length).toBe(0);
            expect(angular.element(this.element.find('custom-button')[1]).text()).toBe('Continue');

            controller.validateForm.$setValidity('validColumnMappings', false);
            scope.$digest();
            expect(this.element.querySelectorAll('.valid').length).toBe(0);
            expect(this.element.querySelectorAll('.invalid-columns').length).toBe(1);
            expect(angular.element(this.element.find('custom-button')[1]).text()).toBe('Fix');
        });
        it('with the correct number of list items for invalid mappings', function() {
            var controller = this.element.controller('previousCheckOverlay');
            expect(this.element.querySelectorAll('.invalid-columns li').length).toBe(0);
            controller.invalidColumns = [{index: 0, propId: ''}];
            controller.validateForm.$setValidity('validColumnMappings', false);
            scope.$digest();

            expect(this.element.querySelectorAll('.invalid-columns li').length).toBe(controller.invalidColumns.length);
        });
    });
});
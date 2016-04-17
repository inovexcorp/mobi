describe('Starting Class Select Overlay directive', function() {
    var $compile,
        scope,
        ontologyManagerSvc;

    mockOntologyManager();
    beforeEach(function() {
        module('startingClassSelectOverlay');

        module(function($provide) {
            $provide.value('highlightFilter', jasmine.createSpy('highlightFilter'));
            $provide.value('trustedFilter', jasmine.createSpy('trustedFilter'));
        });

        inject(function(ontologyManagerService) {
            ontologyManagerSvc = ontologyManagerService;
        });

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    injectDirectiveTemplate('modules/mapper/directives/startingClassSelectOverlay/startingClassSelectOverlay.html');

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.onClickBack = jasmine.createSpy('onClickBack');
            scope.onClickContinue = jasmine.createSpy('onClickContinue');
            scope.ontology = {'@id': ''};

            this.element = $compile(angular.element('<starting-class-select-overlay on-click-back="onClickBack()" on-click-continue="onClickContinue(classId)" ontology="ontology"></starting-class-select-overlay>'))(scope);
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
        it('ontology should be two way bound', function() {
            var controller = this.element.controller('startingClassSelectOverlay');
            controller.ontology = {'@id': 'test'};
            scope.$digest();
            expect(scope.ontology).toEqual({'@id': 'test'});
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            scope.ontology = {'@id': ''};
            this.element = $compile(angular.element('<starting-class-select-overlay on-click-back="onClickBack()" on-click-continue="onClickContinue(classId)" ontology="ontology"></starting-class-select-overlay>'))(scope);
            scope.$digest();
        });
        it('should get the ontology id', function() {
            var controller = this.element.controller('startingClassSelectOverlay');
            var result = controller.getOntologyId({});
            expect(result).toBe(scope.ontology['@id']);
        });
        it('should get the classes in the ontology identified by the passed id', function() {
            var controller = this.element.controller('startingClassSelectOverlay');
            var result = controller.getClasses();
            expect(ontologyManagerSvc.getClasses).toHaveBeenCalledWith(controller.ontology);
            expect(Array.isArray(result)).toBe(true);
        });
        it('should get the class identified by the passed ontology and class ids', function() {
            var controller = this.element.controller('startingClassSelectOverlay');
            var result = controller.getClass('');
            expect(ontologyManagerSvc.getClass).toHaveBeenCalledWith(controller.ontology, '');
            expect(typeof result).toBe('object');
        });
        it('should get the name of the passed class', function() {
            var controller = this.element.controller('startingClassSelectOverlay');
            var result = controller.getName({});
            expect(ontologyManagerSvc.getEntityName).toHaveBeenCalledWith({});
            expect(typeof result).toBe('string');
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            scope.ontology = {'@id': ''};
            this.element = $compile(angular.element('<starting-class-select-overlay on-click-back="onClickBack()" on-click-continue="onClickContinue(classId)" ontology="ontology"></starting-class-select-overlay>'))(scope);
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
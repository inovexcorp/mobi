describe('Starting Class Select Overlay directive', function() {
    var $compile,
        scope,
        ontologyManagerSvc;

    beforeEach(function() {
        module('startingClassSelectOverlay');
        mockOntologyManager();

        module(function($provide) {
            $provide.value('highlightFilter', jasmine.createSpy('highlightFilter'));
            $provide.value('trustedFilter', jasmine.createSpy('trustedFilter'));
        });
        
        inject(function(_ontologyManagerService_) {
            ontologyManagerSvc = _ontologyManagerService_;
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
            scope.ontologies = [{'@id': ''}];

            this.element = $compile(angular.element('<starting-class-select-overlay on-click-back="onClickBack()" on-click-continue="onClickContinue(classId)" ontologies="ontologies"></starting-class-select-overlay>'))(scope);
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
        it('ontologies should be two way bound', function() {
            var controller = this.element.controller('startingClassSelectOverlay');
            controller.ontologies = [{'@id': 'test'}];
            scope.$digest();
            expect(scope.ontologies).toEqual([{'@id': 'test'}]);
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            scope.ontologies = [{'@id': ''}];
            this.element = $compile(angular.element('<starting-class-select-overlay on-click-back="onClickBack()" on-click-continue="onClickContinue(classId)" ontologies="ontologies"></starting-class-select-overlay>'))(scope);
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
            expect(ontologyManagerSvc.getClasses.calls.count()).toBe(scope.ontologies.length);
            expect(Array.isArray(result)).toBe(true);
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
            scope.ontologies = [{'@id': ''}];
            this.element = $compile(angular.element('<starting-class-select-overlay on-click-back="onClickBack()" on-click-continue="onClickContinue(classId)" ontologies="ontologies"></starting-class-select-overlay>'))(scope);
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
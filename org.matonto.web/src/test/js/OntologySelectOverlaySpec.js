describe('Ontology Select Overlay directive', function() {
    var $compile,
        scope,
        ontologyManagerSvc;

    mockOntologyManager();
    beforeEach(function() {
        module('ontologySelectOverlay');

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

        inject(function(ontologyManagerService) {
            ontologyManagerSvc = ontologyManagerService;
        });

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    injectDirectiveTemplate('modules/mapper/directives/ontologySelectOverlay/ontologySelectOverlay.html');

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.ontology = undefined;
            scope.onClickBack = jasmine.createSpy('onClickBack');
            scope.onClickContinue = jasmine.createSpy('onClickContinue');

            this.element = $compile(angular.element('<ontology-select-overlay ontology="ontology" on-click-back="onClickBack()" on-click-continue="onClickContinue(ontologyId)"></ontology-select-overlay>'))(scope);
            scope.$digest();
        });

        it('ontology should be one way bound', function() {
            var controller = this.element.controller('ontologySelectOverlay');
            controller.ontology = {};
            scope.$digest();
            expect(scope.ontology).toEqual({});
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
    });
    describe('controller methods', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<ontology-select-overlay ontology="ontology" on-click-back="onClickBack()" on-click-continue="onClickContinue(ontologyId)"></ontology-select-overlay>'))(scope);
            scope.$digest();
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
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
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
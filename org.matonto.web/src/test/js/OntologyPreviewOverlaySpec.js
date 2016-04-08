describe('Ontology Preview Overlay directive', function() {
    var $compile,
        scope;

    mockOntologyManager();
    beforeEach(function() {
        module('ontologyPreviewOverlay');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    injectDirectiveTemplate('modules/mapper/directives/ontologyPreviewOverlay/ontologyPreviewOverlay.html');

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.close = jasmine.createSpy('close');
            scope.ontologyId = '';

            this.element = $compile(angular.element('<ontology-preview-overlay close="close()" ontology-id="{{ontologyId}}"></ontology-preview-overlay>'))(scope);
            scope.$digest();
        });

        it('close should be called in the parent scope', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.close();

            expect(scope.close).toHaveBeenCalled();
        });
        it('ontologyId should be one way bound', function() {
            var controller = this.element.controller('ontologyPreviewOverlay');
            controller.ontologyId = 'test';
            scope.$digest();
            expect(scope.ontologyId).not.toBe('test');
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<ontology-preview-overlay close="close()" ontology-id="ontologyId"></ontology-preview-overlay>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('ontology-preview-overlay')).toBe(true);
            expect(this.element.querySelectorAll('form.content').length).toBe(1);
        });
        it('with an ontology preview', function() {
            expect(this.element.find('ontology-preview').length).toBe(1);
        });
        it('with a custom button to close', function() {
            var buttons = this.element.find('custom-button');
            expect(buttons.length).toBe(1);
            expect(angular.element(buttons[0]).text()).toBe('Close');
        });
    });
});
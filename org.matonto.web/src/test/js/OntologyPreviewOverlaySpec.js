describe('Ontology Preview Overlay directive', function() {
    var $compile,
        scope,
        ontologyManagerSvc,
        mapperStateSvc;

    beforeEach(function() {
        module('templates');
        module('ontologyPreviewOverlay');
        mockOntologyManager();
        mockMapperState();

        inject(function(_ontologyManagerService_, _mapperStateService_) {
            ontologyManagerSvc = _ontologyManagerService_;
            mapperStateSvc = _mapperStateService_;
        });

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.ontology = {'@id': ''};

            this.element = $compile(angular.element('<ontology-preview-overlay ontology="ontology"></ontology-preview-overlay>'))(scope);
            scope.$digest();
        });
        it('ontology should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.ontology = {'@id': 'test'};
            scope.$digest();
            expect(scope.ontology).toEqual({'@id': 'test'});
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            scope.ontology = {'@id': ''};
            this.element = $compile(angular.element('<ontology-preview-overlay ontology="ontology"></ontology-preview-overlay>'))(scope);
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
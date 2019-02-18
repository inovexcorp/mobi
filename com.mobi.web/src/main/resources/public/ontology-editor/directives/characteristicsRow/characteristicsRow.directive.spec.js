describe('Characteristics Row directive', function() {
    var $compile, scope, ontologyStateSvc, $filter, ontologyManagerSvc;

    beforeEach(function() {
        module('templates');
        module('characteristicsRow');
        mockOntologyManager();
        mockOntologyState();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _ontologyManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyManagerSvc = _ontologyManagerService_;
        });

        this.element = $compile(angular.element('<characteristics-row></characteristics-row>'))(scope);
        scope.$digest();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        $filter = null;
        ontologyManagerSvc = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('characteristics-row')).toBe(true);
        });
        describe('when selected is not an object or data property', function() {
            it('for a row', function() {
                expect(this.element.querySelectorAll('.row').length).toBe(0);
            });
            it('for a characteristics-block', function() {
                expect(this.element.find('characteristics-block').length).toBe(0);
            });
        });
        describe('when selected is an object property', function() {
            beforeEach(function() {
                ontologyManagerSvc.isObjectProperty.and.returnValue(true);
                ontologyManagerSvc.isDataTypeProperty.and.returnValue(false);
                scope.$apply();
            });
            it('for a row', function() {
                expect(this.element.querySelectorAll('.row').length).toBe(1);
            });
            it('for a characteristics-block', function() {
                expect(this.element.find('characteristics-block').length).toBe(1);
            });
        });
        describe('when selected is a data property', function() {
            beforeEach(function() {
                ontologyManagerSvc.isObjectProperty.and.returnValue(false);
                ontologyManagerSvc.isDataTypeProperty.and.returnValue(true);
                scope.$apply();
            });
            it('for a row', function() {
                expect(this.element.querySelectorAll('.row').length).toBe(1);
            });
            it('for a characteristics-block', function() {
                expect(this.element.find('characteristics-block').length).toBe(1);
            });
        });
    });
});

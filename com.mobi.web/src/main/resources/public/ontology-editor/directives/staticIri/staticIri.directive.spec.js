describe('Static IRI directive', function() {
    var $compile, scope, $filter, ontologyStateSvc, ontoUtils, modalSvc;

    beforeEach(function() {
        module('templates');
        module('staticIri');
        mockOntologyState();
        mockOntologyUtilsManager();
        mockModal();
        injectSplitIRIFilter();

        inject(function(_$compile_, _$rootScope_, _$filter_, _ontologyStateService_, _ontologyUtilsManagerService_, _modalService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $filter = _$filter_;
            ontologyStateSvc = _ontologyStateService_;
            ontoUtils = _ontologyUtilsManagerService_;
            modalSvc = _modalService_;
        });

        scope.onEdit = jasmine.createSpy('onEdit');
        scope.iri = 'iri';
        scope.readOnly = true;
        scope.duplicateCheck = true;
        this.element = $compile(angular.element('<static-iri on-edit="onEdit()" iri="iri" read-only="readOnly" duplicate-check="duplicateCheck"></static-iri>'))(scope);
        scope.$digest();
        this.isolatedScope = this.element.isolateScope();
        this.controller = this.element.controller('staticIri');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $filter = null;
        ontologyStateSvc = null;
        ontoUtils = null;
        modalSvc = null;
        this.element.remove();
    });

    describe('in isolated scope', function() {
        it('onEdit should be called in parent scope', function() {
            this.isolatedScope.onEdit();
            scope.$digest();
            expect(scope.onEdit).toHaveBeenCalled();
        });
    });
    describe('controller bound variable', function() {
        it('iri should be two way bound', function() {
            this.controller.iri = 'new';
            scope.$digest();
            expect(scope.iri).toEqual('new');
        });
        it('duplicateCheck should be one way bound', function() {
            this.controller.duplicateCheck = false;
            scope.$digest();
            expect(scope.duplicateCheck).toEqual(true);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('static-iri')).toBe(true);
        });
        it('depending on whether the IRI is imported', function() {
            ontologyStateSvc.canModify.and.returnValue(true);
            scope.readOnly = false;
            scope.$digest();
            expect(this.element.find('a').length).toEqual(1);

            ontologyStateSvc.listItem.selected.mobi = {imported: true};
            scope.$digest();
            expect(this.element.find('a').length).toEqual(0);
        });
        it('depending on whether the user cannot modify', function() {
            ontologyStateSvc.canModify.and.returnValue(false);
            scope.$digest();
            expect(this.element.find('a').length).toEqual(0);
        });
        describe('depending on whether the IRI', function() {
            beforeEach(function() {
                this.strong = this.element.find('strong');
            });
            describe('exists in the ontology and duplicateCheck is', function() {
                beforeEach(function() {
                    ontoUtils.checkIri.and.returnValue(true);
                });
                it('true', function() {
                    scope.$digest();
                    var errorDisplay = this.element.find('error-display');
                    expect(errorDisplay.length).toBe(1);
                    expect(errorDisplay.text()).toBe('This IRI already exists');
                    expect(this.strong.hasClass('duplicate-iri')).toEqual(true);
                });
                it('false', function() {
                    scope.duplicateCheck = false;
                    scope.$digest();
                    expect(this.element.find('error-display').length).toBe(0);
                    expect(this.strong.hasClass('duplicate-iri')).toEqual(false);
                });
            });
            it('does not exist in the ontology', function() {
                ontoUtils.checkIri.and.returnValue(false);
                scope.$digest();

                expect(this.element.find('error-display').length).toBe(0);
                expect(this.strong.hasClass('duplicate-iri')).toEqual(false);
            });
            it('is read only', function() {
                ontologyStateSvc.listItem.selected.mobi = {imported: false};
                ontologyStateSvc.canModify.and.returnValue(true);
                scope.readOnly = true;
                scope.$digest();
                expect(this.element.find('a').length).toEqual(0);
            });
        });
    });
    describe('controller methods', function() {
        it('setVariables sets the parts of the IRI', function() {
            this.controller.iriBegin = 'begin';
            this.controller.iriThen = 'then';
            this.controller.iriEnd = 'end';
            this.controller.setVariables();
            expect(this.controller.iriBegin).toBe('');
            expect(this.controller.iriThen).toBe('');
            expect(this.controller.iriEnd).toBe('');
        });
        describe('showIriOverlay opens the editIriOverlay if duplicateCheck is', function() {
            it('true', function() {
                this.controller.showIriOverlay();
                expect(modalSvc.openModal).toHaveBeenCalledWith('editIriOverlay', {
                    iriBegin: this.controller.iriBegin,
                    iriThen: this.controller.iriThen,
                    iriEnd: this.controller.iriEnd,
                    customValidation: {
                        func: ontoUtils.checkIri,
                        msg: 'This IRI already exists'
                    }
                }, jasmine.any(Function));
            });
            it('false', function() {
                scope.duplicateCheck = false;
                scope.$digest();
                this.controller.showIriOverlay();
                expect(modalSvc.openModal).toHaveBeenCalledWith('editIriOverlay', {iriBegin: this.controller.iriBegin, iriThen: this.controller.iriThen, iriEnd: this.controller.iriEnd}, jasmine.any(Function));
            });
        });
    });
    it('updates appropriately when the IRI changes', function() {
        this.controller.setVariables = jasmine.createSpy('setVariables');
        this.controller.iri = 'new';
        scope.$digest();
        expect(this.controller.setVariables).toHaveBeenCalled();
    });
});

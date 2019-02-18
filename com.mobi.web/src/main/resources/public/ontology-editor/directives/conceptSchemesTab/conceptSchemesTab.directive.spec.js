describe('Concept Schemes Tab directive', function() {
    var $compile, scope, ontologyStateSvc, ontologyManagerSvc, ontologyUtilsManagerSvc, propertyManagerSvc, modalSvc;

    beforeEach(function() {
        module('templates');
        module('conceptSchemesTab');
        mockOntologyManager();
        mockOntologyState();
        mockOntologyUtilsManager();
        mockPropertyManager();
        mockModal();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _ontologyManagerService_, _ontologyUtilsManagerService_, _propertyManagerService_, _modalService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyManagerSvc = _ontologyManagerService_;
            ontologyUtilsManagerSvc = _ontologyUtilsManagerService_;
            propertyManagerSvc = _propertyManagerService_;
            modalSvc = _modalService_;
        });

        this.element = $compile(angular.element('<concept-schemes-tab></concept-schemes-tab>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('conceptSchemesTab');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        ontologyManagerSvc = null;
        ontologyUtilsManagerSvc = null;
        propertyManagerSvc = null;
        modalSvc = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('concept-schemes-tab')).toBe(true);
            expect(this.element.hasClass('row')).toBe(true);
        });
        it('with a concept-scheme-hierarchy-block', function() {
            expect(this.element.find('concept-scheme-hierarchy-block').length).toBe(1);
        });
        it('with a selected-details', function() {
            expect(this.element.find('selected-details').length).toBe(1);
        });
        it('with a annotation-block', function() {
            expect(this.element.find('annotation-block').length).toBe(1);
        });
        it('with a relationships-block', function() {
            expect(this.element.find('relationships-block').length).toBe(1);
        });
        it('with a usages-block', function() {
            expect(this.element.find('usages-block').length).toBe(1);
        });
        it('with a button to delete a concept scheme if a user can modify', function() {
            ontologyStateSvc.canModify.and.returnValue(true);
            scope.$digest();
            var button = this.element.querySelectorAll('button');
            expect(button.length).toBe(1);
            expect(angular.element(button[0]).text()).toContain('Delete');
        });
        it('with no button to delete a concept scheme if a user cannot modify', function() {
            ontologyStateSvc.canModify.and.returnValue(false);
            scope.$digest();
            var button = this.element.querySelectorAll('button');
            expect(button.length).toBe(0);
        });
        it('based on whether something is selected', function() {
            expect(this.element.querySelectorAll('.selected-entity').length).toEqual(1);

            ontologyStateSvc.listItem.selected = undefined;
            scope.$digest();
            expect(this.element.querySelectorAll('.selected-entity').length).toEqual(0);
        });
        it('depending on whether the selected entity is imported', function() {
            ontologyStateSvc.canModify.and.returnValue(true);
            scope.$digest();
            var button = angular.element(this.element.querySelectorAll('button')[0]);
            expect(button.attr('disabled')).toBeFalsy();

            ontologyStateSvc.listItem.selected.mobi = {imported: true};
            scope.$digest();
            expect(button.attr('disabled')).toBeTruthy();
        });
    });
    describe('controller methods', function() {
        it('should open a delete confirmation modal', function() {
            this.controller.showDeleteConfirmation();
            expect(modalSvc.openConfirmModal).toHaveBeenCalledWith(jasmine.any(String), this.controller.deleteEntity);
        });
        describe('should delete an entity', function() {
            it('if it is a concept', function() {
                this.controller.deleteEntity();
                expect(ontologyManagerSvc.isConcept).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, ontologyStateSvc.listItem.derivedConcepts);
                expect(ontologyUtilsManagerSvc.deleteConcept).toHaveBeenCalled();
                expect(ontologyUtilsManagerSvc.deleteConceptScheme).not.toHaveBeenCalled();
            });
            it('if it is a concept scheme', function() {
                ontologyManagerSvc.isConcept.and.returnValue(false);
                this.controller.deleteEntity();
                expect(ontologyManagerSvc.isConceptScheme).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, ontologyStateSvc.listItem.derivedConceptSchemes);
                expect(ontologyUtilsManagerSvc.deleteConcept).not.toHaveBeenCalled();
                expect(ontologyUtilsManagerSvc.deleteConceptScheme).toHaveBeenCalled();
            });
        });
    });
    describe('should update dvm.relationshipList when a', function() {
        beforeEach(function () {
            propertyManagerSvc.conceptSchemeRelationshipList = ['relationshipA', 'relationshipB'];
            propertyManagerSvc.schemeRelationshipList = ['relationshipD'];
            ontologyStateSvc.listItem.iriList = ['relationshipA'];
            ontologyStateSvc.listItem.derivedSemanticRelations = ['relationshipC'];
        });
        it('Concept is selected', function() {
            ontologyStateSvc.listItem.selected = {new: true};
            ontologyManagerSvc.isConcept.and.returnValue(true);
            scope.$digest();
            expect(this.controller.relationshipList).toEqual(['relationshipC', 'relationshipA']);
        });
        it('ConceptScheme is selected', function() {
            ontologyStateSvc.listItem.selected = {new: true};
            ontologyManagerSvc.isConcept.and.returnValue(false);
            ontologyManagerSvc.isConceptScheme.and.returnValue(true);
            scope.$digest();
            expect(this.controller.relationshipList).toEqual(['relationshipD']);
        });
    });
    it('should call showDeleteConfirmation when the delete concept scheme button is clicked', function() {
        ontologyStateSvc.canModify.and.returnValue(true);
        scope.$digest();
        spyOn(this.controller, 'showDeleteConfirmation');
        var button = angular.element(this.element.querySelectorAll('button')[0]);
        button.triggerHandler('click');
        expect(this.controller.showDeleteConfirmation).toHaveBeenCalled();
    });
});
describe('Object Property Block directive', function() {
    var $compile, scope, ontologyStateSvc, ontoUtils, modalSvc;

    beforeEach(function() {
        module('templates');
        module('objectPropertyBlock');
        mockOntologyState();
        mockOntologyUtilsManager();
        mockModal();
        injectShowPropertiesFilter();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _ontologyUtilsManagerService_, _modalService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            ontoUtils = _ontologyUtilsManagerService_;
            modalSvc = _modalService_;
        });

        ontologyStateSvc.listItem.selected = {
            'prop1': [{'@id': 'value1'}],
            'prop2': [{'@value': 'value2'}]
        };
        this.element = $compile(angular.element('<object-property-block></object-property-block>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('objectPropertyBlock');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        ontoUtils = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('object-property-block')).toBe(true);
            expect(this.element.hasClass('annotation-block')).toBe(true);
        });
        it('with a .section-header', function() {
            expect(this.element.querySelectorAll('.section-header').length).toBe(1);
        });
        it('with a link to add an object property if the user can modify', function() {
            ontologyStateSvc.canModify.and.returnValue(true);
            scope.$digest();
            expect(this.element.querySelectorAll('.section-header a').length).toBe(1);
        });
        it('with no link to add an object property if the user cannot modify', function() {
            ontologyStateSvc.canModify.and.returnValue(false);
            scope.$digest();
            expect(this.element.querySelectorAll('.section-header a').length).toBe(0);
        });
        it('depending on whether the selected individual is imported', function() {
            ontologyStateSvc.canModify.and.returnValue(true);
            scope.$digest();
            expect(this.element.querySelectorAll('.section-header a').length).toBe(1);

            ontologyStateSvc.listItem.selected.mobi = {imported: true};
            scope.$digest();
            expect(this.element.querySelectorAll('.section-header a').length).toBe(0);
        });
        it('depending on how many datatype properties there are', function() {
            expect(this.element.find('property-values').length).toBe(2);
            ontologyStateSvc.listItem.selected = undefined;
            scope.$digest();
            expect(this.element.find('property-values').length).toBe(0);
        });
    });
    describe('controller methods', function() {
        it('should set the correct manager values when opening the Add Object Property Overlay', function() {
            this.controller.openAddObjectPropOverlay();
            expect(ontologyStateSvc.editingProperty).toBe(false);
            expect(ontologyStateSvc.propertySelect).toBeUndefined();
            expect(ontologyStateSvc.propertyValue).toBe('');
            expect(ontologyStateSvc.propertyIndex).toBe(0);
            expect(modalSvc.openModal).toHaveBeenCalledWith('objectPropertyOverlay');
        });
        it('should set the correct manager values when opening the Remove Object Property Overlay', function() {
            this.controller.showRemovePropertyOverlay('key', 1);
            expect(this.controller.key).toBe('key');
            expect(ontoUtils.getRemovePropOverlayMessage).toHaveBeenCalledWith('key', 1);
            expect(modalSvc.openConfirmModal).toHaveBeenCalledWith('', jasmine.any(Function));
        });
        describe('should update vocabulary hierarchies on property removal', function() {
            beforeEach(function() {
                this.controller.key = 'prop';
                ontologyStateSvc.listItem.selected = {'@type': []};
            });
            it('if selected is a derived Concept or ConceptScheme', function() {
                ontoUtils.containsDerivedConcept.and.returnValue(true);
                this.controller.removeObjectProperty({});
                expect(ontoUtils.containsDerivedConcept).toHaveBeenCalledWith([]);
                expect(ontoUtils.removeFromVocabularyHierarchies).toHaveBeenCalledWith('prop', {});

                ontoUtils.containsDerivedConcept.and.returnValue(false);
                ontoUtils.containsDerivedConceptScheme.and.returnValue(true);
                this.controller.removeObjectProperty({});
                expect(ontoUtils.containsDerivedConceptScheme).toHaveBeenCalledWith([]);
                expect(ontoUtils.removeFromVocabularyHierarchies).toHaveBeenCalledWith('prop', {});
            });
            it('unless selected is not a derived Concept or ConceptScheme', function() {
                this.controller.removeObjectProperty({});
                expect(ontoUtils.containsDerivedConcept).toHaveBeenCalledWith([]);
                expect(ontoUtils.containsDerivedConceptScheme).toHaveBeenCalledWith([]);
                expect(ontoUtils.removeFromVocabularyHierarchies).not.toHaveBeenCalled();
            });
        });
    });
    it('should call openAddObjectPropOverlay when the link is clicked', function() {
        ontologyStateSvc.canModify.and.returnValue(true);
        scope.$digest();
        spyOn(this.controller, 'openAddObjectPropOverlay');
        var link = angular.element(this.element.querySelectorAll('.section-header a')[0]);
        link.triggerHandler('click');
        expect(this.controller.openAddObjectPropOverlay).toHaveBeenCalled();
    });
});
describe('Annotation Block directive', function() {
    var $compile, scope, ontologyStateSvc, ontoUtils, modalSvc;

    beforeEach(function() {
        module('templates');
        module('annotationBlock');
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
        this.element = $compile(angular.element('<annotation-block></annotation-block>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('annotationBlock');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        ontoUtils = null;
        modalSvc = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('annotation-block')).toBe(true);
            expect(this.element.querySelectorAll('.section-header').length).toBe(1);
        });
        it('depending on how many annotations there are', function() {
            expect(this.element.find('property-values').length).toBe(2);
            ontologyStateSvc.listItem.selected = undefined;
            scope.$digest();
            expect(this.element.find('property-values').length).toBe(0);
        });
        it('depending on whether the selected entity is imported', function() {
            ontologyStateSvc.listItem.selected.mobi = {imported: true};
            scope.$digest();
            expect(this.element.querySelectorAll('.section-header a').length).toBe(0);
        });
        it('depending on whether something is selected when the user can modify branch', function() {
            ontologyStateSvc.canModify.and.returnValue(true);
            scope.$digest();
            expect(this.element.querySelectorAll('.section-header a').length).toBe(1);
            ontologyStateSvc.listItem.selected = undefined;
            scope.$digest();
            expect(this.element.querySelectorAll('a.fa-plus').length).toBe(0);
        });
        it('if the user cannot modify branch', function() {
            ontologyStateSvc.canModify.and.returnValue(false);
            scope.$digest();
            expect(this.element.querySelectorAll('.section-header a').length).toBe(0);
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            ontologyStateSvc.canModify.and.returnValue(true);
            scope.$digest();
        });
        it('should set the correct manager values when opening the Add Annotation Overlay', function() {
            this.controller.openAddOverlay();
            expect(ontologyStateSvc.editingAnnotation).toBe(false);
            expect(ontologyStateSvc.annotationSelect).toBeUndefined();
            expect(ontologyStateSvc.annotationValue).toBe('');
            expect(ontologyStateSvc.annotationType).toBeUndefined();
            expect(ontologyStateSvc.annotationIndex).toBe(0);
            expect(ontologyStateSvc.annotationLanguage).toBe('en');
            expect(modalSvc.openModal).toHaveBeenCalledWith('annotationOverlay');
        });
        it('should set the correct manager values when opening the Remove Annotation Overlay', function() {
            this.controller.openRemoveOverlay('key', 1);
            expect(ontoUtils.getRemovePropOverlayMessage).toHaveBeenCalledWith('key', 1);
            expect(modalSvc.openConfirmModal).toHaveBeenCalledWith('', jasmine.any(Function));
        });
        it('should set the correct manager values when editing an annotation', function() {
            var annotationIRI = 'prop1';
            ontologyStateSvc.listItem.selected = {
                'prop1': [{'@value': 'value', '@type': 'type', '@language': 'language'}]
            };
            this.controller.editClicked(annotationIRI, 0);
            expect(ontologyStateSvc.editingAnnotation).toBe(true);
            expect(ontologyStateSvc.annotationSelect).toEqual(annotationIRI);
            expect(ontologyStateSvc.annotationValue).toBe('value');
            expect(ontologyStateSvc.annotationIndex).toBe(0);
            expect(ontologyStateSvc.annotationType).toBe('type');
            expect(ontologyStateSvc.annotationLanguage).toBe('language');
            expect(modalSvc.openModal).toHaveBeenCalledWith('annotationOverlay');
        });
    });
});
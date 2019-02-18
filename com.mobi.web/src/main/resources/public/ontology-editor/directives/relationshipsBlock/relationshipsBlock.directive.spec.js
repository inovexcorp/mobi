describe('Relationships Block directive', function() {
    var $compile, scope, ontologyStateSvc, prefixes, ontologyManagerSvc, ontoUtils, modalSvc;

    beforeEach(function() {
        module('templates');
        module('relationshipsBlock');
        injectShowPropertiesFilter();
        mockOntologyState();
        mockPrefixes();
        mockOntologyUtilsManager();
        mockOntologyManager();
        mockModal();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _prefixes_, _ontologyManagerService_, _ontologyUtilsManagerService_, _modalService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            prefixes = _prefixes_;
            ontologyManagerSvc = _ontologyManagerService_;
            ontoUtils = _ontologyUtilsManagerService_;
            modalSvc = _modalService_;
        });

        scope.relationshipList = [];
        ontologyStateSvc.listItem.ontologyRecord.recordId = 'recordId';
        ontologyStateSvc.listItem.selected = {
            '@id': 'selectedId',
            'prop1': [{'@id': 'value1'}],
            'prop2': [{'@value': 'value2'}]
        };
        ontologyStateSvc.flattenHierarchy.and.returnValue([{prop: 'flat'}]);
        ontologyManagerSvc.isConceptScheme.and.returnValue(false);
        this.element = $compile(angular.element('<relationships-block relationship-list="relationshipList"></relationships-block>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('relationshipsBlock');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        prefixes = null;
        ontologyManagerSvc = null;
        ontoUtils = null;
        modalSvc = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('relationshipList is two way bound', function() {
            this.controller.relationshipList = [{}];
            scope.$digest();
            expect(scope.relationshipList).toEqual([{}]);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('relationships-block')).toBe(true);
            expect(this.element.hasClass('axiom-block')).toBe(true);
        });
        it('with a .section-header', function() {
            expect(this.element.querySelectorAll('.section-header').length).toBe(1);
        });
        it('with a button to add a relationship if the user can modify', function() {
            ontologyStateSvc.canModify.and.returnValue(true);
            scope.$digest();
            expect(this.element.querySelectorAll('.section-header button').length).toBe(1);
        });
        it('with no button to add a relationship if the user cannot modify', function() {
            ontologyStateSvc.canModify.and.returnValue(false);
            scope.$digest();
            expect(this.element.querySelectorAll('.section-header button').length).toBe(0);
        });
        it('depending on how many annotations there are', function() {
            expect(this.element.find('property-values').length).toBe(2);
            ontologyStateSvc.listItem.selected = undefined;
            scope.$digest();
            expect(this.element.find('property-values').length).toBe(0);
        });
        it('with property-values', function() {
            expect(this.element.find('property-values').length).toBe(2);
            ontologyStateSvc.listItem.selected = undefined;
            scope.$apply();
            expect(this.element.find('property-values').length).toBe(0);
        });
        it('depending on whether a concept or concept scheme is selected', function() {
            var header = angular.element(this.element.querySelectorAll('.section-header h5')[0]);
            expect(header.text().trim()).toEqual('Relationships');

            ontologyManagerSvc.isConceptScheme.and.returnValue(true);
            scope.$digest();
            expect(header.text().trim()).toEqual('Top Concepts');
        });
        it('depending on whether the button to add should be disabled', function() {
            ontologyStateSvc.canModify.and.returnValue(true);
            scope.$digest();
            spyOn(this.controller, 'isDisabled').and.returnValue(false);
            scope.$digest();
            var button = angular.element(this.element.querySelectorAll('.section-header button')[0]);
            expect(button.attr('disabled')).toBeFalsy();

            this.controller.isDisabled.and.returnValue(true);
            scope.$digest();
            expect(button.attr('disabled')).toBeTruthy();
        });
    });
    describe('controller methods', function() {
        describe('should handle a click on the plus button if', function() {
            beforeEach(function() {
                spyOn(this.controller, 'showRelationshipOverlay');
                spyOn(this.controller, 'showTopConceptOverlay');
            });
            it('the selected item is a concept scheme', function() {
                ontologyManagerSvc.isConceptScheme.and.returnValue(true);
                this.controller.clickPlus();
                expect(this.controller.showRelationshipOverlay).not.toHaveBeenCalled();
                expect(this.controller.showTopConceptOverlay).toHaveBeenCalled();
            });
            it('the selected item is a concept', function() {
                this.controller.clickPlus();
                expect(this.controller.showRelationshipOverlay).toHaveBeenCalled();
                expect(this.controller.showTopConceptOverlay).not.toHaveBeenCalled();
            });
        });
        describe('should determine whether the button should be disabled if', function() {
            beforeEach(function() {
                spyOn(this.controller, 'hasTopConceptProperty').and.returnValue(true);
            });
            it('the selected item is a concept scheme', function() {
                ontologyManagerSvc.isConceptScheme.and.returnValue(true);
                expect(this.controller.isDisabled()).toEqual(false);
                this.controller.hasTopConceptProperty.and.returnValue(false);
                expect(this.controller.isDisabled()).toEqual(true);
            });
            it('the selected item is a concept', function() {
                expect(this.controller.isDisabled()).toEqual(true);
                this.controller.relationshipList = [{}];
                expect(this.controller.isDisabled()).toEqual(false);
            });
        });
        it('showRelationshipOverlay opens the relationshipOverlay', function() {
            this.controller.showRelationshipOverlay();
            expect(modalSvc.openModal).toHaveBeenCalledWith('relationshipOverlay', {relationshipList: this.controller.relationshipList}, this.controller.updateHierarchy);
        });
        it('openRemoveOverlay sets the correct variables', function() {
            this.controller.openRemoveOverlay('key', 1);
            expect(this.controller.key).toBe('key');
            expect(ontoUtils.getRemovePropOverlayMessage).toHaveBeenCalledWith('key', 1);
            expect(modalSvc.openConfirmModal).toHaveBeenCalledWith('', jasmine.any(Function));
        });
        it('updateHierarchy should call proper methods', function() {
            this.controller.updateHierarchy({relationship: 'test', values: []});
            expect(ontoUtils.updateVocabularyHierarchies).toHaveBeenCalledWith('test', []);
        });
        it('removeFromHierarchy should call the proper methods', function() {
            this.controller.key = 'test';
            this.controller.removeFromHierarchy({});
            expect(ontoUtils.removeFromVocabularyHierarchies).toHaveBeenCalledWith('test', {});
        });
        describe('hasTopConceptProperty should call and return the correct value when getEntityByRecordId is', function() {
            it('present', function() {
                ontologyStateSvc.getEntityByRecordId.and.returnValue({'@id': 'id'});
                expect(this.controller.hasTopConceptProperty()).toBe(true);
                expect(ontologyStateSvc.getEntityByRecordId).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, prefixes.skos + 'hasTopConcept', ontologyStateSvc.listItem);
            });
            it('undefined', function() {
                ontologyStateSvc.getEntityByRecordId.and.returnValue(undefined);
                expect(this.controller.hasTopConceptProperty()).toBe(false);
                expect(ontologyStateSvc.getEntityByRecordId).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, prefixes.skos + 'hasTopConcept', ontologyStateSvc.listItem);
            });
        });
        it('showTopConceptOverlay opens the topConceptOverlay', function() {
            this.controller.showTopConceptOverlay();
            expect(modalSvc.openModal).toHaveBeenCalledWith('topConceptOverlay', {}, this.controller.updateHierarchy);
        });
    });
    it('should call clickPlus when the add button is clicked', function() {
        ontologyStateSvc.canModify.and.returnValue(true);
        scope.$digest();
        spyOn(this.controller, 'clickPlus');
        var button = angular.element(this.element.querySelectorAll('.section-header button')[0]);
        button.triggerHandler('click');
        expect(this.controller.clickPlus).toHaveBeenCalled();
    });
});
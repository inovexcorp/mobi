describe('Datatype Property Block directive', function() {
    var $compile, scope, ontologyStateSvc, ontoUtils, prefixes, modalSvc;

    beforeEach(function() {
        module('templates');
        module('datatypePropertyBlock');
        mockOntologyState();
        mockPrefixes();
        mockOntologyUtilsManager();
        mockModal();
        injectShowPropertiesFilter();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _ontologyUtilsManagerService_, _prefixes_, _modalService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            ontoUtils = _ontologyUtilsManagerService_;
            prefixes = _prefixes_;
            modalSvc = _modalService_;
        });

        ontologyStateSvc.listItem.selected = {
            'prop1': [{'@id': 'value1'}],
            'prop2': [{'@value': 'value2'}]
        };
        this.element = $compile(angular.element('<datatype-property-block></datatype-property-block>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('datatypePropertyBlock');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        ontoUtils = null;
        prefixes = null;
        modalSvc = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('datatype-property-block')).toBe(true);
            expect(this.element.hasClass('annotation-block')).toBe(true);
        });
        it('with a .section-header', function() {
            expect(this.element.querySelectorAll('.section-header').length).toBe(1);
        });
        it('with a link to add a datatype property if the user can modify', function() {
            ontologyStateSvc.canModify.and.returnValue(true);
            scope.$digest();
            expect(this.element.querySelectorAll('.section-header a').length).toBe(1);
        });
        it('with no link to add a datatype property if the user cannot modify', function() {
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
        it('should set the correct manager values when opening the Add Data Property Overlay', function() {
            this.controller.openAddDataPropOverlay();
            expect(ontologyStateSvc.editingProperty).toEqual(false);
            expect(ontologyStateSvc.propertySelect).toBeUndefined();
            expect(ontologyStateSvc.propertyValue).toEqual('');
            expect(ontologyStateSvc.propertyType).toEqual(prefixes.xsd + 'string');
            expect(ontologyStateSvc.propertyIndex).toEqual(0);
            expect(ontologyStateSvc.propertyLanguage).toEqual('en');
            expect(modalSvc.openModal).toHaveBeenCalledWith('datatypePropertyOverlay');
        });
        it('should set the correct manager values when opening the Remove Data Property Overlay', function() {
            this.controller.showRemovePropertyOverlay('key', 1);
            expect(ontoUtils.getRemovePropOverlayMessage).toHaveBeenCalledWith('key', 1);
            expect(modalSvc.openConfirmModal).toHaveBeenCalledWith('', jasmine.any(Function));
        });
        describe('should set the correct manager values when editing a data property', function() {
            beforeEach(function() {
                this.propertyIRI = 'prop1';
                this.value = {'@value': 'value'};
                ontologyStateSvc.listItem.selected = {[this.propertyIRI]: [this.value]};
            });
            it('when @language is present', function() {
                this.value['@language'] = 'lang';
                this.controller.editDataProp(this.propertyIRI, 0);
                expect(ontologyStateSvc.editingProperty).toBe(true);
                expect(ontologyStateSvc.propertySelect).toEqual(this.propertyIRI);
                expect(ontologyStateSvc.propertyValue).toBe('value');
                expect(ontologyStateSvc.propertyIndex).toBe(0);
                expect(ontologyStateSvc.propertyType).toEqual(prefixes.rdf + 'langString');
                expect(ontologyStateSvc.propertyLanguage).toBe('lang');
                expect(modalSvc.openModal).toHaveBeenCalledWith('datatypePropertyOverlay');
            });
            it('when @language is missing', function() {
                this.value['@type'] = 'type';
                this.controller.editDataProp(this.propertyIRI, 0);
                expect(ontologyStateSvc.editingProperty).toBe(true);
                expect(ontologyStateSvc.propertySelect).toEqual(this.propertyIRI);
                expect(ontologyStateSvc.propertyValue).toBe('value');
                expect(ontologyStateSvc.propertyIndex).toBe(0);
                expect(ontologyStateSvc.propertyType).toEqual('type');
                expect(ontologyStateSvc.propertyLanguage).toBeUndefined();
                expect(modalSvc.openModal).toHaveBeenCalledWith('datatypePropertyOverlay');
            });
        });
    });
    it('should call openAddDataPropOverlay when the link is clicked', function() {
        ontologyStateSvc.canModify.and.returnValue(true);
        scope.$digest();
        spyOn(this.controller, 'openAddDataPropOverlay');
        var link = angular.element(this.element.querySelectorAll('.section-header a')[0]);
        link.triggerHandler('click');
        expect(this.controller.openAddDataPropOverlay).toHaveBeenCalled();
    });
});
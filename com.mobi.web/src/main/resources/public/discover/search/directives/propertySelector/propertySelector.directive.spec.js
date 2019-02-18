describe('Property Selector directive', function() {
    var $compile, scope, utilSvc, ontologyManagerSvc, discoverStateSvc, searchSvc, prefixes;

    beforeEach(function() {
        module('templates');
        module('propertySelector');
        mockDiscoverState();
        mockUtil();
        mockSearch();
        mockPrefixes();
        mockOntologyManager();

        inject(function(_$compile_, _$rootScope_, _utilService_, _ontologyManagerService_, _discoverStateService_, _searchService_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            utilSvc = _utilService_;
            ontologyManagerSvc = _ontologyManagerService_;
            discoverStateSvc = _discoverStateService_;
            searchSvc = _searchService_;
            prefixes = _prefixes_;
        });

        ontologyManagerSvc.getEntityName.and.callFake(function(entity) {
            return entity['@id'];
        });
        discoverStateSvc.search.properties = {key: [{}]};

        scope.keys = ['key'];
        scope.property = {'@id': 'id'};
        scope.range = 'range';
        scope.rangeChangeEvent = jasmine.createSpy('rangeChangeEvent');
        this.element = $compile(angular.element('<property-selector keys="keys" property="property" range="range" range-change-event="rangeChangeEvent()"></property-selector>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('propertySelector');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        utilSvc = null;
        ontologyManagerSvc = null;
        discoverStateSvc = null;
        searchSvc = null;
        prefixes = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('keys should be two way bound', function() {
            this.controller.keys = ['new-key'];
            scope.$apply();
            expect(scope.keys).toEqual(['new-key']);
        });
        it('property should be two way bound', function() {
            this.controller.property = {'@id': 'new-id'};
            scope.$apply();
            expect(scope.property).toEqual({'@id': 'new-id'});
        });
        it('range should be two way bound', function() {
            this.controller.range = 'new-range';
            scope.$apply();
            expect(scope.range).toEqual('new-range');
        });
        it('rangeChangeEvent should be called in the parent scope', function() {
            this.controller.rangeChangeEvent();
            expect(scope.rangeChangeEvent).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('property-selector')).toBe(true);
        });
        describe('with no controller.property', function() {
            beforeEach(function() {
                this.controller.property = undefined;
                this.controller.propertySearch = 'id';
                discoverStateSvc.search.properties = {
                    key: [{'@id': 'id'}]
                };
                discoverStateSvc.search.noDomains = [{'@id': 'id'}];
                scope.$apply();
            });
            it('with a .form-group', function() {
                expect(this.element.querySelectorAll('.form-group').length).toBe(1);
            });
            it('with a custom-label', function() {
                expect(this.element.find('custom-label').length).toBe(1);
            });
            it('with a md-select', function() {
                expect(this.element.find('md-select').length).toBe(1);
            });
            it('with a md-select-header', function() {
                expect(this.element.find('md-select-header').length).toBe(1);
            });
            it('with a input', function() {
                expect(this.element.find('input').length).toBe(1);
            });
            it('with md-optgroups', function() {
                expect(this.element.find('md-optgroup').length).toBe(2);
            });
            it('with md-options', function() {
                expect(this.element.find('md-optgroup').length).toBe(2);
            });
        });
        describe('with a controller.property and one controller.ranges', function() {
            it('with a .form-group', function() {
                this.controller.ranges = ['range'];
                scope.$apply();
                expect(this.element.querySelectorAll('.form-group').length).toBe(0);
            });
        });
        describe('with a controller.property and two controller.ranges', function() {
            beforeEach(function() {
                this.controller.ranges = ['range', 'range2'];
                scope.$apply();
            });
            it('with a .form-group', function() {
                expect(this.element.querySelectorAll('.form-group').length).toBe(1);
            });
            it('with a custom-label', function() {
                expect(this.element.find('custom-label').length).toBe(1);
            });
            it('with a md-select', function() {
                expect(this.element.find('md-select').length).toBe(1);
            });
            it('with a md-select-header', function() {
                expect(this.element.find('md-select-header').length).toBe(1);
            });
            it('with a input', function() {
                expect(this.element.find('input').length).toBe(1);
            });
            it('with md-options', function() {
                expect(this.element.find('md-option').length).toBe(2);
            });
        });
    });
    describe('controller methods', function() {
        it('getSelectedPropertyText should return the correct value', function() {
            ontologyManagerSvc.getEntityName.and.returnValue('name');
            expect(this.controller.getSelectedPropertyText()).toEqual('name');
            expect(ontologyManagerSvc.getEntityName).toHaveBeenCalledWith({'@id': 'id'});

            this.controller.property = undefined;
            expect(this.controller.getSelectedPropertyText()).toEqual('');
        });
        it('getSelectedRangeText should return the correct value', function() {
            utilSvc.getBeautifulIRI.and.returnValue('iri');
            expect(this.controller.getSelectedRangeText()).toEqual('iri');
            expect(utilSvc.getBeautifulIRI).toHaveBeenCalledWith('range');

            this.controller.range = undefined;
            expect(this.controller.getSelectedRangeText()).toEqual('');
        });
        it('orderRange should call the correct function', function() {
            utilSvc.getBeautifulIRI.and.returnValue('iri');
            expect(this.controller.orderRange({'@id': 'id'})).toBe('iri');
            expect(utilSvc.getBeautifulIRI).toHaveBeenCalledWith('id');
        });
        describe('shouldDisplayOptGroup should return the correct value with', function() {
            beforeEach(function() {
                discoverStateSvc.search.properties = {
                    type: ['type'],
                    iri: [''],
                    other: ['']
                };
            });
            it('no queryConfig types', function() {
                expect(this.controller.shouldDisplayOptGroup('type')).toBe(true);
                expect(ontologyManagerSvc.getEntityName).toHaveBeenCalledWith('type');
            });
            it('nothing left after filter', function() {
                this.controller.propertySearch = 'word';
                expect(this.controller.shouldDisplayOptGroup('type')).toBe(false);
                expect(ontologyManagerSvc.getEntityName).toHaveBeenCalledWith('type');
            });
        });
        describe('propertyChanged should set variables correctly when ranges is equal to', function() {
            it('one', function() {
                this.controller.propertyChanged();
                expect(this.controller.ranges).toEqual([{'@id': prefixes.xsd + 'string'}]);
                expect(this.controller.range).toEqual(prefixes.xsd + 'string');
            });
            it('more than one', function() {
                this.controller.property[prefixes.rdfs + 'range'] = [{'@id': 'range1'}, {'@id': 'range2'}];
                this.controller.range = undefined;
                this.controller.propertyChanged();
                expect(this.controller.ranges).toEqual([{'@id': 'range1'}, {'@id': 'range2'}]);
                expect(this.controller.range).toBeUndefined();
            });
        });
        describe('showNoDomains should return the proper value for showing no domains group when', function() {
            it('noDomains is empty', function() {
                discoverStateSvc.search.noDomains = [];
                expect(this.controller.showNoDomains()).toBeFalsy();
                expect(ontologyManagerSvc.getEntityName).not.toHaveBeenCalled();
            });
            it('nothing left after filter', function() {
                discoverStateSvc.search.noDomains = [{'@id': 'domain'}];
                this.controller.propertySearch = 'word';
                expect(this.controller.showNoDomains()).toBeFalsy();
                expect(ontologyManagerSvc.getEntityName).toHaveBeenCalledWith({'@id': 'domain'});
            });
            it('something left after filter', function() {
                discoverStateSvc.search.noDomains = [{'@id': 'domain'}];
                this.controller.propertySearch = 'domain';
                expect(this.controller.showNoDomains()).toBeTruthy();
                expect(ontologyManagerSvc.getEntityName).toHaveBeenCalledWith({'@id': 'domain'});
            });
            it('propertySearch is empty', function() {
                discoverStateSvc.search.noDomains = [{'@id': 'domain'}];
                expect(this.controller.showNoDomains()).toBeTruthy();
                expect(ontologyManagerSvc.getEntityName).toHaveBeenCalledWith({'@id': 'domain'});
            });
        });
        describe('checkEntityText should', function() {
            beforeEach(function() {
                this.controller.propertySearch = 'te';
            });
            it('true when it includes propertySearch text', function() {
                expect(this.controller.checkEntityText({'@id': 'text'})).toBe(true);
            });
            it('false when it does not include propertySearch text', function() {
                expect(this.controller.checkEntityText({'@id': 'other'})).toBe(false);
            });
        });
    });
});

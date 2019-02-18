describe('Prop Preview directive', function() {
    var $compile, scope, ontologyManagerSvc, mapperStateSvc, utilSvc, prefixes, splitIRI;

    beforeEach(function() {
        module('templates');
        module('propPreview');
        injectSplitIRIFilter();
        mockOntologyManager();
        mockMapperState();
        mockUtil();
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _ontologyManagerService_, _mapperStateService_, _utilService_, _prefixes_, _splitIRIFilter_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyManagerSvc = _ontologyManagerService_;
            mapperStateSvc = _mapperStateService_;
            utilSvc = _utilService_;
            prefixes = _prefixes_;
            splitIRI = _splitIRIFilter_;
        });

        scope.propObj = {};
        scope.ontologies = [];
        this.element = $compile(angular.element('<prop-preview prop-obj="propObj" ontologies="ontologies"></prop-preview>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('propPreview');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyManagerSvc = null;
        mapperStateSvc = null;
        utilSvc = null;
        prefixes = null;
        splitIRI = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('propObj should be one way bound', function() {
            this.controller.propObj = {'@id': ''};
            scope.$digest();
            expect(scope.propObj).toEqual({});
        });
        it('ontologies should be one way bound', function() {
            this.controller.ontologies = [{}];
            scope.$digest();
            expect(scope.ontologies).toEqual([]);
        });
    });
    describe('controller methods', function() {
        describe('should get the name of the range of the property', function() {
            beforeEach(function() {
                utilSvc.getPropertyId.calls.reset();
                ontologyManagerSvc.getEntityName.calls.reset();
                splitIRI.calls.reset();
            });
            it('if it is a object property', function() {
                ontologyManagerSvc.isObjectProperty.and.returnValue(true);
                expect(_.isString(this.controller.getPropRangeName())).toBe(true);
                expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(scope.propObj);
                expect(ontologyManagerSvc.getEntityName).toHaveBeenCalledWith(this.controller.rangeClass);
                expect(utilSvc.getPropertyId).not.toHaveBeenCalled();
                expect(splitIRI).not.toHaveBeenCalled();
            });
            describe('if it is a data property', function() {
                beforeEach(function() {
                    ontologyManagerSvc.isObjectProperty.and.returnValue(false);
                });
                it('and it has a range', function() {
                    splitIRI.and.returnValue({end: 'double'});
                    expect(this.controller.getPropRangeName()).toBe('double');
                    expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(scope.propObj);
                    expect(ontologyManagerSvc.getEntityName).not.toHaveBeenCalled();
                    expect(utilSvc.getPropertyId).toHaveBeenCalledWith(scope.propObj, prefixes.rdfs + 'range');
                    expect(splitIRI).toHaveBeenCalledWith(jasmine.any(String));
                });
                it('and it does not have a range', function() {
                    expect(this.controller.getPropRangeName()).toBe('string');
                    expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(scope.propObj);
                    expect(ontologyManagerSvc.getEntityName).not.toHaveBeenCalled();
                    expect(utilSvc.getPropertyId).toHaveBeenCalledWith(scope.propObj, prefixes.rdfs + 'range');
                    expect(splitIRI).toHaveBeenCalledWith(jasmine.any(String));
                });
            });
        });
    });
    describe('should set the range class when the propObj changes', function() {
        beforeEach(function() {
            scope.propObj = {'@id': 'prop'};
        })
        it('unless it is a data property', function() {
            ontologyManagerSvc.isObjectProperty.and.returnValue(false);
            scope.$digest();
            expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(scope.propObj);
            expect(this.controller.rangeClass).toBeUndefined();
        });
        describe('if it is a object property', function() {
            beforeEach(function() {
                ontologyManagerSvc.isObjectProperty.and.returnValue(true);
                utilSvc.getPropertyId.and.returnValue('class');
                this.classObj = {'@id': 'class'};
            });
            it('unless the range class is the same', function() {
                this.controller.rangeClass = this.classObj;
                scope.$digest();
                expect(this.controller.rangeClass).toEqual(this.classObj);
            });
            it('and the range class changed', function() {
                mapperStateSvc.availableClasses = [{classObj: this.classObj}];
                scope.$digest();
                expect(this.controller.rangeClass).toEqual(this.classObj);
            });
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('prop-preview')).toBe(true);
        });
        it('depending on whether the property has a description', function() {
            var description = angular.element(this.element.querySelectorAll('.description')[0]);
            expect(description.text()).toContain('(None Specified)');

            ontologyManagerSvc.getEntityDescription.and.returnValue('Test');
            scope.$digest();
            expect(description.text()).not.toContain('(None Specified)');
        });
        it('depending on whether the range class is deprecated', function() {
            expect(this.element.querySelectorAll('.deprecated').length).toEqual(0);

            ontologyManagerSvc.isDeprecated.and.returnValue(true);
            scope.$digest();
            expect(this.element.querySelectorAll('.deprecated').length).toEqual(1);
        });
    });
});
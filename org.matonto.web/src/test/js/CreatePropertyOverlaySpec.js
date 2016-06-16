describe('Create Property Overlay directive', function() {
    var $compile,
        scope,
        element;

    mockPrefixes();
    injectRegexConstant();
    injectCamelCaseFilter();

    beforeEach(function() {
        module('templates');
        module('createPropertyOverlay');
        mockOntologyManager();

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    beforeEach(function() {
        scope.onCreate = jasmine.createSpy('onCreate');
        scope.onCancel = jasmine.createSpy('onCancel');
        scope.createPropertyError = 'test';
        scope.ontologyId = 'test';
        scope.showIriOverlay = false;
        scope.iriBegin = 'begin';
        scope.iriThen = 'then';
        scope.propertyTypes = ['type1'];
        scope.subClasses = ['subClass1'];
        scope.propertyRange = ['range1'];
        scope.matonto = {};

        element = $compile(angular.element('<create-property-overlay matonto="matonto" ontology-id="ontologyId" on-create="onCreate()" on-cancel="onCancel()" create-property-error="createPropertyError" show-iri-overlay="showIriOverlay" iri-begin="iriBegin" iri-then="iriThen" property-types="propertyTypes" sub-classes="subClasses" property-range="propertyRange"></create-property-overlay>'))(scope);
        scope.$digest();
    });

    describe('in isolated scope', function() {
        var isolatedScope;

        beforeEach(function() {
            isolatedScope = element.isolateScope();
        });
        it('createPropertyError should be two way bound', function() {
            isolatedScope.createPropertyError = 'new';
            scope.$digest();
            expect(scope.createPropertyError).toEqual('new');
        });
        it('showIriOverlay should be two way bound', function() {
            isolatedScope.showIriOverlay = true;
            scope.$digest();
            expect(scope.showIriOverlay).toEqual(true);
        });
        it('matonto should be two way bound', function() {
            isolatedScope.matonto = {prop: 'new'};
            scope.$digest();
            expect(scope.matonto).toEqual({prop: 'new'});
        });
        it('onCreate should be called in parent scope', function() {
            isolatedScope.onCreate();
            expect(scope.onCreate).toHaveBeenCalled();
        });
        it('onCancel should be called in parent scope', function() {
            isolatedScope.onCancel();
            expect(scope.onCancel).toHaveBeenCalled();
        });
        it('ontologyId should be one way bound', function() {
            isolatedScope.ontologyId = 'new';
            expect(scope.ontologyId).toEqual('test');
        });
    });
    describe('controller bound variables', function() {
        var controller;

        beforeEach(function() {
            controller = element.controller('createPropertyOverlay');
        });
        it('iriBegin should be two way bound', function() {
            controller.iriBegin = 'new';
            scope.$digest();
            expect(scope.iriBegin).toBe('new');
        });
        it('iriThen should be two way bound', function() {
            controller.iriThen = 'new';
            scope.$digest();
            expect(scope.iriThen).toBe('new');
        });
        it('propertyTypes should be two way bound', function() {
            controller.propertyTypes = [];
            scope.$digest();
            expect(scope.propertyTypes).toEqual([]);
        });
        it('subClasses should be two way bound', function() {
            controller.subClasses = [];
            scope.$digest();
            expect(scope.subClasses).toEqual([]);
        });
        it('propertyRange should be two way bound', function() {
            controller.propertyRange = [];
            scope.$digest();
            expect(scope.propertyRange).toEqual([]);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for a DIV', function() {
            expect(element.prop('tagName')).toBe('DIV');
        });
        it('based on overlay class', function() {
            expect(element.hasClass('overlay')).toBe(true);
        });
        it('based on content class', function() {
            var contents = element.querySelectorAll('.content');
            expect(contents.length).toBe(1);
        });
        it('based on form', function() {
            var forms = element.querySelectorAll('form');
            expect(forms.length).toBe(1);
        });
        it('based on btn-container class', function() {
            var containers = element.querySelectorAll('.btn-container');
            expect(containers.length).toBe(1);
        });
    });
    describe('controller methods', function() {
        var controller;

        beforeEach(function() {
            controller = element.controller('createPropertyOverlay');
        });
        describe('nameChanged', function() {
            beforeEach(function() {
                controller.name = 'name';
            });
            it('changes iri if iriHasChanged is false', function() {
                controller.iriHasChanged = false;
                controller.nameChanged();
                expect(controller.iri).toEqual(controller.iriBegin + controller.iriThen + controller.name);
            });
            it('does not change iri if iriHasChanged is true', function() {
                controller.iriHasChanged = true;
                controller.iri = 'iri';
                controller.nameChanged();
                expect(controller.iri).toEqual('iri');
            });
        });
        it('onEdit changes iri based on the params', function() {
            controller.onEdit('begin', 'then', 'end');
            expect(controller.iri).toBe('begin' + 'then' + 'end');
        });
        describe('setRange', function() {
            it('changes rangeList to subClasses when type is ObjectProperty', function() {
                controller.type = ['ObjectProperty'];
                controller.setRange();
                expect(controller.rangeList.indexOf('subClass1') !== -1).toBe(true);
            });
            it('changes rangeList to propertyRange when type is not ObjectProperty', function() {
                controller.type = ['DatatypeProperty'];
                controller.setRange();
                expect(controller.rangeList.indexOf('range1') !== -1).toBe(true);
            });
        });
    });
});

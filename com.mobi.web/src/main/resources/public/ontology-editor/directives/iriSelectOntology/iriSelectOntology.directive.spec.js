describe('IRI Select Ontology directive', function() {
    var $compile, scope, ontologyStateSvc, ontoUtilsSvc;

    beforeEach(function() {
        module('templates');
        module('iriSelectOntology');
        mockOntologyState();
        mockOntologyUtilsManager();
        injectTrustedFilter();
        injectHighlightFilter();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _ontologyUtilsManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            ontoUtilsSvc = _ontologyUtilsManagerService_;
        });

        scope.displayText = 'test';
        scope.selectList = {};
        scope.mutedText = 'test';
        scope.isDisabledWhen = false;
        scope.isRequiredWhen = false;
        scope.multiSelect = false;
        scope.onChange = jasmine.createSpy('onChange');
        scope.bindModel = undefined;

        this.element = $compile(angular.element('<iri-select-ontology multi-select="multiSelect" on-change="onChange()" display-text="displayText" select-list="selectList" muted-text="mutedText" ng-model="bindModel" is-disabled-when="isDisabledWhen" multi-select="multiSelect"></iri-select-ontology>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('iriSelectOntology');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        ontoUtilsSvc = null;
        this.element.remove();
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            this.isolatedScope = this.element.isolateScope();
        });
        it('displayText should be one way bound', function() {
            this.isolatedScope.displayText = 'new';
            scope.$digest();
            expect(scope.displayText).toEqual('test');
        });
        it('isDisabledWhen should be one way bound', function() {
            this.isolatedScope.isDisabledWhen = true;
            scope.$digest();
            expect(scope.isDisabledWhen).toEqual(false);
        });
        it('isRequiredWhen should be one way bound', function() {
            this.isolatedScope.isRequiredWhen = true;
            scope.$digest();
            expect(scope.isRequiredWhen).toEqual(false);
        });
        it('multiSelect should be one way bound', function() {
            this.isolatedScope.multiSelect = true;
            scope.$digest();
            expect(scope.multiSelect).toEqual(false);
        });
        it('mutedText should be one way bound', function() {
            this.isolatedScope.mutedText = 'new';
            scope.$digest();
            expect(scope.mutedText).toEqual('test');
        });
        it('onChange should be called in parent scope', function() {
            this.isolatedScope.onChange();
            expect(scope.onChange).toHaveBeenCalled();
        });
    });
    describe('controller bound variable', function() {
        it('bindModel should be two way bound', function() {
            this.controller.bindModel = 'new';
            scope.$digest();
            expect(scope.bindModel).toEqual('new');
        });
        it('selectList should be one way bound', function() {
            this.controller.selectList = {test: 'ontology'};
            scope.$digest();
            expect(scope.selectList).toEqual({});
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('iri-select-ontology')).toBe(true);
            expect(this.element.hasClass('form-group')).toBe(true);
        });
        it('with custom-labels', function() {
            expect(this.element.querySelectorAll('custom-label').length).toBe(1);
        });
        it('depending on whether it is a multi select', function() {
            var selects = this.element.querySelectorAll('ui-select');
            expect(selects.length).toBe(1);
            expect(angular.element(selects[0]).attr('multiple')).toBeUndefined();

            scope.multiSelect = true;
            scope.$digest();
            selects = this.element.querySelectorAll('ui-select');
            expect(selects.length).toBe(1);
            expect(angular.element(selects[0]).attr('multiple')).toBeDefined();
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            ontologyStateSvc.listItem.ontologyId = 'ontologyId';
            this.controller.selectList = {iri: 'new'};
        });
        describe('getOntologyIri', function() {
            it('should return ontologyId if nothing is passed in', function() {
                expect(this.controller.getOntologyIri()).toEqual('ontologyId');
            });
            it('should return the set ontology IRI from the selectList if provided', function() {
                expect(this.controller.getOntologyIri('iri')).toEqual('new');
            });
            it('should return ontologyId if iri is not set on selectList', function() {
                expect(this.controller.getOntologyIri('test')).toEqual('ontologyId');
            });
        });
        it('getValues should set the correct value', function() {
            scope.selectList = {iri: 'new'};
            ontoUtilsSvc.getSelectList.and.returnValue(['item']);
            this.controller.getValues('text');
            expect(ontoUtilsSvc.getSelectList).toHaveBeenCalledWith(['iri'], 'text', ontoUtilsSvc.getDropDownText);
            expect(this.controller.values).toEqual(['item']);
        });
    });
});
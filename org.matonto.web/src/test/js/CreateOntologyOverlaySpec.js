describe('Create Ontology Overlay directive', function() {
    var $compile,
        scope,
        element;

    mockPrefixes();
    injectRegexConstant();
    injectCamelCaseFilter();

    beforeEach(function() {
        module('createOntologyOverlay');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    injectDirectiveTemplate('modules/ontology-editor/directives/createOntologyOverlay/createOntologyOverlay.html');

    beforeEach(function() {
        scope.onCreate = jasmine.createSpy('onCreate');
        scope.onCancel = jasmine.createSpy('onCancel');
        scope.createOntologyError = 'test';

        element = $compile(angular.element('<create-ontology-overlay on-create="onCreate()" on-cancel="onCancel()" create-ontology-error="createOntologyError"></create-ontology-overlay>'))(scope);
        scope.$digest();
    });

    describe('in isolated scope', function() {
        var isolatedScope;

        beforeEach(function() {
            isolatedScope = element.isolateScope();
        });
        it('createOntologyError should be two way bound', function() {
            isolatedScope.createOntologyError = 'new';
            scope.$digest();
            expect(scope.createOntologyError).toEqual('new');
        });
        it('onCreate should be called in parent scope', function() {
            isolatedScope.onCreate();
            expect(scope.onCreate).toHaveBeenCalled();
        });
        it('onCancel should be called in parent scope', function() {
            isolatedScope.onCancel();
            expect(scope.onCancel).toHaveBeenCalled();
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
            controller = element.controller('createOntologyOverlay');
        });
        describe('nameChanged',function() {
            beforeEach(function() {
                controller.name = 'Name';
            });
            it('changes iri if iriHasChanged is false', function() {
                controller.iriHasChanged = false;
                var date = new Date();
                var prefix = 'https://matonto.org/ontologies/' + (date.getMonth() + 1) + '/' + date.getFullYear() + '/';
                controller.nameChanged();
                expect(controller.iri).toEqual(prefix + controller.name);
            });
            it('does not change iri if iriHasChanged is true', function() {
                controller.iriHasChanged = true;
                controller.iri = 'iri';
                controller.nameChanged();
                expect(controller.iri).toEqual('iri');
            });
        });
    });
});

describe('RDF Preview directive', function() {
    var $compile,
        scope,
        jsonFilter = jasmine.createSpy('jsonFilter');

    beforeEach(function() {
        module('templates');
        module('rdfPreview');

        module(function($provide) {
            $provide.value('jsonFilter', jsonFilter);
        });

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.preview = '';
            scope.createPreview = jasmine.createSpy('createPreview');

            this.element = $compile(angular.element('<rdf-preview preview="preview" create-preview="createPreview(format)"></rdf-preview>'))(scope);
            scope.$digest();
        });

        it('preview should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.preview = 'test';
            scope.$digest();
            expect(scope.preview).toEqual('test');
        });
        it('createPreview should be called in the parent scope', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.createPreview();

            expect(scope.createPreview).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            scope.preview = '';
            scope.createPreview = jasmine.createSpy('createPreview');

            this.element = $compile(angular.element('<rdf-preview preview="preview" create-preview="createPreview(format)"></rdf-preview>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('rdf-preview')).toBe(true);
            expect(this.element.hasClass('slide')).toBe(true);
        });
        it('with the correct classes depending on whether it is visible', function() {
            var toggleIcon = angular.element(this.element.querySelectorAll('.toggle-btn i')[0]);
            expect(this.element.hasClass('out')).toBe(true);
            expect(this.element.hasClass('in')).toBe(false);
            expect(toggleIcon.hasClass('fa-chevron-right')).toBe(true);
            expect(toggleIcon.hasClass('fa-chevron-left')).toBe(false);

            var controller = this.element.controller('rdfPreview');
            controller.visible = false;
            scope.$digest();
            expect(this.element.hasClass('out')).toBe(false);
            expect(this.element.hasClass('in')).toBe(true);
            expect(toggleIcon.hasClass('fa-chevron-right')).toBe(false);
            expect(toggleIcon.hasClass('fa-chevron-left')).toBe(true);
        });
        it('with the correctly formatted preview', function() {
            expect(jsonFilter).not.toHaveBeenCalled();
            scope.preview = {};
            scope.$digest();
            expect(jsonFilter).toHaveBeenCalledWith({}, 4);
        });
    });
    it('should set the visibility when the toggle button is clicked', function() {
        var element = $compile(angular.element('<rdf-preview preview="preview" create-preview="createPreview(format)"></rdf-preview>'))(scope);
        scope.$digest();
        var controller = element.controller('rdfPreview');
        expect(controller.visible).toBe(true);
        angular.element(element.querySelectorAll('.toggle-btn')).triggerHandler('click');
        expect(controller.visible).toBe(false);
    });
    it('should call createPreview when the Refresh button is clicked', function() {
        scope.createPreview = jasmine.createSpy('createPreview');
        var element = $compile(angular.element('<rdf-preview preview="preview" create-preview="createPreview(format)"></rdf-preview>'))(scope);
        scope.$digest();
        angular.element(element.querySelectorAll('.controls button')).triggerHandler('click');
        expect(scope.createPreview).toHaveBeenCalled();
    });
});
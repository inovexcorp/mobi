describe('Ontology Upload Overlay directive', function() {
    var $compile,
        scope,
        element;

    beforeEach(function() {
        module('ontologyUploadOverlay');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

    });

    injectDirectiveTemplate('modules/ontology-editor/directives/ontologyUploadOverlay/ontologyUploadOverlay.html');

    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            element = $compile(angular.element('<ontology-upload-overlay></ontology-upload-overlay>'))(scope);
            scope.$digest();
        });
        it('for a DIV', function() {
            expect(element.prop('tagName')).toBe('DIV');
        });
        _.forEach(['.content', 'h6', '.form-group', '.btn-container'], function(item) {
            it('based on ' + item, function() {
                var items = element.querySelectorAll(item);
                expect(items.length).toBe(1);
            });
        });
        describe('error-display', function() {
            beforeEach(function() {
                element = $compile(angular.element('<ontology-upload-overlay></ontology-upload-overlay>'))(scope);
            });
            it('is visible when uploadError is true', function() {
                scope.vm = {
                    uploadError: true
                }
                scope.$digest();
                var errors = element.querySelectorAll('error-display');
                expect(errors.length).toBe(1);
            });
            it('is not visible when uploadError is false', function() {
                scope.vm = {
                    uploadError: false
                }
                scope.$digest();
                var errors = element.querySelectorAll('error-display');
                expect(errors.length).toBe(0);
            });
        });
    });
});
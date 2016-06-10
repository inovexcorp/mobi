describe('Ontology Open Overlay directive', function() {
    var $compile,
        scope,
        element;

    injectBeautifyFilter();
    injectSplitIRIFilter();
    injectTrustedFilter();
    injectHighlightFilter();

    beforeEach(function() {
        module('ontologyOpenOverlay');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

    });

    injectDirectiveTemplate('modules/ontology-editor/directives/ontologyOpenOverlay/ontologyOpenOverlay.html');

    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            element = $compile(angular.element('<ontology-open-overlay></ontology-open-overlay>'))(scope);
            scope.$digest();
        });
        it('for a DIV', function() {
            expect(element.prop('tagName')).toBe('DIV');
        });
        it('based on .content', function() {
            var items = element.querySelectorAll('.content');
            expect(items.length).toBe(1);
        });
        it('based on h6', function() {
            var items = element.querySelectorAll('h6');
            expect(items.length).toBe(1);
        });
        it('based on .form-group', function() {
            var items = element.querySelectorAll('.form-group');
            expect(items.length).toBe(1);
        });
        it('based on .btn-container', function() {
            var items = element.querySelectorAll('.btn-container');
            expect(items.length).toBe(1);
        });
        describe('and error-display', function() {
            it('is visible when openError is true', function() {
                scope.vm = {
                    openError: true
                }
                scope.$digest();
                var errors = element.querySelectorAll('error-display');
                expect(errors.length).toBe(1);
            });
            it('is not visible when openError is false', function() {
                scope.vm = {
                    openError: false
                }
                scope.$digest();
                var errors = element.querySelectorAll('error-display');
                expect(errors.length).toBe(0);
            });
        });
    });
});
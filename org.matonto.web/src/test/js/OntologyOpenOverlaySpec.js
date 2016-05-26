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
        _.forEach(['.content', 'h6', '.form-group', '.btn-container'], function(item) {
            it('based on ' + item, function() {
                var items = element.querySelectorAll(item);
                expect(items.length).toBe(1);
            });
        });
    });
});
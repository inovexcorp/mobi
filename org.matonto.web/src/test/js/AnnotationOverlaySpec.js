describe('Annotation Overlay directive', function() {
    var $compile,
        scope;

    beforeEach(function() {
        module('annotationOverlay');

        module(function($provide) {
            $provide.value('highlightFilter', jasmine.createSpy('highlightFilter'));
            $provide.value('trustedFilter', jasmine.createSpy('trustedFilter'));
        });

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    injectDirectiveTemplate('modules/ontology-editor/directives/annotationOverlay/annotationOverlay.html');

    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            element = $compile(angular.element('<annotation-overlay></annotation-overlay>'))(scope);
            scope.$digest();
        });
        it('for an ANNOTATION-OVERLAY', function() {
            expect(element.prop('tagName')).toBe('ANNOTATION-OVERLAY');
        });
        it('based on form (.content)', function() {
            scope.btnIcon = 'fa-square';
            var element = $compile(angular.element('<annotation-overlay></annotation-overlay>'))(scope);
            scope.$digest();

            var formList = element.querySelectorAll('.content');
            expect(formList.length).toBe(1);
        });
    });
});
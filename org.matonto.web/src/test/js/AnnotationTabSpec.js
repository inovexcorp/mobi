describe('Annotation Tab directive', function() {
    var $compile,
        scope,
        element;

    beforeEach(function() {
        module('annotationTab');

        module(function($provide) {
            $provide.value('showAnnotations', jasmine.createSpy('showAnnotations').and.callFake(function(obj, arr) {
                return _.map(obj, function() {
                    return {
                        localName:}
                });
            }));
        });

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    injectDirectiveTemplate('modules/ontology-editor/directives/annotationTab/annotationTab.html');

    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            element = $compile(angular.element('<annotation-tab></annotation-tab>'))(scope);
            scope.$digest();
        });
        it('for a ANNOTATION-TAB', function() {
            expect(element.prop('tagName')).toBe('ANNOTATION-TAB');
        });
        it('based on annotation button', function() {
            var button = element.querySelectorAll('.btn-annotation');
            expect(button.length).toBe(1);
            var icon = element.querySelectorAll('.fa-plus');
            expect(icon.length).toBe(1);
        });
        it('based on listed annotations', function() {
            var formList = element.querySelectorAll('.annotation');
            expect(formList.length).toBe(1);
        });
    });
});
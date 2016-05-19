describe('Annotation Overlay directive', function() {
    var $compile,
        scope,
        element;

    injectRegexConstant();
    beforeEach(function() {
        module('annotationOverlay');

        module(function($provide) {
            $provide.value('highlightFilter', jasmine.createSpy('highlightFilter'));
            $provide.value('trustedFilter', jasmine.createSpy('trustedFilter'));
        });

        // To test out a directive, you need to inject $compile and $rootScope
        // and save them to use
        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    // Shared setup function for loading the directive's template into the
    // $templateCache
    injectDirectiveTemplate('modules/ontology-editor/directives/annotationOverlay/annotationOverlay.html');

    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            element = $compile(angular.element('<annotation-overlay></annotation-overlay>'))(scope);
            scope.$digest();
        });
        it('for a div', function() {
            expect(element.prop('tagName')).toBe('DIV');
        });
        it('based on form (.content)', function() {
            var formList = element.querySelectorAll('.content');
            expect(formList.length).toBe(1);
        });
        it('has correct heading based on variable', function() {
            var tests = [
                {
                    value: true,
                    result: 'Edit Annotation'
                },
                {
                    value: false,
                    result: 'Add Annotation'
                }
            ];
            _.forEach(tests, function(test) {
                scope.vm = {
                    editingAnnotation: test.value
                }
                scope.$digest();
                var header = element.querySelectorAll('h6');
                expect(header.length).toBe(1);
                expect(header[0].innerHTML).toBe(test.result);
            });
        });
        it('has correct button based on variable', function() {
            var tests = [
                {
                    value: true,
                    result: 'Edit'
                },
                {
                    value: false,
                    result: 'Add'
                }
            ];
            _.forEach(tests, function(test) {
                scope.vm = {
                    editingAnnotation: test.value
                }
                scope.$digest();
                var buttons = element.querySelectorAll('custom-button:not([type])');
                expect(buttons.length).toBe(1);
                expect(buttons[0].innerHTML).toBe(test.result);
            });
        });
    });
});
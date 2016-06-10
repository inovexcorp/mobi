describe('Class Editor directive', function() {
    var $compile,
        scope,
        element;

    beforeEach(function() {
        module('classEditor');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });
    injectDirectiveTemplate('modules/ontology-editor/directives/classEditor/classEditor.html');

    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            element = $compile(angular.element('<class-editor></class-editor>'))(scope);
            scope.$digest();
        });
        it('for a form', function() {
            expect(element.prop('tagName')).toBe('FORM');
        });
        it('based on tab button container', function() {
            var tabContainer = element.querySelectorAll('tab-button-container');
            expect(tabContainer.length).toBe(1);
        });
        describe('based on vm.state.editorTab', function() {
            it('for basic', function() {
                scope.vm = {
                    state: {
                        editorTab: 'basic'
                    },
                    selected: {
                        matonto: {
                            createError: 'error'
                        }
                    }
                }
                scope.$digest();

                var tabs = element.querySelectorAll('.tab');
                expect(tabs.length).toBe(1);

                var errorDisplay = element.querySelectorAll('error-display');
                expect(errorDisplay.length).toBe(1);

                var staticIri = element.querySelectorAll('static-iri');
                expect(staticIri.length).toBe(1);

                var annotationTab = element.querySelectorAll('annotation-tab');
                expect(annotationTab.length).toBe(1);
            });
            it('for axioms', function() {
                scope.vm = {
                    state: {
                        editorTab: 'axioms'
                    }
                }
                scope.$digest();

                var objectSelects = element.querySelectorAll('object-select');
                expect(objectSelects.length).toBe(2);
            });
        });
        describe('and error-display', function() {
            it('is visible when createError is true', function() {
                scope.vm = {
                    selected: {
                        matonto: {
                            createError: true
                        }
                    },
                    state: {
                        editorTab: 'basic'
                    }
                }
                scope.$digest();
                var errors = element.querySelectorAll('error-display');
                expect(errors.length).toBe(1);
            });
            it('is not visible when createError is false', function() {
                scope.vm = {
                    selected: {
                        matonto: {
                            createError: false
                        }
                    },
                    state: {
                        editorTab: 'basic'
                    }
                }
                scope.$digest();
                var errors = element.querySelectorAll('error-display');
                expect(errors.length).toBe(0);
            });
        });
    });
});
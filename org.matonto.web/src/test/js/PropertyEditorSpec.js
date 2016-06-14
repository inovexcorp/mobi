describe('Property Editor directive', function() {
    var $compile,
        scope,
        element;

    injectRegexConstant();

    beforeEach(function() {
        module('templates');
        module('propertyEditor');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            element = $compile(angular.element('<property-editor></property-editor>'))(scope);
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

                var stringSelects = element.querySelectorAll('string-select');
                expect(stringSelects.length).toBe(1);

                var annotationTab = element.querySelectorAll('annotation-tab');
                expect(annotationTab.length).toBe(1);
            });
            describe('for axioms', function() {
                beforeEach(function() {
                    scope.vm = {
                        state: {
                            editorTab: 'axioms'
                        }
                    }
                });
                it('with empty @type', function() {
                    scope.vm.selected = {
                        '@type': []
                    }
                    scope.$digest();

                    var objectSelects = element.querySelectorAll('object-select');
                    expect(objectSelects.length).toBe(1);

                    var warnings = element.querySelectorAll('.text-warning');
                    expect(warnings.length).toBe(1);
                });
                describe('with @type', function() {
                    beforeEach(function() {
                        scope.vm.selected = {
                            '@type': ['temp']
                        }
                        scope.$digest();
                    });
                    it('and isObjectProperty returns true', function() {
                        scope.vm.isObjectProperty = jasmine.createSpy('isObjectProperty').and.returnValue(true);
                        scope.$digest();

                        var objectSelects = element.querySelectorAll('object-select');
                        expect(objectSelects.length).toBe(6);
                    });
                    it('and isObjectProperty returns false', function() {
                        scope.vm.isObjectProperty = jasmine.createSpy('isObjectProperty').and.returnValue(false);
                        scope.$digest();

                        var objectSelects = element.querySelectorAll('object-select');
                        expect(objectSelects.length).toBe(5);
                    });
                });
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
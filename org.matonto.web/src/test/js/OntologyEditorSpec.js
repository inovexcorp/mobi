describe('Ontology Editor directive', function() {
    var $compile,
        scope,
        element;

    injectRegexConstant();

    beforeEach(function() {
        module('ontologyEditor');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    injectDirectiveTemplate('modules/ontology-editor/directives/ontologyEditor/ontologyEditor.html');

    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            element = $compile(angular.element('<ontology-editor></ontology-editor>'))(scope);
            scope.$digest();
        });
        it('for a form', function() {
            expect(element.prop('tagName')).toBe('FORM');
        });
        it('based on tab button container', function() {
            var tabContainer = element.querySelectorAll('tab-button-container');
            expect(tabContainer.length).toBe(1);
        });
        describe('shows correct tab based on vm.state.editorTab', function() {
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
                element = $compile(angular.element('<ontology-editor></ontology-editor>'))(scope);
                scope.$digest();

                var tabs = element.querySelectorAll('.tab');
                expect(tabs.length).toBe(1);

                var errorDisplay = element.querySelectorAll('error-display');
                expect(errorDisplay.length).toBe(1);

                var formGroup = element.querySelectorAll('.form-group');
                expect(formGroup.length).toBe(1);

                var annotationTab = element.querySelectorAll('annotation-tab');
                expect(annotationTab.length).toBe(1);
            });
            it('for preview', function() {
                scope.vm = {
                    state: {
                        editorTab: 'preview'
                    }
                }
                element = $compile(angular.element('<ontology-editor></ontology-editor>'))(scope);
                scope.$digest();

                var formsInline = element.querySelectorAll('.form-inline');
                expect(formsInline.length).toBe(1);

                var textAreaWrappers = element.querySelectorAll('.textarea-wrapper');
                expect(textAreaWrappers.length).toBe(1);
            });
        });
        describe('has-error class', function() {
            beforeEach(function() {
                scope.vm = {
                    state: {
                        editorTab: 'basic'
                    }
                }
                element = $compile(angular.element('<ontology-editor></ontology-editor>'))(scope);
                scope.$digest();
            });
            it('is not there when vm.selected["@id"] is provided', function() {
                scope.vm.selected = {
                    '@id': 'https://matonto.org'
                }
                scope.$digest();
                var formGroup = element.querySelectorAll('.form-group');
                expect(angular.element(formGroup[0]).hasClass('has-error')).toBe(false);
            });
            it('is not there when vm.selected["@id"] is provided incorrectly', function() {
                scope.vm.selected = {
                    '@id': '...'
                }
                scope.$digest();
                var formGroup = element.querySelectorAll('.form-group');
                expect(angular.element(formGroup[0]).hasClass('has-error')).toBe(true);
            });
            it('is there when vm.selected["@id"] is undefined', function() {
                var formGroup = element.querySelectorAll('.form-group');
                expect(angular.element(formGroup[0]).hasClass('has-error')).toBe(true);
            });
        });
        describe('error-display', function() {
            beforeEach(function() {
                element = $compile(angular.element('<ontology-editor></ontology-editor>'))(scope);
            });
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
    describe('calls function when input is changed', function() {
        var formControls;
        beforeEach(function() {
            scope.vm = {
                state: {
                    editorTab: 'basic'
                },
                setValidity: jasmine.createSpy('setValidity'),
                entityChanged: jasmine.createSpy('entityChanged')
            }
            element = $compile(angular.element('<ontology-editor></ontology-editor>'))(scope);
            scope.$digest();

            formControls = element.querySelectorAll('.form-control');
            expect(formControls.length).toBe(1);
            angular.element(formControls[0]).val('new text').triggerHandler('input');
        });
        it('setValidity', function() {
            expect(scope.vm.setValidity).toHaveBeenCalled();
        });
        it('entityChanged', function() {
            expect(scope.vm.entityChanged).toHaveBeenCalled();
        });
    });
});
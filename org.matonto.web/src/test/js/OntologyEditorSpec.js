/*-
 * #%L
 * org.matonto.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
describe('Ontology Editor directive', function() {
    var $compile,
        scope,
        element;

    injectRegexConstant();

    beforeEach(function() {
        module('templates');
        module('ontologyEditor');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

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
        describe('based on vm.state.editorTab', function() {
            describe('for basic', function() {
                beforeEach(function() {
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
                });
                it('when @type is present', function() {
                    scope.vm.selected['@type'] = ['test'];
                    scope.$digest();

                    var tabs = element.querySelectorAll('.tab');
                    expect(tabs.length).toBe(1);

                    var errorDisplay = element.querySelectorAll('error-display');
                    expect(errorDisplay.length).toBe(1);

                    var formGroup = element.querySelectorAll('.form-group');
                    expect(formGroup.length).toBe(1);

                    var annotationTab = element.querySelectorAll('annotation-tab');
                    expect(annotationTab.length).toBe(1);

                    var typeMissing = element.querySelectorAll('.type-missing');
                    expect(typeMissing.length).toBe(0);
                });
                it('when @type is missing', function() {
                    var tabs = element.querySelectorAll('.tab');
                    expect(tabs.length).toBe(1);

                    var errorDisplay = element.querySelectorAll('error-display');
                    expect(errorDisplay.length).toBe(0);

                    var formGroup = element.querySelectorAll('.form-group');
                    expect(formGroup.length).toBe(0);

                    var annotationTab = element.querySelectorAll('annotation-tab');
                    expect(annotationTab.length).toBe(0);

                    var typeMissing = element.querySelectorAll('.type-missing');
                    expect(typeMissing.length).toBe(1);
                });
            });
            it('for preview', function() {
                scope.vm = {
                    state: {
                        editorTab: 'preview'
                    }
                }
                scope.$digest();

                var formsInline = element.querySelectorAll('.form-inline');
                expect(formsInline.length).toBe(1);

                var textAreaWrappers = element.querySelectorAll('.textarea-wrapper');
                expect(textAreaWrappers.length).toBe(1);
            });
        });
        describe('and has-error class', function() {
            beforeEach(function() {
                scope.vm = {
                    state: {
                        editorTab: 'basic'
                    },
                    selected: {
                        '@type': ['type']
                    }
                }
                scope.$digest();
            });
            it('is not there when vm.selected["@id"] is valid', function() {
                var formGroup = element.querySelectorAll('.form-group');
                expect(angular.element(formGroup[0]).hasClass('has-error')).toBe(false);
            });
            it('is not there when vm.selected["@id"] is invalid', function() {
                scope.vm.ontologyForm = {
                    ontologyIri: {
                        '$error': {
                            pattern: true
                        }
                    }
                }
                scope.$digest();
                var formGroup = element.querySelectorAll('.form-group');
                expect(angular.element(formGroup[0]).hasClass('has-error')).toBe(true);
            });
        });
        describe('and error-display', function() {
            it('is visible when createError is true', function() {
                scope.vm = {
                    selected: {
                        '@type': ['type'],
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
                        '@type': ['type'],
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
                selected: {
                    '@type': ['type'],
                },
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
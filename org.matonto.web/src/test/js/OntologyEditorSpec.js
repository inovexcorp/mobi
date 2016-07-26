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
        element,
        stateManagerSvc,
        ontologyManagerSvc,
        controller,
        deferred;

    beforeEach(function() {
        module('templates');
        module('ontologyEditor');
        injectRegexConstant();
        mockStateManager();
        mockOntologyManager();

        inject(function(_$q_, _$compile_, _$rootScope_, _stateManagerService_, _ontologyManagerService_) {
            $q = _$q_;
            $compile = _$compile_;
            scope = _$rootScope_;
            stateManagerSvc = _stateManagerService_;
            ontologyManagerSvc = _ontologyManagerService_;
            deferred = _$q_.defer();
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
        describe('based on editorTab', function() {
            describe('for basic', function() {
                beforeEach(function() {
                    stateManagerSvc.state = {editorTab: 'basic'};
                });
                it('when @type is present', function() {
                    stateManagerSvc.selected['@type'] = [];
                    scope.$digest();

                    var tabs = element.querySelectorAll('.tab');
                    expect(tabs.length).toBe(1);

                    var formGroup = element.querySelectorAll('.form-group');
                    expect(formGroup.length).toBe(1);

                    var annotationTab = element.querySelectorAll('annotation-tab');
                    expect(annotationTab.length).toBe(1);

                    var typeMissing = element.querySelectorAll('.type-missing');
                    expect(typeMissing.length).toBe(0);
                });
                it('when @type is missing', function() {
                    scope.$digest();

                    var tabs = element.querySelectorAll('.tab');
                    expect(tabs.length).toBe(1);

                    var formGroup = element.querySelectorAll('.form-group');
                    expect(formGroup.length).toBe(0);

                    var annotationTab = element.querySelectorAll('annotation-tab');
                    expect(annotationTab.length).toBe(0);

                    var typeMissing = element.querySelectorAll('.type-missing');
                    expect(typeMissing.length).toBe(1);
                });
            });
            it('for preview', function() {
                stateManagerSvc.state = {editorTab: 'preview'};
                scope.$digest();

                var formsInline = element.querySelectorAll('.form-inline');
                expect(formsInline.length).toBe(1);

                var textAreaWrappers = element.querySelectorAll('.textarea-wrapper');
                expect(textAreaWrappers.length).toBe(1);
            });
        });
        describe('and has-error class', function() {
            beforeEach(function() {
                stateManagerSvc.state = {editorTab: 'basic'};
                stateManagerSvc.selected = {'@type': ['type']};
                scope.$digest();
                controller = element.controller('ontologyEditor');
            });
            it("is not there when selected['@id'] is valid", function() {
                controller.form = {
                    iri: {
                        '$invalid': false
                    }
                }
                scope.$digest();
                var formGroup = element.querySelectorAll('.form-group');
                expect(angular.element(formGroup[0]).hasClass('has-error')).toBe(false);
            });
            it("is not there when selected['@id'] is invalid", function() {
                controller.form = {
                    iri: {
                        '$invalid': true
                    }
                }
                scope.$digest();
                var formGroup = element.querySelectorAll('.form-group');
                expect(angular.element(formGroup[0]).hasClass('has-error')).toBe(true);
            });
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            element = $compile(angular.element('<ontology-editor></ontology-editor>'))(scope);
            scope.$digest();
            controller = element.controller('ontologyEditor');
        });
        describe('getPreview', function() {
            beforeEach(function() {
                ontologyManagerSvc.getPreview.and.returnValue(deferred.promise);
                controller.serialization = 'serialization';
                controller.getPreview();
            });
            it('calls the correct manager function', function() {
                expect(ontologyManagerSvc.getPreview).toHaveBeenCalledWith(stateManagerSvc.ontology['@id'], 'serialization');
            });
            it('when resolved, sets the correct variable', function() {
                deferred.resolve('success');
                scope.$apply();
                expect(controller.preview).toBe('success');
            });
            it('when rejected, sets the correct variable', function() {
                deferred.resolve('error');
                scope.$apply();
                expect(controller.preview).toBe('error');
            });
        });
        it('iriChanged calls the correct manager function and sets correct variable', function() {
            controller.form = {'$valid': false};
            controller.iriChanged();
            expect(stateManagerSvc.ontology.matonto.isValid).toBe(false);
            expect(stateManagerSvc.entityChanged).toHaveBeenCalledWith(stateManagerSvc.selected, stateManagerSvc.ontology.matonto.id, stateManagerSvc.state);
        });
    });
});

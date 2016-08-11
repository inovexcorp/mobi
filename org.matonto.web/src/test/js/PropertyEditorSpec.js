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

describe('Property Editor directive', function() {
    var $compile,
        scope,
        element,
        controller,
        stateManagerSvc,
        ontologyManagerSvc,
        controller,
        prefixes;

    beforeEach(function() {
        module('templates');
        module('propertyEditor');
        mockPrefixes();
        injectRemoveIriFromArrayFilter();
        mockOntologyManager();
        mockStateManager();

        inject(function(_$compile_, _$rootScope_, _stateManagerService_, _ontologyManagerService_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            stateManagerSvc = _stateManagerService_;
            ontologyManagerSvc = _ontologyManagerService_;
            prefixes = _prefixes_;
        });

        element = $compile(angular.element('<property-editor></property-editor>'))(scope);
        scope.$digest();
    });

    describe('replaces the element with the correct html', function() {
        it('for a div', function() {
            expect(element.prop('tagName')).toBe('DIV');
        });
        it('based on tab button container', function() {
            var tabContainer = element.find('tab-button-container');
            expect(tabContainer.length).toBe(1);
        });
        describe('based on vm.state.editorTab', function() {
            it('for basic', function() {
                stateManagerSvc.state = {editorTab: 'basic'};
                scope.$digest();

                var tabs = element.querySelectorAll('.tab');
                expect(tabs.length).toBe(1);

                var staticIri = element.find('static-iri');
                expect(staticIri.length).toBe(1);

                var stringSelects = element.find('string-select');
                expect(stringSelects.length).toBe(1);

                var annotationTab = element.find('annotation-tab');
                expect(annotationTab.length).toBe(1);
            });
            describe('for axioms', function() {
                beforeEach(function() {
                    stateManagerSvc.state = {editorTab: 'axioms'};
                });
                it('with empty @type', function() {
                    stateManagerSvc.selected = {'@type': []};
                    scope.$digest();

                    var objectSelects = element.find('object-select');
                    expect(objectSelects.length).toBe(1);

                    var warnings = element.querySelectorAll('.text-warning');
                    expect(warnings.length).toBe(1);
                });
                describe('when', function() {
                    it('isObjectProperty returns true', function() {
                        ontologyManagerSvc.isObjectProperty.and.returnValue(true);
                        element = $compile(angular.element('<property-editor></property-editor>'))(scope);
                        scope.$digest();
                        var objectSelects = element.querySelectorAll('object-select');
                        expect(objectSelects.length).toBe(6);
                    });
                    it('isDataTypeProperty returns true', function() {
                        ontologyManagerSvc.isDataTypeProperty.and.returnValue(true);
                        element = $compile(angular.element('<property-editor></property-editor>'))(scope);
                        scope.$digest();
                        var objectSelects = element.querySelectorAll('object-select');
                        expect(objectSelects.length).toBe(5);
                    });
                });
            });
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            controller = element.controller('propertyEditor');
        });
        describe('checkDomain', function() {
            it('keeps rdfs:domain if it has a value', function() {
                stateManagerSvc.selected[prefixes.rdfs + 'domain'] = ['value'];
                controller.checkDomain();
                expect(_.has(stateManagerSvc.selected, prefixes.rdfs + 'domain')).toBe(true);
            });
            it('unsets rdfs:domain if it has no value', function() {
                stateManagerSvc.selected[prefixes.rdfs + 'domain'] = [];
                controller.checkDomain();
                expect(_.has(stateManagerSvc.selected, prefixes.rdfs + 'domain')).toBe(false);
            });
        });
    });
});

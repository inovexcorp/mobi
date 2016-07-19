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
describe('Annotation Overlay directive', function() {
    var $compile,
        scope,
        element,
        controller;

    injectRegexConstant();
    injectHighlightFilter();
    injectTrustedFilter();

    beforeEach(function() {
        module('templates');
        module('annotationOverlay');
        mockOntologyManager();
        mockStateManager();
        mockResponseObj();
        mockAnnotationManager();

        inject(function(_$compile_, _$rootScope_, _stateManagerService_, _ontologyManagerService_, _annotationManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            stateManagerSvc = _stateManagerService_;
            ontologyManagerSvc = _ontologyManagerService_;
            annotationManagerSvc = _annotationManagerService_;
        });
    });

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
                stateManagerSvc.editingAnnotation = test.value;
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
                stateManagerSvc.editingAnnotation = test.value;
                scope.$digest();

                var buttons = element.querySelectorAll('custom-button:not([type])');
                expect(buttons.length).toBe(1);
                expect(buttons[0].innerHTML).toBe(test.result);
            });
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            element = $compile(angular.element('<annotation-overlay></annotation-overlay>'))(scope);
            scope.$digest();
            controller = element.controller('annotationOverlay');
        });
        it('addAnnotation should call the appropriate manager functions', function() {
            controller.addAnnotation({}, 'value');
            expect(annotationManagerSvc.add).toHaveBeenCalled();
            expect(stateManagerSvc.showAnnotationOverlay).toBe(false);
            expect(ontologyManagerSvc.entityChanged).toHaveBeenCalled();
        });
        it('editAnnotation should call the appropriate manager functions', function() {
            controller.editAnnotation({}, 'value');
            expect(annotationManagerSvc.edit).toHaveBeenCalled();
            expect(stateManagerSvc.showAnnotationOverlay).toBe(false);
            expect(ontologyManagerSvc.entityChanged).toHaveBeenCalled();
        });
    });
});
/*-
 * #%L
 * com.mobi.web
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
    var $compile, scope, element, controller, ontologyStateSvc, propertyManagerSvc, ontoUtils, prefixes;

    beforeEach(function() {
        module('templates');
        module('annotationOverlay');
        injectRegexConstant();
        injectHighlightFilter();
        injectTrustedFilter();
        mockOntologyState();
        mockResponseObj();
        mockPropertyManager();
        mockUtil();
        mockPrefixes();
        mockOntologyUtilsManager();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _propertyManagerService_, _responseObj_, _ontologyUtilsManagerService_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            propertyManagerSvc = _propertyManagerService_;
            resObj = _responseObj_;
            ontoUtils = _ontologyUtilsManagerService_;
            prefixes = _prefixes_;
        });

        element = $compile(angular.element('<annotation-overlay></annotation-overlay>'))(scope);
        scope.$digest();
        controller = element.controller('annotationOverlay');
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('annotation-overlay')).toBe(true);
        });
        it('based on form (.content)', function() {
            expect(element.querySelectorAll('.content').length).toBe(1);
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
                ontologyStateSvc.editingAnnotation = test.value;
                scope.$digest();

                var header = element.find('h6');
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
                ontologyStateSvc.editingAnnotation = test.value;
                scope.$digest();

                var buttons = element.querySelectorAll('button.btn-primary');
                expect(buttons.length).toBe(1);
                expect(buttons[0].innerHTML).toBe(test.result);
            });
        });
    });
    describe('controller methods', function() {
        it('disableProp should test whether an annotation is owl:deprecated and whether it has been set already', function() {
            resObj.getItemIri.and.returnValue('test');
            expect(controller.disableProp({})).toBe(false);

            resObj.getItemIri.and.returnValue(prefixes.owl + 'deprecated');
            expect(controller.disableProp({})).toBe(false);

            ontologyStateSvc.listItem.selected[prefixes.owl + 'deprecated'] = [];
            expect(controller.disableProp({})).toBe(true);
        });
        it('addAnnotation should call the appropriate manager functions', function() {
            controller.addAnnotation();
            expect(resObj.getItemIri).toHaveBeenCalledWith(ontologyStateSvc.annotationSelect);
            expect(resObj.getItemIri).toHaveBeenCalledWith(ontologyStateSvc.annotationType);
            expect(propertyManagerSvc.add).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, resObj.getItemIri(ontologyStateSvc.annotationSelect), ontologyStateSvc.annotationValue, resObj.getItemIri(ontologyStateSvc.annotationType), ontologyStateSvc.annotationLanguage);
            expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
            expect(ontologyStateSvc.showAnnotationOverlay).toBe(false);
            expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
        });
        it('editAnnotation should call the appropriate manager functions', function() {
            controller.editAnnotation();
            expect(resObj.getItemIri).toHaveBeenCalledWith(ontologyStateSvc.annotationSelect);
            expect(resObj.getItemIri).toHaveBeenCalledWith(ontologyStateSvc.annotationType);
            expect(ontologyStateSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
            expect(propertyManagerSvc.edit).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, resObj.getItemIri(ontologyStateSvc.annotationSelect), ontologyStateSvc.annotationValue, ontologyStateSvc.annotationIndex, resObj.getItemIri(ontologyStateSvc.annotationType), ontologyStateSvc.annotationLanguage);
            expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
            expect(ontologyStateSvc.showAnnotationOverlay).toBe(false);
            expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
        });
    });
});

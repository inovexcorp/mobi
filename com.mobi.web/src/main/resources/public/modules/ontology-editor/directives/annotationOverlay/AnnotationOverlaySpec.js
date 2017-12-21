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
    var $compile, scope, ontologyStateSvc, propertyManagerSvc, ontoUtils, prefixes;

    beforeEach(function() {
        module('templates');
        module('annotationOverlay');
        mockOntologyState();
        mockPropertyManager();
        mockUtil();
        mockPrefixes();
        mockOntologyUtilsManager();
        injectHighlightFilter();
        injectTrustedFilter();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _propertyManagerService_, _ontologyUtilsManagerService_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            propertyManagerSvc = _propertyManagerService_;
            ontoUtils = _ontologyUtilsManagerService_;
            prefixes = _prefixes_;
        });

        this.element = $compile(angular.element('<annotation-overlay></annotation-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('annotationOverlay');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        propertyManagerSvc = null;
        ontoUtils = null;
        prefixes = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('annotation-overlay')).toBe(true);
        });
        it('based on form (.content)', function() {
            expect(this.element.querySelectorAll('.content').length).toBe(1);
        });
        it('has correct heading based on variable', function() {
            [
                {
                    value: true,
                    result: 'Edit Annotation'
                },
                {
                    value: false,
                    result: 'Add Annotation'
                }
            ].forEach(function(test) {
                ontologyStateSvc.editingAnnotation = test.value;
                scope.$digest();

                var header = this.element.find('h6');
                expect(header.length).toBe(1);
                expect(header[0].innerHTML).toBe(test.result);
            }, this);
        });
        it('has correct button based on variable', function() {
            [
                {
                    value: true,
                    result: 'Edit'
                },
                {
                    value: false,
                    result: 'Add'
                }
            ].forEach(function(test) {
                ontologyStateSvc.editingAnnotation = test.value;
                scope.$digest();

                var buttons = this.element.querySelectorAll('button.btn-primary');
                expect(buttons.length).toBe(1);
                expect(buttons[0].innerHTML).toBe(test.result);
            }, this);
        });
    });
    describe('controller methods', function() {
        it('disableProp should test whether an annotation is owl:deprecated and whether it has been set already', function() {
            expect(this.controller.disableProp('test')).toBe(false);
            expect(this.controller.disableProp(prefixes.owl + 'deprecated')).toBe(false);

            ontologyStateSvc.listItem.selected[prefixes.owl + 'deprecated'] = [];
            expect(this.controller.disableProp(prefixes.owl + 'deprecated')).toBe(true);
        });
        it('addAnnotation should call the appropriate manager functions', function() {
            this.controller.addAnnotation();
            expect(propertyManagerSvc.add).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, ontologyStateSvc.annotationSelect, ontologyStateSvc.annotationValue, ontologyStateSvc.annotationType, ontologyStateSvc.annotationLanguage);
            expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
            expect(ontologyStateSvc.showAnnotationOverlay).toBe(false);
            expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
        });
        it('editAnnotation should call the appropriate manager functions', function() {
            this.controller.editAnnotation();
            expect(ontologyStateSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
            expect(propertyManagerSvc.edit).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, ontologyStateSvc.annotationSelect, ontologyStateSvc.annotationValue, ontologyStateSvc.annotationIndex, ontologyStateSvc.annotationType, ontologyStateSvc.annotationLanguage);
            expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
            expect(ontologyStateSvc.showAnnotationOverlay).toBe(false);
            expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
        });
    });
});

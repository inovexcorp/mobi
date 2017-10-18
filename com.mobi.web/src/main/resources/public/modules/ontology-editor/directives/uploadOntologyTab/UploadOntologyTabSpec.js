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
describe('Upload Ontology Tab directive', function() {
    var $compile,
        scope,
        $q,
        element,
        controller,
        ontologyStateSvc,
        ontologyManagerSvc;

    beforeEach(function() {
        module('templates');
        module('uploadOntologyTab');
        mockOntologyManager();
        mockOntologyState();
        injectRegexConstant();

        inject(function(_$compile_, _$rootScope_, _$q_, _ontologyStateService_, _ontologyManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyManagerSvc = _ontologyManagerService_;
        });

        element = $compile(angular.element('<upload-ontology-tab></upload-ontology-tab>'))(scope);
        scope.$digest();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('upload-ontology-tab')).toBe(true);
            expect(element.querySelectorAll('.actions').length).toBe(1);
            expect(element.querySelectorAll('.form-container').length).toBe(1);
        });
        _.forEach(['form', 'file-input', 'custom-label', 'text-input', 'text-area', 'keyword-select', 'editor-radio-buttons'], function(tag) {
            it('with a ' + tag, function() {
                expect(element.find(tag).length).toBe(1);
            });
        });
        it('with a .btn-container', function() {
            expect(element.querySelectorAll('.btn-container').length).toBe(1);
        });
        it('with custom buttons to upload and cancel', function() {
            var buttons = element.querySelectorAll('.btn-container button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Upload']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Upload']).toContain(angular.element(buttons[1]).text().trim());
        });
        it('depending on whether the form is invalid', function() {
            var button = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            controller = element.controller('uploadOntologyTab');
            controller.form.$invalid = false;
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
        it('depending on whether there is an error', function() {
            expect(element.find('error-display').length).toBe(0);

            controller = element.controller('uploadOntologyTab');
            controller.error = true;
            scope.$digest();
            expect(element.find('error-display').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            controller = element.controller('uploadOntologyTab');
        });
        describe('should upload an ontology', function() {
            beforeEach(function() {
                this.listItem = {ontology: []};
                controller.file = {};
                controller.title = '';
                controller.description = '';
                controller.keywords = ['one', 'two'];
                ontologyStateSvc.showUploadTab = true;
            });
            it('unless an error occurs', function() {
                ontologyStateSvc.uploadThenGet.and.returnValue($q.reject('Error message'));
                controller.upload();
                scope.$apply();
                expect(ontologyStateSvc.uploadThenGet).toHaveBeenCalledWith(controller.file, controller.title, controller.description, 'one,two', controller.type);
                expect(ontologyManagerSvc.getOntologyIRI).not.toHaveBeenCalled();
                expect(ontologyStateSvc.showUploadTab).toBe(true);
                expect(controller.error).toBe('Error message');
            });
            it('succesfully', function() {
                controller.upload();
                scope.$apply();
                expect(ontologyStateSvc.uploadThenGet).toHaveBeenCalledWith(controller.file, controller.title, controller.description, 'one,two', controller.type);
                expect(ontologyStateSvc.showUploadTab).toBe(false);
                expect(controller.error).toBeUndefined();
            });
        });
    });
});

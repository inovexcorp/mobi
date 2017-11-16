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
    var $compile, scope, $q, ontologyStateSvc, ontologyManagerSvc;

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

        this.element = $compile(angular.element('<upload-ontology-tab></upload-ontology-tab>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('uploadOntologyTab');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        ontologyStateSvc = null;
        ontologyManagerSvc = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('upload-ontology-tab')).toBe(true);
            expect(this.element.querySelectorAll('.actions').length).toBe(1);
            expect(this.element.querySelectorAll('.form-container').length).toBe(1);
        });
        _.forEach(['form', 'file-input', 'custom-label', 'text-input', 'text-area', 'keyword-select', 'editor-radio-buttons'], function(tag) {
            it('with a ' + tag, function() {
                expect(this.element.find(tag).length).toBe(1);
            });
        });
        it('with a .btn-container', function() {
            expect(this.element.querySelectorAll('.btn-container').length).toBe(1);
        });
        it('with custom buttons to upload and cancel', function() {
            var buttons = this.element.querySelectorAll('.btn-container button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Upload']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Upload']).toContain(angular.element(buttons[1]).text().trim());
        });
        it('depending on whether the form is invalid', function() {
            var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            this.controller.form.$invalid = false;
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
        it('depending on whether there is an error', function() {
            expect(this.element.find('error-display').length).toBe(0);

            this.controller.error = true;
            scope.$digest();
            expect(this.element.find('error-display').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        describe('should upload an ontology', function() {
            beforeEach(function() {
                this.listItem = {ontology: []};
                this.controller.file = {};
                this.controller.title = '';
                this.controller.description = '';
                this.controller.keywords = ['one', 'two'];
                ontologyStateSvc.showUploadTab = true;
            });
            it('unless an error occurs', function() {
                ontologyStateSvc.uploadThenGet.and.returnValue($q.reject('Error message'));
                this.controller.upload();
                scope.$apply();
                expect(ontologyStateSvc.uploadThenGet).toHaveBeenCalledWith(this.controller.file, this.controller.title, this.controller.description, 'one,two', this.controller.type);
                expect(ontologyManagerSvc.getOntologyIRI).not.toHaveBeenCalled();
                expect(ontologyStateSvc.showUploadTab).toBe(true);
                expect(this.controller.error).toBe('Error message');
            });
            it('succesfully', function() {
                this.controller.upload();
                scope.$apply();
                expect(ontologyStateSvc.uploadThenGet).toHaveBeenCalledWith(this.controller.file, this.controller.title, this.controller.description, 'one,two', this.controller.type);
                expect(ontologyStateSvc.showUploadTab).toBe(false);
                expect(this.controller.error).toBeUndefined();
            });
        });
    });
});

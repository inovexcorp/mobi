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
describe('Upload Changes Overlay directive', function() {
    var $compile, scope, $q, ontologyStateSvc, ontologyManagerSvc;

    beforeEach(function() {
        module('templates');
        module('uploadChangesOverlay');
        mockOntologyManager();
        mockOntologyState();

        inject(function(_$compile_, _$rootScope_, _$q_, _ontologyStateService_, _ontologyManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyManagerSvc = _ontologyManagerService_;
        });

        this.element = $compile(angular.element('<upload-changes-overlay></upload-changes-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('uploadChangesOverlay');
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
            expect(this.element.hasClass('overlay')).toBe(true);
            expect(this.element.querySelectorAll('.content').length).toBe(1);
            expect(this.element.querySelectorAll('.btn-container').length).toBe(1);
        });
        _.forEach(['form', 'file-input'], function(tag) {
            it('with a ' + tag, function() {
                expect(this.element.find(tag).length).toBe(1);
            });
        });
        it('with buttons for canceling and uploading', function() {
            var buttons = this.element.find('button');
            expect(buttons.length).toBe(2);
            expect(['Upload', 'Cancel'].indexOf(angular.element(buttons[0]).text()) >= 0).toBe(true);
            expect(['Upload', 'Cancel'].indexOf(angular.element(buttons[1]).text()) >= 0).toBe(true);
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
                this.controller.os.listItem = {
                    ontologyRecord: {
                        recordId: 'recordId',
                        branchId: 'branchId',
                        commitId: 'commitId'
                    },
                    editorTabStates: {
                        savedChanges: {
                            active: false
                        }
                    },
                    ontology: []
                };
                this.controller.file = {};
                ontologyStateSvc.showUploadChangesOverlay = true;
            });
            it('unless an error occurs', function() {
                ontologyStateSvc.uploadChanges.and.returnValue($q.reject('Error message'));
                this.controller.upload();
                scope.$apply();
                expect(ontologyStateSvc.uploadChanges).toHaveBeenCalledWith(this.controller.file,
                        this.controller.os.listItem.ontologyRecord.recordId, this.controller.os.listItem.ontologyRecord.branchId,
                        this.controller.os.listItem.ontologyRecord.commitId);
                expect(ontologyStateSvc.showUploadChangesOverlay).toBe(true);
                expect(ontologyStateSvc.listItem.editorTabStates.savedChanges.active).toBe(false);
                expect(this.controller.error).toBe('Error message');
            });
            it('succesfully', function() {
                this.controller.upload();
                scope.$apply();
                expect(ontologyStateSvc.uploadChanges).toHaveBeenCalledWith(this.controller.file,
                        this.controller.os.listItem.ontologyRecord.recordId, this.controller.os.listItem.ontologyRecord.branchId,
                        this.controller.os.listItem.ontologyRecord.commitId);
                expect(ontologyStateSvc.showUploadChangesOverlay).toBe(false);
                expect(ontologyStateSvc.listItem.editorTabStates.savedChanges.active).toBe(true);
                expect(this.controller.error).toBeFalsy();
            });
        });
    });
});
/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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

        scope.close = jasmine.createSpy('close');
        scope.dismiss = jasmine.createSpy('dismiss');
        this.element = $compile(angular.element('<upload-changes-overlay close="close()" dismiss="dismiss()"></upload-changes-overlay>'))(scope);
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

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('UPLOAD-CHANGES-OVERLAY');
            expect(this.element.querySelectorAll('.modal-header').length).toEqual(1);
            expect(this.element.querySelectorAll('.modal-body').length).toEqual(1);
            expect(this.element.querySelectorAll('.modal-footer').length).toEqual(1);
        });
        it('with a button', function() {
            expect(this.element.find('button').length).toBe(4);
        });
        it('with a span', function() {
            expect(this.element.find('span').length).toBe(2);
        });
        _.forEach(['form', 'file-input'], function(tag) {
            it('with a ' + tag, function() {
                expect(this.element.find(tag).length).toBe(1);
            });
        });
        it('with buttons for canceling and uploading', function() {
            var buttons = this.element.querySelectorAll('.modal-footer button');
            expect(buttons.length).toBe(2);
            expect(['Submit', 'Cancel'].indexOf(angular.element(buttons[0]).text()) >= 0).toBe(true);
            expect(['Submit', 'Cancel'].indexOf(angular.element(buttons[1]).text()) >= 0).toBe(true);
        });
        it('depending on whether the form is invalid', function() {
            var button = angular.element(this.element.querySelectorAll('.modal-footer button.btn-primary')[0]);
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
                this.controller.fileName = 'No file selected';
                this.controller.file = {};
            });
            it('unless an error occurs', function() {
                ontologyStateSvc.uploadChanges.and.returnValue($q.reject('Error message'));
                this.controller.submit();
                scope.$apply();
                expect(ontologyStateSvc.uploadChanges).toHaveBeenCalledWith(this.controller.file, this.controller.os.listItem.ontologyRecord.recordId, this.controller.os.listItem.ontologyRecord.branchId, this.controller.os.listItem.ontologyRecord.commitId);
                expect(ontologyStateSvc.listItem.editorTabStates.savedChanges.active).toBe(false);
                expect(this.controller.error).toBe('Error message');
                expect(scope.close).not.toHaveBeenCalled();
            });
            it('succesfully', function() {
                this.controller.file = {name: 'File Name'};
                this.controller.update();
                this.controller.submit();
                scope.$apply();
                expect(ontologyStateSvc.uploadChanges).toHaveBeenCalledWith(this.controller.file, this.controller.os.listItem.ontologyRecord.recordId, this.controller.os.listItem.ontologyRecord.branchId, this.controller.os.listItem.ontologyRecord.commitId);
                expect(this.controller.fileName).toEqual('File Name');
                expect(ontologyStateSvc.listItem.editorTabStates.savedChanges.active).toBe(true);
                expect(this.controller.error).toBeFalsy();
                expect(scope.close).toHaveBeenCalled();
            });
        });
        it('should cancel the overlay', function() {
            this.controller.cancel();
            expect(scope.dismiss).toHaveBeenCalled();
        });
    });
});
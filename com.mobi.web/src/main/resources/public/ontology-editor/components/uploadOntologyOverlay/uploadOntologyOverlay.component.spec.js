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
describe('Upload Ontology Overlay component', function() {
    var $compile, scope, $q, ontologyManagerSvc, ontologyStateSvc;

    beforeEach(function() {
        module('templates');
        module('ontology-editor');
        mockOntologyManager();
        mockOntologyState();

        inject(function(_$compile_, _$rootScope_, _$q_, _ontologyManagerService_, _ontologyStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            ontologyManagerSvc = _ontologyManagerService_;
            ontologyStateSvc = _ontologyStateService_;
        });

        ontologyStateSvc.uploadFiles = [{name: 'file1'}, {name: 'file2'}];
        ontologyStateSvc.uploadList = [{}];
        scope.close = jasmine.createSpy('close');
        scope.dismiss = jasmine.createSpy('dismiss');
        this.element = $compile(angular.element('<upload-ontology-overlay close="close()" dismiss="dismiss()"></upload-ontology-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('uploadOntologyOverlay');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        ontologyManagerSvc = null;
        ontologyStateSvc = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('UPLOAD-ONTOLOGY-OVERLAY');
            expect(this.element.querySelectorAll('.modal-header').length).toBe(1);
            expect(this.element.querySelectorAll('.modal-body').length).toBe(1);
            expect(this.element.querySelectorAll('.modal-footer').length).toBe(1);
        });
        _.forEach(['form', 'h3', 'text-input', 'text-area', 'keyword-select'], function(tag) {
            it('with a ' + tag, function() {
                expect(this.element.find(tag).length).toBe(1);
            });
        });
        it('with a regular .btn', function() {
            expect(this.element.querySelectorAll('.modal-footer .btn:not(.btn-primary)').length).toBe(1);
        });
        it('with .btn-primarys', function() {
            expect(this.element.querySelectorAll('.modal-footer .btn-primary').length).toBe(2);
        });
    });
    describe('controller methods', function() {
        describe('submit should call the correct method', function() {
            describe('and set the values correctly if the adjusted controller.index is', function() {
                beforeEach(function() {
                    this.controller.title = 'title';
                    this.controller.description = 'description';
                    this.controller.keywords = [' keywords '];
                    this.controller.index = 0;
                    this.newId = 'upload-' + (ontologyStateSvc.uploadList.length + this.controller.index);
                });
                it('less than controller.files.length', function() {
                    this.controller.submit();
                    expect(ontologyManagerSvc.uploadFile).toHaveBeenCalledWith({name: 'file1'}, 'title', 'description', ['keywords'], this.newId);
                    expect(this.controller.index).toBe(1);
                    expect(this.controller.title).toBe('file2');
                    expect(this.controller.description).toBe('');
                    expect(this.controller.keywords).toEqual([]);
                    expect(ontologyStateSvc.uploadList).toContain({promise: jasmine.any(Object), id: this.newId, title: 'title', error: undefined});
                    expect(scope.close).not.toHaveBeenCalled();
                });
                it('equal to controller.files.length', function() {
                    this.controller.total = 1;
                    this.controller.submit();
                    expect(ontologyManagerSvc.uploadFile).toHaveBeenCalledWith({name: 'file1'}, 'title', 'description', ['keywords'], this.newId);
                    expect(ontologyStateSvc.uploadList).toContain({promise: jasmine.any(Object), id: this.newId, title: 'title', error: undefined});
                    expect(scope.close).toHaveBeenCalled();
                });
            });
            describe('when uploadFile is', function() {
                it('resolved', function() {
                    ontologyManagerSvc.uploadFile.and.returnValue($q.when());
                    this.controller.submit();
                    scope.$apply();
                    expect(ontologyStateSvc.addErrorToUploadItem).not.toHaveBeenCalled();
                });
                it('rejected', function() {
                    this.controller.index = 0;
                    this.newId = 'upload-' + (ontologyStateSvc.uploadList.length + this.controller.index);
                    ontologyManagerSvc.uploadFile.and.returnValue($q.reject('error'));
                    this.controller.submit();
                    scope.$apply();
                    expect(ontologyStateSvc.addErrorToUploadItem).toHaveBeenCalledWith(this.newId, 'error');
                });
            });
        });
        it('submitAll should call the submit method enough times', function() {
            spyOn(this.controller, 'submit').and.callFake(() => {
                this.controller.index++;
            });
            this.controller.index = 0;
            this.controller.submitAll();
            expect(this.controller.submit.calls.count()).toBe(2);
        });
        it('cancel should call the correct method and set the correct variable', function() {
            ontologyStateSvc.uploadFiles = [{}];
            this.controller.cancel();
            expect(ontologyStateSvc.uploadFiles).toEqual([]);
            expect(scope.dismiss).toHaveBeenCalled();
        });
    });
    it('sets up variables correctly', function() {
        this.controller.title = 'file1';
        this.controller.description = '';
        this.controller.keywords = [];
    });
});
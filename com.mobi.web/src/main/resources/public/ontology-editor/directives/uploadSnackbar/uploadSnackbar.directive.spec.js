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
describe('Upload Snackbar directive', function() {
    var $compile, scope, $q, ontologyStateSvc, httpSvc, modalSvc;

    beforeEach(function() {
        module('templates');
        module('uploadSnackbar');
        mockOntologyState();
        mockHttpService();
        mockModal();

        inject(function(_$compile_, _$rootScope_, _$q_, _ontologyStateService_, _httpService_, _modalService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            ontologyStateSvc = _ontologyStateService_;
            httpSvc = _httpService_;
            modalSvc = _modalService_;
        });

        ontologyStateSvc.uploadList = [{
            error: 'error',
            id: 'id',
            promise: {
                '$$state': {
                    status: 0
                }
            },
            title: 'title'
        }];
        scope.showSnackbar = true;
        this.element = $compile(angular.element('<upload-snackbar show-snackbar="showSnackbar"></upload-snackbar>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('uploadSnackbar');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        ontologyStateSvc = null;
        httpSvc = null;
        modalSvc = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('showSnackbar is two way bound', function() {
            this.controller.showSnackbar = false;
            scope.$digest();
            expect(scope.showSnackbar).toEqual(false);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('upload-snackbar')).toBe(true);
            expect(this.element.hasClass('snackbar')).toBe(true);
        });
        _.forEach(['snackbar-header', 'snackbar-body'], function(item) {
            it('with a .' + item, function() {
                expect(this.element.querySelectorAll('.' + item).length).toBe(1);
            });
        });
        it('with buttons', function() {
            expect(this.element.querySelectorAll('.snackbar-header button').length).toBe(2);
        });
        it('depending on whether the snackbar should be shown', function() {
            expect(this.element.hasClass('show')).toBe(true);

            this.controller.showSnackbar = false;
            scope.$digest();
            expect(this.element.hasClass('show')).toBe(false);
        });
        it('depending on whether the snackbar body should be collapsed', function() {
            var button = angular.element(this.element.querySelectorAll('.snackbar-header button.collapse-button')[0]);
            var body = angular.element(this.element.querySelectorAll('.snackbar-body')[0]);
            expect(button.text()).toEqual('keyboard_arrow_up');
            expect(body.hasClass('ng-hide')).toEqual(false);

            this.controller.collapse = true;
            scope.$digest();
            expect(button.text()).toEqual('keyboard_arrow_down');
            expect(body.hasClass('ng-hide')).toEqual(true);
        });
        it('depending on how many ontologies are being uploaded', function() {
            expect(this.element.querySelectorAll('.uploaded-ontology').length).toEqual(ontologyStateSvc.uploadList.length);
        });
    });
    describe('controller methods', function() {
        describe('hasStatus should return the correct boolean when value and status are', function() {
            beforeEach(function() {
                this.promise = {
                    '$$state': {
                        status: 0
                    }
                };
            });
            it('equal', function() {
                expect(this.controller.hasStatus(this.promise, 0)).toBe(true);
            });
            it('not equal', function() {
                expect(this.controller.hasStatus(this.promise, 1)).toBe(false);
            });
        });
        it('isPending should determine whether an upload is pending', function() {
            var item = {id: 'id'}
            httpSvc.isPending.and.returnValue(false);
            expect(this.controller.isPending(item)).toBe(false);
            expect(httpSvc.isPending).toHaveBeenCalledWith(item.id);

            httpSvc.isPending.and.returnValue(true);
            expect(this.controller.isPending(item)).toBe(true);
            expect(httpSvc.isPending).toHaveBeenCalledWith(item.id);
        });
        describe('attemptClose should call the appropriate method if', function() {
            beforeEach(function() {
                spyOn(this.controller, 'hasPending');
                spyOn(this.controller, 'close');
            });
            it('there are pending uploads', function() {
                this.controller.hasPending.and.returnValue(true);
                this.controller.attemptClose();
                expect(modalSvc.openConfirmModal).toHaveBeenCalledWith(jasmine.any(String), this.controller.close);
                expect(this.controller.close).not.toHaveBeenCalled();
            });
            it('all uploads are complete', function() {
                this.controller.hasPending.and.returnValue(false);
                this.controller.attemptClose();
                expect(modalSvc.openConfirmModal).not.toHaveBeenCalled();
                expect(this.controller.close).toHaveBeenCalled();
            });
        });
        it('close should set and call correct things', function() {
            var item = {id: 'id'};
            ontologyStateSvc.uploadList = [item];
            ontologyStateSvc.uploadFiles = [{}];
            this.controller.close();
            expect(this.controller.showSnackbar).toBe(false);
            expect(httpSvc.cancel).toHaveBeenCalledWith(item.id);
            expect(ontologyStateSvc.uploadList).toEqual([]);
            expect(ontologyStateSvc.uploadFiles).toEqual([]);
        });
        describe('hasPending should return correct value when httpService.pending array is', function() {
            beforeEach(function() {
                ontologyStateSvc.uploadList = [{id: 'id'}, {id: 'id2'}];
            });
            it('empty', function() {
                httpSvc.isPending.and.returnValue(false);
                expect(this.controller.hasPending()).toBe(false);
                expect(httpSvc.isPending).toHaveBeenCalledWith('id');
                expect(httpSvc.isPending).toHaveBeenCalledWith('id2');
            });
            it('populated', function() {
                httpSvc.isPending.and.returnValue(true);
                expect(this.controller.hasPending()).toBe(true);
                expect(httpSvc.isPending).toHaveBeenCalledWith('id');
                expect(httpSvc.isPending).not.toHaveBeenCalledWith('id2');
            });
        });
    });
});

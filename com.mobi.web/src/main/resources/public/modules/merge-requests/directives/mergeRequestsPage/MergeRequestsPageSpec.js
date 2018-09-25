/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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
describe('Merge Requests Page directive', function() {
    var $compile, scope, $q, mergeRequestsStateSvc, mergeRequestManagerSvc, utilSvc, ontologyStateSvc;

    beforeEach(function() {
        module('templates');
        module('mergeRequestsPage');
        mockMergeRequestsState();
        mockMergeRequestManager();
        mockUtil();
        mockOntologyState();

        inject(function(_$compile_, _$rootScope_, _$q_, _mergeRequestsStateService_, _mergeRequestManagerService_, _utilService_, _ontologyStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            mergeRequestsStateSvc = _mergeRequestsStateService_;
            mergeRequestManagerSvc = _mergeRequestManagerService_;
            utilSvc = _utilService_;
            ontologyStateSvc = _ontologyStateService_;
        });

        this.element = $compile(angular.element('<merge-requests-page></merge-requests-page>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('mergeRequestsPage');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        mergeRequestsStateSvc = null;
        mergeRequestManagerSvc = null;
        utilSvc = null;
        ontologyStateSvc = null;
        this.element.remove();
    });

    describe('controller methods', function() {
        it('should close the delete overlay', function() {
            mergeRequestsStateSvc.requestToDelete = {};
            mergeRequestsStateSvc.showDelete = true;
            this.controller.errorMessage = 'test';
            this.controller.closeDelete();
            expect(mergeRequestsStateSvc.requestToDelete).toBeUndefined();
            expect(mergeRequestsStateSvc.showDelete).toEqual(false);
            expect(this.controller.errorMessage).toEqual('');
        });
        it('should close the accept overlay', function() {
            mergeRequestsStateSvc.requestToAccept = {};
            mergeRequestsStateSvc.showAccept = true;
            this.controller.errorMessage = 'test';
            this.controller.closeAccept();
            expect(mergeRequestsStateSvc.requestToAccept).toBeUndefined();
            expect(mergeRequestsStateSvc.showAccept).toEqual(false);
            expect(this.controller.errorMessage).toEqual('');
        });
        describe('should delete a merge request', function() {
            beforeEach(function() {
                mergeRequestsStateSvc.requestToDelete = {jsonld: {'@id': 'request'}};
                mergeRequestsStateSvc.selected = mergeRequestsStateSvc.requestToDelete;
                spyOn(this.controller, 'closeDelete');
            });
            it('unless an error occurs', function() {
                mergeRequestManagerSvc.deleteRequest.and.returnValue($q.reject('Error Message'));
                this.controller.deleteRequest();
                scope.$apply();
                expect(mergeRequestManagerSvc.deleteRequest).toHaveBeenCalledWith('request');
                expect(mergeRequestsStateSvc.selected).toEqual({jsonld: {'@id': 'request'}});
                expect(utilSvc.createSuccessToast).not.toHaveBeenCalled();
                expect(this.controller.closeDelete).not.toHaveBeenCalled();
                expect(mergeRequestsStateSvc.setRequests).not.toHaveBeenCalled();
                expect(this.controller.errorMessage).toEqual('Error Message');
            });
            describe('successfully', function() {
                beforeEach(function() {
                    mergeRequestManagerSvc.deleteRequest.and.returnValue($q.when());
                });
                it('with a selected request', function() {
                    this.controller.deleteRequest();
                    scope.$apply();
                    expect(mergeRequestManagerSvc.deleteRequest).toHaveBeenCalledWith('request');
                    expect(mergeRequestsStateSvc.selected).toBeUndefined();
                    expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                    expect(this.controller.closeDelete).toHaveBeenCalled();
                    expect(mergeRequestsStateSvc.setRequests).not.toHaveBeenCalled();
                    expect(this.controller.errorMessage).toEqual('');
                });
                it('without a selected request', function() {
                    mergeRequestsStateSvc.selected = undefined;
                    this.controller.deleteRequest();
                    scope.$apply();
                    expect(mergeRequestManagerSvc.deleteRequest).toHaveBeenCalledWith('request');
                    expect(mergeRequestsStateSvc.selected).toBeUndefined();
                    expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                    expect(this.controller.closeDelete).toHaveBeenCalled();
                    expect(mergeRequestsStateSvc.setRequests).toHaveBeenCalledWith(mergeRequestsStateSvc.acceptedFilter);
                    expect(this.controller.errorMessage).toEqual('');
                });
            });
        });
        describe('should accept a merge request', function() {
            beforeEach(function() {
                this.requestObj = {jsonld: {'@id': 'request'}, targetBranch: {'@id': 'branchId'}};
                mergeRequestsStateSvc.requestToAccept = angular.copy(this.requestObj);
                mergeRequestsStateSvc.selected = angular.copy(this.requestObj);
                spyOn(this.controller, 'closeAccept');
            });
            describe('if acceptRequest resolves', function() {
                beforeEach(function() {
                    mergeRequestManagerSvc.acceptRequest.and.returnValue($q.when());
                });
                describe('if getRequest resolves', function() {
                    beforeEach(function() {
                        this.newRequest = {'@id': 'request', new: true};
                        mergeRequestManagerSvc.getRequest.and.returnValue($q.when(this.newRequest));
                    });
                    describe('if setRequestDetails resolves', function() {
                        beforeEach(function() {
                            mergeRequestsStateSvc.setRequestDetails.and.returnValue($q.when());
                        });
                        it('and the ontology editor is not open to an ontology', function() {
                            var listItem = angular.copy(ontologyStateSvc.listItem);
                            this.controller.acceptRequest();
                            scope.$apply();
                            expect(mergeRequestManagerSvc.acceptRequest).toHaveBeenCalledWith('request');
                            expect(mergeRequestManagerSvc.getRequest).toHaveBeenCalledWith('request');
                            expect(mergeRequestsStateSvc.setRequestDetails).toHaveBeenCalledWith(mergeRequestsStateSvc.requestToAccept);
                            expect(mergeRequestsStateSvc.selected).toEqual(_.set(this.requestObj, 'jsonld', this.newRequest));
                            expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                            expect(this.controller.closeAccept).toHaveBeenCalled();
                            expect(ontologyStateSvc.listItem).toEqual(listItem);
                            expect(utilSvc.createWarningToast).not.toHaveBeenCalled();
                            expect(this.controller.errorMessage).toEqual('');
                        });
                        describe('and the ontology editor is on the target branch', function() {
                            beforeEach(function() {
                                ontologyStateSvc.listItem.ontologyRecord.branchId = this.requestObj.targetBranch['@id'];
                            });
                            it('and it not in the middle of a merge', function() {
                                this.controller.acceptRequest();
                                scope.$apply();
                                expect(mergeRequestManagerSvc.acceptRequest).toHaveBeenCalledWith('request');
                                expect(mergeRequestManagerSvc.getRequest).toHaveBeenCalledWith('request');
                                expect(mergeRequestsStateSvc.setRequestDetails).toHaveBeenCalledWith(mergeRequestsStateSvc.requestToAccept);
                                expect(mergeRequestsStateSvc.selected).toEqual(_.set(this.requestObj, 'jsonld', this.newRequest));
                                expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                                expect(this.controller.closeAccept).toHaveBeenCalled();
                                expect(ontologyStateSvc.listItem.upToDate).toEqual(false);
                                expect(utilSvc.createWarningToast).not.toHaveBeenCalled();
                                expect(this.controller.errorMessage).toEqual('');
                            });
                            it('and is in the middle of a merge', function() {
                                ontologyStateSvc.listItem.merge.active = true;
                                this.controller.acceptRequest();
                                scope.$apply();
                                expect(mergeRequestManagerSvc.acceptRequest).toHaveBeenCalledWith('request');
                                expect(mergeRequestManagerSvc.getRequest).toHaveBeenCalledWith('request');
                                expect(mergeRequestsStateSvc.setRequestDetails).toHaveBeenCalledWith(mergeRequestsStateSvc.requestToAccept);
                                expect(mergeRequestsStateSvc.selected).toEqual(_.set(this.requestObj, 'jsonld', this.newRequest));
                                expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                                expect(this.controller.closeAccept).toHaveBeenCalled();
                                expect(ontologyStateSvc.listItem.upToDate).toEqual(false);
                                expect(utilSvc.createWarningToast).toHaveBeenCalled();
                                expect(this.controller.errorMessage).toEqual('');
                            });
                        });
                        it('and the ontology editor is in the middle of merging into the target', function() {
                            ontologyStateSvc.listItem.merge.active = true;
                            ontologyStateSvc.listItem.merge.target = {'@id': this.requestObj.targetBranch['@id']};
                            var upToDate = ontologyStateSvc.listItem.upToDate;
                            this.controller.acceptRequest();
                            scope.$apply();
                            expect(mergeRequestManagerSvc.acceptRequest).toHaveBeenCalledWith('request');
                            expect(mergeRequestManagerSvc.getRequest).toHaveBeenCalledWith('request');
                            expect(mergeRequestsStateSvc.setRequestDetails).toHaveBeenCalledWith(mergeRequestsStateSvc.requestToAccept);
                            expect(mergeRequestsStateSvc.selected).toEqual(_.set(this.requestObj, 'jsonld', this.newRequest));
                            expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                            expect(this.controller.closeAccept).toHaveBeenCalled();
                            expect(ontologyStateSvc.listItem.upToDate).toEqual(upToDate);
                            expect(utilSvc.createWarningToast).toHaveBeenCalled();
                            expect(this.controller.errorMessage).toEqual('');
                        });
                    });
                    it('unless setRequestDetails rejects', function() {
                        mergeRequestsStateSvc.setRequestDetails.and.returnValue($q.reject('Error Message'));
                        this.controller.acceptRequest();
                        scope.$apply();
                        expect(mergeRequestManagerSvc.acceptRequest).toHaveBeenCalledWith('request');
                        expect(mergeRequestManagerSvc.getRequest).toHaveBeenCalledWith('request');
                        expect(mergeRequestsStateSvc.setRequestDetails).toHaveBeenCalledWith(mergeRequestsStateSvc.requestToAccept);
                        expect(mergeRequestsStateSvc.selected).toEqual(this.requestObj);
                        expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                        expect(this.controller.closeAccept).not.toHaveBeenCalled();
                        expect(this.controller.errorMessage).toEqual('Error Message');
                    });
                });
                it('unless getRequest rejects', function() {
                    mergeRequestManagerSvc.getRequest.and.returnValue($q.reject('Error Message'));
                    this.controller.acceptRequest();
                    scope.$apply();
                    expect(mergeRequestManagerSvc.acceptRequest).toHaveBeenCalledWith('request');
                    expect(mergeRequestManagerSvc.getRequest).toHaveBeenCalledWith('request');
                    expect(mergeRequestsStateSvc.setRequestDetails).not.toHaveBeenCalled();
                    expect(mergeRequestsStateSvc.selected).toEqual(this.requestObj);
                    expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                    expect(this.controller.closeAccept).not.toHaveBeenCalled();
                    expect(this.controller.errorMessage).toEqual('Error Message');
                });
            });
            it('unless acceptRequest rejects', function() {
                mergeRequestManagerSvc.acceptRequest.and.returnValue($q.reject('Error Message'));
                this.controller.acceptRequest();
                scope.$apply();
                expect(mergeRequestManagerSvc.acceptRequest).toHaveBeenCalledWith('request');
                expect(mergeRequestManagerSvc.getRequest).not.toHaveBeenCalled();
                expect(mergeRequestsStateSvc.setRequestDetails).not.toHaveBeenCalled();
                expect(mergeRequestsStateSvc.selected).toEqual(this.requestObj);
                expect(utilSvc.createSuccessToast).not.toHaveBeenCalled();
                expect(this.controller.closeAccept).not.toHaveBeenCalled();
                expect(this.controller.errorMessage).toEqual('Error Message');
            });
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('merge-requests-page')).toBe(true);
            expect(this.element.querySelectorAll('.row').length).toBe(1);
        });
        it('depending on whether a request is being deleted', function() {
            expect(this.element.find('confirmation-overlay').length).toBe(0);

            mergeRequestsStateSvc.showDelete = true;
            scope.$digest();
            expect(this.element.find('confirmation-overlay').length).toBe(1);
        });
        it('depending on whether a request is being accepted', function() {
            expect(this.element.find('confirmation-overlay').length).toBe(0);

            mergeRequestsStateSvc.showAccept = true;
            scope.$digest();
            expect(this.element.find('confirmation-overlay').length).toBe(1);
        });
        it('if no request is selected and one is not being created', function() {
            expect(this.element.find('merge-request-list').length).toBe(1);
            expect(this.element.find('merge-request-view').length).toBe(0);
            expect(this.element.find('create-request').length).toBe(0);
        });
        it('if a request is selected', function() {
            mergeRequestsStateSvc.selected = {};
            scope.$digest();
            expect(this.element.find('merge-request-list').length).toBe(0);
            expect(this.element.find('merge-request-view').length).toBe(1);
            expect(this.element.find('create-request').length).toBe(0);
        });
        it('if a request is being created', function() {
            mergeRequestsStateSvc.createRequest = true;
            scope.$digest();
            expect(this.element.find('merge-request-list').length).toBe(0);
            expect(this.element.find('merge-request-view').length).toBe(0);
            expect(this.element.find('create-request').length).toBe(1);
        });
    });
});
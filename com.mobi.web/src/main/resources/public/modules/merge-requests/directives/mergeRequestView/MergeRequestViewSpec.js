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
describe('Merge Request View directive', function() {
    var $compile, scope, $q, mergeRequestsStateSvc, mergeRequestManagerSvc, modalSvc, utilSvc;

    beforeEach(function() {
        module('templates');
        module('mergeRequestView');
        mockMergeRequestsState();
        mockMergeRequestManager();
        mockModal();
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _$q_, _mergeRequestsStateService_, _mergeRequestManagerService_, _modalService_, _utilService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            mergeRequestsStateSvc = _mergeRequestsStateService_;
            mergeRequestManagerSvc = _mergeRequestManagerService_;
            modalSvc = _modalService_;
            utilSvc = _utilService_;
        });

        this.getDefer = $q.defer();
        mergeRequestManagerSvc.getRequest.and.returnValue(this.getDefer.promise);
        mergeRequestsStateSvc.selected = {jsonld: {}};
        this.element = $compile(angular.element('<merge-request-view></merge-request-view>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('mergeRequestView');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        mergeRequestsStateSvc = null;
        mergeRequestManagerSvc = null;
        modalSvc = null;
        utilSvc = null;
        this.element.remove();
    });

    describe('should initialize correctly if getRequest', function() {
        it('resolves', function() {
            this.getDefer.resolve();
            scope.$apply();
            expect(mergeRequestsStateSvc.setRequestDetails).toHaveBeenCalledWith(mergeRequestsStateSvc.selected);
            expect(utilSvc.createWarningToast).not.toHaveBeenCalled();
            expect(mergeRequestsStateSvc.selected).toBeDefined();
        });
        it('rejects', function() {
            this.getDefer.reject();
            scope.$apply();
            expect(mergeRequestsStateSvc.setRequestDetails).not.toHaveBeenCalled();
            expect(utilSvc.createWarningToast).toHaveBeenCalled();
            expect(mergeRequestsStateSvc.selected).toBeUndefined();
        });
    });
    describe('controller methods', function() {
        it('should go back', function() {
            this.controller.back();
            expect(mergeRequestsStateSvc.selected).toBeUndefined();
        });
        it('show the delete overlay', function() {
            this.controller.showDelete();
            expect(mergeRequestsStateSvc.requestToDelete).toEqual(mergeRequestsStateSvc.selected);
            expect(mergeRequestsStateSvc.showDelete).toEqual(true);
        });
        it('show the accept overlay', function() {
            this.controller.showAccept();
            expect(mergeRequestsStateSvc.requestToAccept).toEqual(mergeRequestsStateSvc.selected);
            expect(mergeRequestsStateSvc.showAccept).toEqual(true);
        });
        it('show the conflict resolution form', function() {
            mergeRequestsStateSvc.selected.conflicts = [{}];
            this.controller.showResolutionForm();
            expect(this.controller.resolveConflicts).toEqual(true);
            expect(this.controller.copiedConflicts).toEqual([{resolved: false}]);
            expect(this.controller.resolveError).toEqual(false);
        });
        describe('should resolve conflicts in the request', function() {
            beforeEach(function() {
                this.selectedLeft = {resolved: 'left', right: {additions: ['add-right'], deletions: ['del-right']}};
                this.selectedRight = {resolved: 'right', left: {additions: ['add-left'], deletions: ['del-left']}};
                this.controller.copiedConflicts = [this.selectedLeft, this.selectedRight];
                this.expectedResolutions = {
                    additions: [],
                    deletions: ['add-right', 'add-left']
                };
                this.controller.resolveConflicts = true;
            });
            it('if resolveRequestConflicts resolves', function() {
                this.controller.resolve();
                scope.$apply();
                expect(mergeRequestsStateSvc.resolveRequestConflicts).toHaveBeenCalledWith(mergeRequestsStateSvc.selected, this.expectedResolutions);
                expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                expect(this.controller.resolveConflicts).toEqual(false);
                expect(this.controller.copiedConflicts).toEqual([]);
                expect(this.controller.resolveError).toEqual(false);
            });
            it('unless resolveRequestConflicts rejects', function() {
                mergeRequestsStateSvc.resolveRequestConflicts.and.returnValue($q.reject('Error'));
                this.controller.resolve();
                scope.$apply();
                expect(mergeRequestsStateSvc.resolveRequestConflicts).toHaveBeenCalledWith(mergeRequestsStateSvc.selected, this.expectedResolutions);
                expect(utilSvc.createSuccessToast).not.toHaveBeenCalled();
                expect(this.controller.resolveConflicts).toEqual(true);
                expect(this.controller.copiedConflicts).toEqual([this.selectedLeft, this.selectedRight]);
                expect(this.controller.resolveError).toEqual(true);
            });
        });
        it('should cancel resolving conflicts', function() {
            this.controller.resolveConflicts = true;
            this.controller.copiedConflicts = [{}];
            this.controller.resolveError = true;
            this.controller.cancelResolve();
            expect(this.controller.resolveConflicts).toEqual(false);
            expect(this.controller.copiedConflicts).toEqual([]);
            expect(this.controller.resolveError).toEqual(false);
        });
        it('should test whether all conflicts are resolved', function() {
            expect(this.controller.allResolved()).toEqual(true);

            this.controller.copiedConflicts = [{resolved: true}];
            expect(this.controller.allResolved()).toEqual(true);

            this.controller.copiedConflicts = [{resolved: false}];
            expect(this.controller.allResolved()).toEqual(false);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('merge-request-view')).toEqual(true);
            expect(this.element.querySelectorAll('.main-details').length).toEqual(1);
        });
        it('with a block', function() {
            expect(this.element.find('block').length).toEqual(1);
        });
        it('with a block-content', function() {
            expect(this.element.find('block-content').length).toEqual(1);
        });
        it('with a block-footer', function() {
            expect(this.element.find('block-footer').length).toEqual(1);
        });
        describe('when conflicts are', function() {
            describe('being resolved', function() {
                beforeEach(function() {
                    this.controller.resolveConflicts = true;
                    scope.$digest();
                });
                it('for wrapping containers', function() {
                    expect(this.element.querySelectorAll('block-content .resolve-conflicts').length).toEqual(1);
                    expect(this.element.querySelectorAll('block-footer .conflicts-buttons').length).toEqual(1);
                });
                it('with a button to Resolve', function() {
                    var button = this.element.querySelectorAll('block-footer button.btn-primary');
                    expect(button.length).toEqual(1);
                    expect(button.text().trim()).toContain('Resolve');
                });
                it('with a button to Cancel', function() {
                    var button = this.element.querySelectorAll('block-footer button:not(.btn-primary)');
                    expect(button.length).toEqual(1);
                    expect(button.text().trim()).toContain('Cancel');
                });
                it('depending on whether all the conflicts are resolved', function() {
                    spyOn(this.controller, 'allResolved').and.returnValue(false);
                    scope.$digest();
                    var button = angular.element(this.element.querySelectorAll('block-footer .btn-primary')[0]);
                    expect(button.attr('disabled')).toBeTruthy();

                    this.controller.allResolved.and.returnValue(true);
                    scope.$digest();
                    expect(button.attr('disabled')).toBeFalsy();
                });
                it('depending on whether an error occurred', function() {
                    expect(this.element.find('error-display').length).toEqual(0);

                    this.controller.resolveError = true;
                    scope.$digest();
                    expect(this.element.find('error-display').length).toEqual(1);
                });
            });
            describe('not being resolved', function() {
                it('for wrapping containers', function() {
                    expect(this.element.querySelectorAll('block-content .view').length).toEqual(1);
                    expect(this.element.querySelectorAll('block-footer .view-buttons').length).toEqual(1);
                });
                it('with a commit-difference-tabset', function() {
                    expect(this.element.find('commit-difference-tabset').length).toEqual(1);
                });
                it('with a button to Delete', function() {
                    var button = this.element.querySelectorAll('block-footer button.btn-danger');
                    expect(button.length).toEqual(1);
                    expect(button.text().trim()).toContain('Delete');
                });
                it('with a button to go Back', function() {
                    var button = this.element.querySelectorAll('block-footer button:not(.btn-primary):not(.btn-danger)');
                    expect(button.length).toEqual(1);
                    expect(button.text().trim()).toContain('Back');
                });
                it('depending on whether the merge request is accepted', function() {
                    expect(this.element.querySelectorAll('block-footer button.btn-primary').length).toEqual(1);

                    mergeRequestManagerSvc.isAccepted.and.returnValue(true);
                    scope.$digest();
                    expect(this.element.querySelectorAll('block-footer button.btn-primary').length).toEqual(0);
                });
                it('depending on whether the merge request has merge conflicts', function() {
                    mergeRequestsStateSvc.selected.targetTitle = 'targetBranch';
                    scope.$digest();
                    expect(angular.element(this.element.querySelectorAll('.alert')).length).toEqual(0);
                    mergeRequestsStateSvc.selected.conflicts = [{}];
                    scope.$digest();
                    var indicator = angular.element(this.element.querySelectorAll('.alert')[0]);
                    expect(indicator.hasClass('alert-warning')).toEqual(true);
                    expect(indicator.text().trim()).toContain('This request has conflicts. You can resolve them right now or during the merge process.');
                });
                it('depending on whether the merge request has does not have a target branch set', function() {
                    mergeRequestsStateSvc.selected.targetTitle = 'targetBranch';
                    scope.$digest();
                    expect(angular.element(this.element.querySelectorAll('.alert')).length).toEqual(0);
                    mergeRequestsStateSvc.selected.targetTitle = '';
                    scope.$digest();
                    var indicator = angular.element(this.element.querySelectorAll('.alert')[0]);
                    expect(indicator.hasClass('alert-warning')).toEqual(true);
                    expect(indicator.text().trim()).toContain('The target branch for this merge request has been deleted.');
                });
            });
        });
        it('depending on how many assignees the request has', function() {
            mergeRequestsStateSvc.selected.assignees = ['user1', 'user2'];
            scope.$digest();
            expect(this.element.querySelectorAll('.assignees li').length).toEqual(2);
        });
        it('depending on if the source branch is to be removed', function() {
            mergeRequestsStateSvc.selected.removeSource = true;
            scope.$digest();
            expect(this.element.querySelectorAll('checkbox').length).toEqual(1);
        });
        it('depending on whether the merge request is accepted', function() {
            var indicator = angular.element(this.element.querySelectorAll('.open-indicator')[0]);
            expect(indicator.hasClass('badge-primary')).toEqual(true);
            expect(indicator.hasClass('badge-success')).toEqual(false);
            expect(indicator.text().trim()).toEqual('Open');

            mergeRequestManagerSvc.isAccepted.and.returnValue(true);
            scope.$digest();
            expect(indicator.hasClass('badge-primary')).toEqual(false);
            expect(indicator.hasClass('badge-success')).toEqual(true);
            expect(indicator.text().trim()).toEqual('Accepted');
        });
    });
    it('should call showResolutionForm when the resolve button is clicked in the alert', function() {
        mergeRequestsStateSvc.selected.conflicts = [{}];
        scope.$digest();
        spyOn(this.controller, 'showResolutionForm');
        var button = angular.element(this.element.querySelectorAll('.alert button')[0]);
        button.triggerHandler('click');
        expect(this.controller.showResolutionForm).toHaveBeenCalled();
    });
    it('should call showDelete when the delete button is clicked', function() {
        spyOn(this.controller, 'showDelete');
        var button = angular.element(this.element.querySelectorAll('block-footer button.btn-danger')[0]);
        button.triggerHandler('click');
        expect(this.controller.showDelete).toHaveBeenCalled();
    });
    it('should call showAccept when the accept button is clicked', function() {
        spyOn(this.controller, 'showAccept');
        var button = angular.element(this.element.querySelectorAll('block-footer button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(this.controller.showAccept).toHaveBeenCalled();
    });
    it('should call back when the button is clicked', function() {
        spyOn(this.controller, 'back');
        var button = angular.element(this.element.querySelectorAll('block-footer button:not(.btn-danger):not(.btn-primary)')[0]);
        button.triggerHandler('click');
        expect(this.controller.back).toHaveBeenCalled();
    });
    it('should call cancelResolve when the cancel button is clicked', function() {
        this.controller.resolveConflicts = true;
        scope.$digest();
        spyOn(this.controller, 'cancelResolve');
        var button = angular.element(this.element.querySelectorAll('block-footer button:not(.btn-primary)')[0]);
        button.triggerHandler('click');
        expect(this.controller.cancelResolve).toHaveBeenCalled();
    });
    it('should call resolve when the button is clicked', function() {
        this.controller.resolveConflicts = true;
        scope.$digest();
        spyOn(this.controller, 'resolve');
        var button = angular.element(this.element.querySelectorAll('block-footer button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(this.controller.resolve).toHaveBeenCalled();
    });
});

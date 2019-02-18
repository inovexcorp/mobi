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
describe('Create Request directive', function() {
    var $compile, scope, $q, mergeRequestsStateSvc, mergeRequestManagerSvc, utilSvc;

    beforeEach(function() {
        module('templates');
        module('createRequest');
        mockMergeRequestsState();
        mockMergeRequestManager();
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _$q_, _mergeRequestsStateService_, _mergeRequestManagerService_, _utilService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            mergeRequestsStateSvc = _mergeRequestsStateService_;
            mergeRequestManagerSvc = _mergeRequestManagerService_;
            utilSvc = _utilService_;
        });

        this.element = $compile(angular.element('<create-request></create-request>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('createRequest');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        mergeRequestsStateSvc = null;
        mergeRequestManagerSvc = null;
        utilSvc = null;
        this.element.remove();
    });

    describe('controller methods', function() {
        beforeEach(function() {
            mergeRequestsStateSvc.createRequest = true;
        });
        describe('should go to the next step', function() {
            it('successfully', function() {
                this.original = mergeRequestsStateSvc.createRequestStep;
                this.controller.next();
                expect(mergeRequestsStateSvc.createRequestStep).toEqual(this.original + 1);
                expect(mergeRequestManagerSvc.createRequest).not.toHaveBeenCalled();
            });
            describe('unless it is the last step and createRequest', function() {
                beforeEach(function() {
                    mergeRequestsStateSvc.createRequestStep = 2;
                    this.original = mergeRequestsStateSvc.createRequestStep;
                });
                it('resolves', function() {
                    mergeRequestManagerSvc.createRequest.and.returnValue($q.when());
                    this.controller.next();
                    scope.$apply();
                    expect(mergeRequestsStateSvc.createRequestStep).toEqual(this.original);
                    expect(mergeRequestManagerSvc.createRequest).toHaveBeenCalledWith(mergeRequestsStateSvc.requestConfig);
                    expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                    expect(mergeRequestsStateSvc.createRequest).toEqual(false);
                    expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                });
                it('rejects', function() {
                    mergeRequestManagerSvc.createRequest.and.returnValue($q.reject('Error Message'));
                    this.controller.next();
                    scope.$apply();
                    expect(mergeRequestsStateSvc.createRequestStep).toEqual(this.original);
                    expect(mergeRequestManagerSvc.createRequest).toHaveBeenCalledWith(mergeRequestsStateSvc.requestConfig);
                    expect(utilSvc.createSuccessToast).not.toHaveBeenCalled();
                    expect(mergeRequestsStateSvc.createRequest).toEqual(true);
                    expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error Message');
                });
            });
        });
        describe('should go to the previous state', function() {
            describe('if the step is', function() {
                beforeEach(function() {
                    mergeRequestsStateSvc.requestConfig = {
                        title: 'title',
                        description: 'description',
                        sourceBranchId: 'sourceBranchId',
                        sourceBranch: {},
                        targetBranchId: 'targetBranchId',
                        targetBranch: {},
                        difference: {},
                        assignees: ['user'],
                        removeSource: true
                    };
                });
                it('1', function() {
                    mergeRequestsStateSvc.createRequestStep = 1;
                    this.controller.back();
                    expect(mergeRequestsStateSvc.createRequestStep).toEqual(0);
                    expect(mergeRequestsStateSvc.createRequest).toEqual(true);
                    expect(mergeRequestsStateSvc.requestConfig.sourceBranchId).toEqual('');
                    expect(mergeRequestsStateSvc.requestConfig.targetBranchId).toEqual('');
                    expect(_.has(mergeRequestsStateSvc.requestConfig, 'sourceBranch')).toEqual(false);
                    expect(_.has(mergeRequestsStateSvc.requestConfig, 'targetBranch')).toEqual(false);
                    expect(_.has(mergeRequestsStateSvc.requestConfig, 'difference')).toEqual(false);
                    expect(_.has(mergeRequestsStateSvc.requestConfig, 'removeSource')).toEqual(false);
                });
                it('2', function() {
                    mergeRequestsStateSvc.createRequestStep = 2;
                    this.controller.back();
                    expect(mergeRequestsStateSvc.createRequestStep).toEqual(1);
                    expect(mergeRequestsStateSvc.createRequest).toEqual(true);
                    expect(mergeRequestsStateSvc.requestConfig.title).toEqual('');
                    expect(mergeRequestsStateSvc.requestConfig.description).toEqual('');
                    expect(mergeRequestsStateSvc.requestConfig.assignees).toEqual([]);
                });
            });
            it('unless it is the first step', function() {
                this.originalConfig = angular.copy(mergeRequestsStateSvc.requestConfig);
                this.controller.back();
                expect(mergeRequestsStateSvc.createRequestStep).toEqual(0);
                expect(mergeRequestsStateSvc.createRequest).toEqual(false);
                expect(mergeRequestsStateSvc.requestConfig).toEqual(this.originalConfig);
            });
        });
        describe('should determine whether the next button should be disabled if the step is', function() {
            it('0', function() {
                expect(this.controller.isDisabled()).toEqual(true);
                mergeRequestsStateSvc.requestConfig.recordId = 'record';
                expect(this.controller.isDisabled()).toEqual(false);
            });
            it('1', function() {
                mergeRequestsStateSvc.createRequestStep = 1;
                expect(this.controller.isDisabled()).toEqual(true);
                mergeRequestsStateSvc.requestConfig.sourceBranchId = 'branch';
                expect(this.controller.isDisabled()).toEqual(true);
                mergeRequestsStateSvc.requestConfig.targetBranchId = 'branch';
                expect(this.controller.isDisabled()).toEqual(false);
            });
            it('2', function() {
                mergeRequestsStateSvc.createRequestStep = 2;
                expect(this.controller.isDisabled()).toEqual(true);
                mergeRequestsStateSvc.requestConfig.title = 'title';
                expect(this.controller.isDisabled()).toEqual(false);
            });
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('create-request')).toEqual(true);
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
        it('with a step-progress-bar', function() {
            expect(this.element.find('step-progress-bar').length).toEqual(1);
        });
        it('with two buttons', function() {
            var buttons = this.element.querySelectorAll('block-footer button');
            expect(buttons.length).toEqual(2);
        });
        it('depending on the create request step', function() {
            var defaultButton = angular.element(this.element.querySelectorAll('block-footer button:not(.btn-primary)')[0]);
            var primaryButton = angular.element(this.element.querySelectorAll('block-footer button.btn-primary')[0]);
            expect(this.element.find('request-record-select').length).toEqual(1);
            expect(this.element.find('request-branch-select').length).toEqual(0);
            expect(this.element.find('request-details-form').length).toEqual(0);
            expect(defaultButton.text().trim()).toEqual('Cancel');
            expect(primaryButton.text().trim()).toEqual('Next');

            mergeRequestsStateSvc.createRequestStep = 1;
            scope.$digest();
            expect(this.element.find('request-record-select').length).toEqual(0);
            expect(this.element.find('request-branch-select').length).toEqual(1);
            expect(this.element.find('request-details-form').length).toEqual(0);
            expect(defaultButton.text().trim()).toEqual('Back');
            expect(primaryButton.text().trim()).toEqual('Next');

            mergeRequestsStateSvc.createRequestStep = 2;
            scope.$digest();
            expect(this.element.find('request-record-select').length).toEqual(0);
            expect(this.element.find('request-branch-select').length).toEqual(0);
            expect(this.element.find('request-details-form').length).toEqual(1);
            expect(defaultButton.text().trim()).toEqual('Back');
            expect(primaryButton.text().trim()).toEqual('Submit');
        });
        it('depending on whether the next step can be taken', function() {
            spyOn(this.controller, 'isDisabled').and.returnValue(false);
            scope.$digest();
            var button = angular.element(this.element.querySelectorAll('block-footer button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeFalsy();

            this.controller.isDisabled.and.returnValue(true);
            scope.$digest();
            expect(button.attr('disabled')).toBeTruthy();
        });
    });
    it('should call back when the default button is clicked', function() {
        spyOn(this.controller, 'back');
        var button = angular.element(this.element.querySelectorAll('block-footer button:not(.btn-primary)')[0]);
        button.triggerHandler('click');
        expect(this.controller.back).toHaveBeenCalled();
    });
    it('should call next when the default button is clicked', function() {
        spyOn(this.controller, 'next');
        var button = angular.element(this.element.querySelectorAll('block-footer button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(this.controller.next).toHaveBeenCalled();
    });
});

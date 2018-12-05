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
describe('Record Access Overlay directive', function() {
    var $compile, scope, $q, utilSvc, userManagerSvc, recordPermissionsManagerSvc;

    beforeEach(function() {
        module('templates');
        module('recordAccessOverlay');
        mockUserManager();
        mockRecordPermissionsManager();
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _$q_, _utilService_, _userManagerService_, _recordPermissionsManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            utilSvc = _utilService_;
            userManagerSvc = _userManagerService_;
            recordPermissionsManagerSvc = _recordPermissionsManagerService_;
        });

        this.recordId = 'urn:resource';
        userManagerSvc.users = [{iri: 'user1', username: 'user1'}, {iri: 'user2', username: 'user2'}];
        userManagerSvc.groups = [{iri: 'group1', title: 'group1'}, {iri: 'group2', title: 'group2'}];
        this.getPolicyDefer = $q.defer();
        recordPermissionsManagerSvc.getRecordPolicy.and.returnValue(this.getPolicyDefer.promise);

        scope.resolve = {
            resource: this.recordId,
            ruleId: 'urn:read'
        };
        scope.close = jasmine.createSpy('close');
        scope.dismiss = jasmine.createSpy('dismiss');
        this.element = $compile(angular.element('<record-access-overlay resolve="resolve" close="close()" dismiss="dismiss()"></record-access-overlay>'))(scope);
        scope.$digest();
        this.isolatedScope = this.element.isolateScope();
        this.controller = this.element.controller('recordAccessOverlay');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        utilSvc = null;
        userManagerSvc = null;
        recordPermissionsManagerSvc = null;
        this.element.remove();
    });

    describe('initializes policy correctly when getRecordPolicy', function() {
        describe('resolves', function() {
            beforeEach(function() {
                this.typePolicy = {
                    'urn:read': {
                        everyone: true,
                        users: [],
                        groups: []
                    }
                };
            });
            it('with a policy rule that allows everyone', function() {
                var policy = angular.copy(this.typePolicy);
                this.getPolicyDefer.resolve(policy);
                scope.$apply();
                expect(this.controller.policy).toEqual({
                    policy: this.typePolicy,
                    id: this.recordId,
                    changed: false,
                    everyone: true,
                    users: userManagerSvc.users,
                    groups: userManagerSvc.groups,
                    selectedUsers: [],
                    selectedGroups: [],
                    userSearchText: '',
                    groupSearchText: '',
                    selectedUser: undefined,
                    selectedGroup: undefined
                });
            });
            it('with a policy rule that has selected users', function() {
                var policy = angular.copy(this.typePolicy);
                _.set(policy, 'urn:read.everyone', false);
                _.set(policy, 'urn:read.users', ['user1']);
                this.getPolicyDefer.resolve(policy);
                scope.$apply();
                expect(this.controller.policy).toEqual({
                    policy: policy,
                    id: this.recordId,
                    changed: false,
                    everyone: false,
                    users: _.reject(userManagerSvc.users, {iri: 'user1', username: 'user1'}),
                    groups: userManagerSvc.groups,
                    selectedUsers: [{iri: 'user1', username: 'user1'}],
                    selectedGroups: [],
                    userSearchText: '',
                    groupSearchText: '',
                    selectedUser: undefined,
                    selectedGroup: undefined
                });
            });
            it('with a policy that has selected groups', function() {
                var policy = angular.copy(this.typePolicy);
                _.set(policy, 'urn:read.everyone', false);
                _.set(policy, 'urn:read.groups', ['group1']);
                this.getPolicyDefer.resolve(policy);
                scope.$apply();
                expect(this.controller.policy).toEqual({
                    policy: policy,
                    id: this.recordId,
                    changed: false,
                    everyone: false,
                    users: userManagerSvc.users,
                    groups: _.reject(userManagerSvc.groups, {iri: 'group1', title: 'group1'}),
                    selectedUsers: [],
                    selectedGroups: [{iri: 'group1', title: 'group1'}],
                    userSearchText: '',
                    groupSearchText: '',
                    selectedUser: undefined,
                    selectedGroup: undefined
                });
            });
        });
        it('rejects', function() {
            this.getPolicyDefer.reject('Error Message');
            scope.$apply();
            expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error Message');
        });
    });
    describe('controller methods', function() {
        describe('should save changes to the policy', function() {
            beforeEach(function() {
                this.policy = {
                    'urn:read': {
                        everyone: true,
                        users: [],
                        groups: []
                    }
                };
                this.item = {
                    changed: true,
                    users: userManagerSvc.users,
                    groups: userManagerSvc.groups,
                    selectedUsers: [],
                    selectedGroups: [],
                    everyone: false,
                    policy: this.policy
                };
            });
            it('successfully', function() {
                this.controller.policy = this.item;
                this.controller.save(this.recordId);
                scope.$apply();
                expect(recordPermissionsManagerSvc.updateRecordPolicy).toHaveBeenCalledWith(this.recordId, this.policy);
                expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                expect(this.item.changed).toEqual(false);
                expect(scope.close).toHaveBeenCalled();
            });
            it('unless an error occurs', function() {
                this.controller.policy = this.item;
                recordPermissionsManagerSvc.updateRecordPolicy.and.returnValue($q.reject('Error'));
                this.controller.save(this.recordId);
                scope.$apply();
                expect(recordPermissionsManagerSvc.updateRecordPolicy).toHaveBeenCalledWith(this.recordId, this.policy);
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error');
                expect(utilSvc.createSuccessToast).not.toHaveBeenCalled();
                expect(this.item.changed).toEqual(true);
                expect(scope.close).not.toHaveBeenCalled();
            });
            describe('should save changes to the policy', function() {
                beforeEach(function() {
                    this.policy = {
                        'urn:read': {
                            everyone: true,
                            users: [],
                            groups: []
                        }
                    };
                    this.item = {
                        changed: false,
                        users: userManagerSvc.users,
                        groups: userManagerSvc.groups,
                        selectedUsers: [],
                        selectedGroups: [],
                        everyone: true,
                        policy: this.policy
                    };
                });
                it('no changes were made', function() {
                    this.controller.policy = this.item;
                    this.controller.save(this.recordId);
                    scope.$apply();
                    expect(recordPermissionsManagerSvc.updateRecordPolicy).not.toHaveBeenCalledWith(this.recordId, this.policy);
                    expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                    expect(utilSvc.createSuccessToast).not.toHaveBeenCalled();
                    expect(this.item.changed).toEqual(false);
                    expect(scope.close).toHaveBeenCalled();
                });
            });
        });
        it('should cancel the overlay', function() {
            this.controller.cancel();
            expect(scope.dismiss).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('RECORD-ACCESS-OVERLAY');
            expect(this.element.querySelectorAll('.modal-header').length).toBe(1);
            expect(this.element.querySelectorAll('.modal-body').length).toBe(1);
            expect(this.element.querySelectorAll('.modal-footer').length).toBe(1);
        });
        it('with a form', function() {
            expect(this.element.find('form').length).toBe(1);
        });
        it('with a h3', function() {
            expect(this.element.find('h3').length).toBe(1);
        });
        it('with a user-access-controls', function() {
            expect(this.element.find('user-access-controls').length).toBe(1);
        });
        it('with buttons to submit and cancel', function() {
            var buttons = this.element.querySelectorAll('.modal-footer button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Submit'].indexOf(angular.element(buttons[0]).text()) >= 0).toBe(true);
            expect(['Cancel', 'Submit'].indexOf(angular.element(buttons[1]).text()) >= 0).toBe(true);
        });
    });
    it('should call save when the submit button is clicked', function() {
        spyOn(this.controller, 'save');
        var button = angular.element(this.element.querySelectorAll('.modal-footer button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(this.controller.save).toHaveBeenCalledWith(this.recordId);
    });
    it('should call cancel when the button is clicked', function() {
        spyOn(this.controller, 'cancel');
        var button = angular.element(this.element.querySelectorAll('.modal-footer button:not(.btn-primary)')[0]);
        button.triggerHandler('click');
        expect(this.controller.cancel).toHaveBeenCalled();
    });
});
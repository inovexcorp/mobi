/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import { forEach } from 'lodash';

import {
    mockComponent,
    mockCatalogState,
    mockUtil,
    mockUserManager,
    mockRecordPermissionsManager
} from '../../../../../../test/js/Shared';

describe('Record Permission View component', function() {
    var $compile, scope, $q, catalogStateSvc, utilSvc, userManagerSvc, recordPermissionsManagerSvc;

    beforeEach(function() {
        angular.mock.module('catalog');
        mockComponent('shared', 'userAccessControls');
        mockCatalogState();
        mockUtil();
        mockUserManager();
        mockRecordPermissionsManager();

        inject(function(_$compile_, _$rootScope_, _$q_, _catalogStateService_, _utilService_, _userManagerService_, _recordPermissionsManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            catalogStateSvc = _catalogStateService_;
            utilSvc = _utilService_;
            userManagerSvc = _userManagerService_;
            recordPermissionsManagerSvc = _recordPermissionsManagerService_;
        });
        userManagerSvc.users = [
            {
                iri: 'http://mobi.com/users/admin',
                username: 'batman'
            }
        ];
        userManagerSvc.groups = [
            {
                iri: 'http://mobi.com/groups/admin',
                title: 'Superheroes'
            }
        ];
        this.recordId = 'urn:resource';
        this.getPolicyDefer = $q.defer();
        recordPermissionsManagerSvc.getRecordPolicy.and.returnValue(this.getPolicyDefer.promise);
        catalogStateSvc.selectedRecord = {
            '@id' : this.recordId,
            'http://purl.org/dc/terms/title' : [ {
                '@value' : 'title.ttl'
            } ]
        } 
        utilSvc.getDctermsValue = jasmine.createSpy('getDctermsValue').and.returnValue('title.ttl');

        catalogStateSvc.editPermissionSelectedRecord = true;
        this.element = $compile(angular.element('<record-permission-view></record-permission-view>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('recordPermissionView');

        this.typePolicy = {
            'urn:read': {
              'everyone': true,
              'users': [],
              'groups': []
            },
            'urn:delete': {
              'everyone': false,
              'users': [
                'http://mobi.com/users/admin'
              ],
              'groups': [
                  'http://mobi.com/groups/admin'
               ]
            },
            'urn:update': {
              'everyone': false,
              'users': [
                'http://mobi.com/users/admin'
              ],
              'groups': []
            },
            'urn:modify': {
              'everyone': true,
              'users': [],
              'groups': []
            },
            'urn:modifyMaster': {
              'everyone': false,
              'users': [
                'http://mobi.com/users/admin'
              ],
              'groups': []
            }
        };
        this.policiesItems = [
            {
                'policy': {},
                'id': 'urn:read',
                'changed': false,
                'everyone': true,
                'selectedUsers': [],
                'selectedGroups': [],
                'title': 'View Record'
            },
            {
                'policy': {},
                'id': 'urn:delete',
                'changed': false,
                'everyone': false,
                'selectedUsers': [
                    {
                        'iri': 'http://mobi.com/users/admin',
                        'username': 'batman'
                    }
                ],
                'selectedGroups': [
                    {
                        'iri': 'http://mobi.com/groups/admin',
                        'title': 'Superheroes'
                    }
                ],
                'title': 'Delete Record'
            },
            {
                'policy': {},
                'id': 'urn:update',
                'changed': false,
                'everyone': false,
                'selectedUsers': [
                    {
                        'iri': 'http://mobi.com/users/admin',
                        'username': 'batman'
                    }
                ],
                'selectedGroups': [],
                'title': 'Manage Record'
            },
            {
                'policy': {},
                'id': 'urn:modify',
                'changed': false,
                'everyone': true,
                'selectedUsers': [],
                'selectedGroups': [],
                'title': 'Modify Record'
            },
            {
                'policy': {},
                'id': 'urn:modifyMaster',
                'changed': false,
                'everyone': false,
                'selectedUsers': [
                    {
                        'iri': 'http://mobi.com/users/admin',
                        'username': 'batman'
                    }
                ],
                'selectedGroups': [],
                'title': 'Modify Master Branch'
            }
        ];

    });
    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        catalogStateSvc = null;
        utilSvc = null;
        userManagerSvc = null;
        recordPermissionsManagerSvc = null;
        this.element.remove();
    });
    describe('initializes policy correctly when getRecordPolicy', function() {
        it('resolves with a policy rule', function() {
            const policy = angular.copy(this.typePolicy);
            this.getPolicyDefer.resolve(policy);
            scope.$digest();
            expect(angular.toJson(this.controller.policies)).toEqual(angular.toJson(this.policiesItems));
            expect(this.controller.title).toEqual('title.ttl');
        });
        it('rejects', function() {
            this.getPolicyDefer.reject('Error Message');
            scope.$digest();
            expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error Message');
        });
    });
    describe('controller methods', function() {
        describe('should save changes to the policy', function() {
            it('successfully with no changes', function() {
                this.controller.policies = this.policies;
                this.controller.save();
                scope.$apply();
                expect(recordPermissionsManagerSvc.updateRecordPolicy).not.toHaveBeenCalled();
                expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                expect(utilSvc.createSuccessToast).not.toHaveBeenCalled();
            });
            it('successfully with changes', function() {
                this.controller.recordId = this.recordId;
                this.controller.policies = this.policiesItems;
                forEach(this.controller.policies, policyItem => policyItem.changed = true);
                expect(this.controller.hasChanges()).toEqual(true);
                this.controller.save();
                scope.$apply();
                expect(recordPermissionsManagerSvc.updateRecordPolicy).toHaveBeenCalledWith(this.recordId, this.typePolicy);
                expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                expect(this.controller.hasChanges()).toEqual(false);
            });
        });
        describe('should go back', function() {
            it('successfully', function() {
                catalogStateSvc.editPermissionSelectedRecord = true;
                this.controller.goBack();
                scope.$apply();
                expect(catalogStateSvc.editPermissionSelectedRecord).toEqual(false);
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.querySelectorAll('.record-permission-view').length).toEqual(1);
            expect(this.element.querySelectorAll('.permissions-page').length).toEqual(1);
            expect(this.element.querySelectorAll('.save-container').length).toEqual(1);
            expect(this.element.querySelectorAll('.permissions-page h2').text()).toEqual('Manage title.ttl');
        });
    });
    it('should call save when the save button is clicked', function() {
        spyOn(this.controller, 'save');
        const button = angular.element(this.element.querySelectorAll('.record-permission-view .save-container .save-button')[0]);
        button.triggerHandler('click');
        expect(this.controller.save).toHaveBeenCalled();
    });
    it('should call save when the save button is clicked', function() {
        spyOn(this.controller, 'goBack');
        const button = angular.element(this.element.querySelectorAll('.record-permission-view .back-button')[0]);
        button.triggerHandler('click');
        expect(this.controller.goBack).toHaveBeenCalled();
    });
});

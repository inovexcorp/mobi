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
import {cloneDeep, forEach} from 'lodash';
import { DebugElement } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';

import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockProvider } from 'ng-mocks';

import { CatalogStateService } from '../../../shared/services/catalogState.service';
import { UserManagerService } from '../../../shared/services/userManager.service';
import { UserAccessControlsComponent } from '../../../shared/components/userAccessControls/userAccessControls.component';
import { RecordPermissionViewComponent } from './recordPermissionView.component';

import {
    mockUtil,
    mockRecordPermissionsManager,
    cleanStylesFromDOM
} from '../../../../../../test/ts/Shared';

import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";

describe('Record Permission View component', () => {
    let component: RecordPermissionViewComponent;
    let element: DebugElement;
    let nativeElement: HTMLElement ;
    let fixture: ComponentFixture<RecordPermissionViewComponent>;
    let catalogStateStub: jasmine.SpyObj<CatalogStateService>;
    let userManagerStub: jasmine.SpyObj<UserManagerService>;
    let utilStub;
    let recordPermissionsStub;
    let policyItemsArray = [];
    let policyRecordId;
    let typePolicy;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [
                MatButtonModule,
                MatTooltipModule
            ],
            declarations: [
                RecordPermissionViewComponent,
                MockComponent(UserAccessControlsComponent)
            ],
            providers: [
                MockProvider(UserManagerService),
                MockProvider(CatalogStateService),
                { provide: 'recordPermissionsManagerService', useClass: mockRecordPermissionsManager },
                { provide: 'utilService', useClass: mockUtil }
            ],
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(RecordPermissionViewComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        nativeElement = element.nativeElement;
        catalogStateStub = TestBed.get(CatalogStateService);
        userManagerStub = TestBed.get(UserManagerService);
        utilStub = TestBed.get('utilService');
        recordPermissionsStub = TestBed.get('recordPermissionsManagerService');

        userManagerStub.users = [
            {
                iri: 'http://mobi.com/users/admin',
                username: 'batman',
                firstName: '',
                lastName: '',
                email: '',
                roles: [],
                external: false
            }
        ];
        userManagerStub.groups = [
            {
                iri: 'http://mobi.com/groups/admin',
                title: 'Superheroes',
                description: '',
                roles: [],
                members: [],
                external: false
            }
        ];
        typePolicy = {
            'urn:read': {
                'everyone': true,
                'users': [],
                'groups': []
            },
            'urn:delete': {
                'everyone': false,
                'users': [
                    'http://mobi.com/users/admin',
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
        policyItemsArray = [
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
                        'username': 'batman',
                        'firstName': '',
                        'lastName': '',
                        'email': '',
                        'roles': [],
                        'external': false
                    }
                ],
                'selectedGroups': [
                    {
                        'iri': 'http://mobi.com/groups/admin',
                        'title': 'Superheroes',
                        'description': '',
                        'roles': [],
                        'members': [],
                        'external': false
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
                        'username': 'batman',
                        'firstName': '',
                        'lastName': '',
                        'email': '',
                        'roles': [],
                        'external': false
                    }
                ],
                'selectedGroups': [],
                'title': 'Manage Record',

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
                        'username': 'batman',
                        'firstName': '',
                        'lastName': '',
                        'email': '',
                        'roles': [],
                        'external': false
                    }
                ],
                'selectedGroups': [],
                'title': 'Modify Master Branch'
            }
        ];
        policyRecordId= 'urn:resource';
        recordPermissionsStub.getRecordPolicy.and.returnValue(Promise.resolve(cloneDeep(typePolicy)));
        catalogStateStub.selectedRecord = {
            '@id' : policyRecordId,
            'http://purl.org/dc/terms/title' : [ {
                '@value' : 'title.ttl'
            } ]
        }
        utilStub.getDctermsValue = jasmine.createSpy('getDctermsValue').and.returnValue('title.ttl');
        catalogStateStub.editPermissionSelectedRecord = true;

    });

    afterAll(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        utilStub = null;
        catalogStateStub = null;
        userManagerStub = null;
        recordPermissionsStub = null;
        let policyItemsArray = [];
        let policyRecordId = {};
        let typePolicy = null;
    });

   describe('initializes policy correctly when getRecordPolicy', function() {
        it('resolves with a policy rule', async function() {
            component.ngOnInit();
            fixture.detectChanges();
            await fixture.whenStable();
            expect(component.policies).toEqual(policyItemsArray);
            expect(component.title).toEqual('title.ttl');
        });
        it('rejects', async function() {
            recordPermissionsStub.getRecordPolicy.and.returnValue(Promise.reject('Error Message'));
            recordPermissionsStub.getRecordPolicy();
            component.ngOnInit();
            fixture.detectChanges();
            await fixture.whenStable();
            expect(utilStub.createErrorToast).toHaveBeenCalledWith('Error Message');
        });
   });
    describe(' methods', function() {
        describe('should save changes to the policy', function() {
            it('successfully with no changes', async () => {
                component.policies = this.policies;
                component.save();
                component.ngOnInit();
                fixture.detectChanges();
                await fixture.whenStable();
                expect(recordPermissionsStub.updateRecordPolicy).not.toHaveBeenCalled();
                expect(utilStub.createErrorToast).not.toHaveBeenCalled();
                expect(utilStub.createSuccessToast).not.toHaveBeenCalled();
            });
            it('successfully with changes', async function() {

                component.recordId = policyRecordId;
                component.policies = policyItemsArray;
                fixture.detectChanges();
                forEach(component.policies, policyItem => policyItem.changed = true);
                expect(component.hasChanges()).toEqual(true);
                component.save();
                fixture.detectChanges();
                await fixture.whenStable();
                expect(recordPermissionsStub.updateRecordPolicy).toHaveBeenCalledWith(policyRecordId, typePolicy);
                expect(utilStub.createErrorToast).not.toHaveBeenCalled();
                expect(utilStub.createSuccessToast).toHaveBeenCalled();
                expect(component.hasChanges()).toEqual(false);
            });
        });
        describe('should go back', function() {
            it('successfully', function() {
                catalogStateStub.editPermissionSelectedRecord = true;
                component.goBack();
                fixture.detectChanges();
                expect(catalogStateStub.editPermissionSelectedRecord).toEqual(false);
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', async () => {
            component.ngOnInit();
            fixture.detectChanges();
            await fixture.whenStable();
            expect(nativeElement.querySelectorAll('.record-permission-view').length).toEqual(1);
            expect(nativeElement.querySelectorAll('.permissions-page').length).toEqual(1);
            expect(nativeElement.querySelectorAll('.save-container').length).toEqual(1);
            expect(nativeElement.querySelector('.permissions-page h2').textContent).toEqual('Manage title.ttl');
        });
    });
    it('should call save when the save button is clicked', function() {
        spyOn(component, 'save');
        const button = nativeElement.querySelectorAll('.record-permission-view .save-container .save-button')[0] as HTMLElement;
        button.click();
        expect(component.save).toHaveBeenCalled();
    });
    it('should call goBack when the back button is clicked',  () => {
        spyOn(component, 'goBack');
        component.ngOnInit();
        fixture.detectChanges();
        const button = nativeElement.querySelectorAll('.record-permission-view .back-column .back-button')[0] as HTMLElement;
        button.click();
        expect(component.goBack).toHaveBeenCalled();
    });
});

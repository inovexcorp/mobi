/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
import { cloneDeep, forEach } from 'lodash';
import { DebugElement } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import {
    cleanStylesFromDOM
} from '../../../../../public/test/ts/Shared';
import { CatalogStateService } from '../../../shared/services/catalogState.service';
import { UserManagerService } from '../../../shared/services/userManager.service';
import { UserAccessControlsComponent } from '../../../shared/components/userAccessControls/userAccessControls.component';
import { ToastService } from '../../../shared/services/toast.service';
import { RecordPermissionsManagerService } from '../../../shared/services/recordPermissionsManager.service';
import { Policy } from '../../../shared/models/policy.interface';
import { DCTERMS, USER } from '../../../prefixes';
import { User } from '../../../shared/models/user.class';
import { Group } from '../../../shared/models/group.interface';
import { RecordPermissionViewComponent } from './recordPermissionView.component';

describe('Record Permission View component', () => {
    let component: RecordPermissionViewComponent;
    let element: DebugElement;
    let nativeElement: HTMLElement ;
    let fixture: ComponentFixture<RecordPermissionViewComponent>;
    let catalogStateStub: jasmine.SpyObj<CatalogStateService>;
    let userManagerStub: jasmine.SpyObj<UserManagerService>;
    let toastStub: jasmine.SpyObj<ToastService>;
    let recordPermissionsStub: jasmine.SpyObj<RecordPermissionsManagerService>;
    let policyItemsArray: Policy[] = [];
    let policyRecordId;
    let typePolicy;

    const user: User = new User({
        '@id': 'http://mobi.com/users/admin',
        '@type': [`${USER}User`],
        [`${USER}username`]: [{ '@value': 'batman' }],
    });
    const group: Group = {
        iri: 'http://mobi.com/groups/admin',
        title: 'Superheroes',
        description: '',
        roles: [],
        members: [],
        external: false
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
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
                MockProvider(RecordPermissionsManagerService),
                MockProvider(ToastService)
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(RecordPermissionViewComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        nativeElement = element.nativeElement;
        catalogStateStub = TestBed.inject(CatalogStateService) as jasmine.SpyObj<CatalogStateService>;
        userManagerStub = TestBed.inject(UserManagerService) as jasmine.SpyObj<UserManagerService>;
        toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
        recordPermissionsStub = TestBed.inject(RecordPermissionsManagerService) as jasmine.SpyObj<RecordPermissionsManagerService>;

        userManagerStub.users = [user];
        userManagerStub.groups = [group];
        typePolicy = {
            'urn:read': {
                everyone: true,
                users: [],
                groups: []
            },
            'urn:delete': {
                everyone: false,
                users: [
                    'http://mobi.com/users/admin',
                ],
                groups: [
                    'http://mobi.com/groups/admin'
                ]
            },
            'urn:update': {
                everyone: false,
                users: [
                    'http://mobi.com/users/admin'
                ],
                groups: []
            },
            'urn:modify': {
                everyone: true,
                users: [],
                groups: []
            },
            'urn:modifyMaster': {
                everyone: false,
                users: [
                    'http://mobi.com/users/admin'
                ],
                groups: []
            }
        };
        policyItemsArray = [
            {
                policy: {},
                id: 'urn:read',
                changed: false,
                everyone: true,
                selectedUsers: [],
                selectedGroups: [],
                title: 'View Record'
            },
            {
                policy: {},
                id: 'urn:delete',
                changed: false,
                everyone: false,
                selectedUsers: [user],
                selectedGroups: [group],
                title: 'Delete Record'
            },
            {
                policy: {},
                id: 'urn:update',
                changed: false,
                everyone: false,
                selectedUsers: [user],
                selectedGroups: [],
                title: 'Manage Record',
            },
            {
                policy: {},
                id: 'urn:modify',
                changed: false,
                everyone: true,
                selectedUsers: [],
                selectedGroups: [],
                title: 'Modify Record'
            },
            {
                policy: {},
                id: 'urn:modifyMaster',
                changed: false,
                everyone: false,
                selectedUsers: [user],
                selectedGroups: [],
                title: 'Modify Master Branch'
            }
        ];
        policyRecordId= 'urn:resource';
        recordPermissionsStub.getRecordPolicy.and.returnValue(of(cloneDeep(typePolicy)));
        catalogStateStub.selectedRecord = {
            '@id': policyRecordId,
            [`${DCTERMS}title`]: [ {
                '@value': 'title.ttl'
            } ]
        };
        catalogStateStub.editPermissionSelectedRecord = true;
    });

    afterAll(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        toastStub = null;
        catalogStateStub = null;
        userManagerStub = null;
        recordPermissionsStub = null;
        policyItemsArray = [];
        policyRecordId = {};
        typePolicy = null;
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
            recordPermissionsStub.getRecordPolicy.and.returnValue(throwError('Error Message'));
            recordPermissionsStub.getRecordPolicy('');
            component.ngOnInit();
            fixture.detectChanges();
            await fixture.whenStable();
            expect(toastStub.createErrorToast).toHaveBeenCalledWith('Error Message');
        });
   });
    describe(' methods', function() {
        describe('should save changes to the policy', function() {
            it('successfully with no changes', async () => {
                component.policies = [];
                component.save();
                component.ngOnInit();
                fixture.detectChanges();
                await fixture.whenStable();
                expect(recordPermissionsStub.updateRecordPolicy).not.toHaveBeenCalled();
                expect(toastStub.createErrorToast).not.toHaveBeenCalled();
                expect(toastStub.createSuccessToast).not.toHaveBeenCalled();
            });
            it('successfully with changes', async function() {
                recordPermissionsStub.updateRecordPolicy.and.returnValue(of(null));
                component.recordId = policyRecordId;
                component.policies = policyItemsArray;
                fixture.detectChanges();
                forEach(component.policies, policyItem => policyItem.changed = true);
                expect(component.hasChanges()).toEqual(true);
                component.save();
                fixture.detectChanges();
                await fixture.whenStable();
                expect(recordPermissionsStub.updateRecordPolicy).toHaveBeenCalledWith(policyRecordId, typePolicy);
                expect(toastStub.createErrorToast).not.toHaveBeenCalled();
                expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
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
        expect(component.save).toHaveBeenCalledWith();
    });
    it('should call goBack when the back button is clicked',  () => {
        spyOn(component, 'goBack');
        component.ngOnInit();
        fixture.detectChanges();
        const button = nativeElement.querySelectorAll('.record-permission-view .back-column .back-button')[0] as HTMLElement;
        button.click();
        expect(component.goBack).toHaveBeenCalledWith();
    });
});

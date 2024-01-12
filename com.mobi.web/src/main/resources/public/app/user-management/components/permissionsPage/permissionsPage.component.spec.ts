/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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

import { DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { FOAF, USER, XSD } from '../../../prefixes';
import { UserAccessControlsComponent } from '../../../shared/components/userAccessControls/userAccessControls.component';
import { Group } from '../../../shared/models/group.interface';
import { User } from '../../../shared/models/user.class';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { PolicyManagerService } from '../../../shared/services/policyManager.service';
import { UserManagerService } from '../../../shared/services/userManager.service';
import { ToastService } from '../../../shared/services/toast.service';
import { PermissionsPageComponent } from './permissionsPage.component';

describe('Permissions Page component', function() {
    let component: PermissionsPageComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<PermissionsPageComponent>;
    let policyManagerStub: jasmine.SpyObj<PolicyManagerService>;
    let userManagerStub: jasmine.SpyObj<UserManagerService>;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
    let toastStub: jasmine.SpyObj<ToastService>;
    let everyoneMatch;
    let userMatch;
    let groupMatch;
    let user: User;
    let group: Group;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                MatButtonModule,
                MatTooltipModule,
                NoopAnimationsModule
            ],
            declarations: [
                PermissionsPageComponent,
                MockComponent(UserAccessControlsComponent)
            ],
            providers: [
                MockProvider(PolicyManagerService),
                MockProvider(UserManagerService),
                MockProvider(CatalogManagerService),
                MockProvider(ToastService),
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(PermissionsPageComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        userManagerStub = TestBed.inject(UserManagerService) as jasmine.SpyObj<UserManagerService>;
        policyManagerStub = TestBed.inject(PolicyManagerService) as jasmine.SpyObj<PolicyManagerService>;
        catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
        toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;

        policyManagerStub.actionCreate = 'create';
        policyManagerStub.actionUpdate = 'update';

        everyoneMatch = {
            AttributeDesignator: {
                AttributeId: `${USER}hasUserRole`,
                Category: policyManagerStub.subjectCategory,
                DataType: `${XSD}string`,
                MustBePresent: true
            },
            AttributeValue: {
                content: [component.userRole],
                otherAttributes: {},
                DataType: `${XSD}string`
            },
            MatchId: policyManagerStub.stringEqual
        };
        userMatch = {
            AttributeDesignator: {
                AttributeId: policyManagerStub.subjectId,
                Category: policyManagerStub.subjectCategory,
                DataType: `${XSD}string`,
                MustBePresent: true
            },
            AttributeValue: {
                content: ['user1'],
                otherAttributes: {},
                DataType: `${XSD}string`
            },
            MatchId: policyManagerStub.stringEqual
        };
        groupMatch = {
            AttributeDesignator: {
                AttributeId: component.groupAttributeId,
                Category: policyManagerStub.subjectCategory,
                DataType: `${XSD}string`,
                MustBePresent: true
            },
            AttributeValue: {
                content: ['group1'],
                otherAttributes: {},
                DataType: `${XSD}string`
            },
            MatchId: policyManagerStub.stringEqual
        };

        user = new User({
          '@id': 'user1',
          '@type': [`${USER}User`],
          [`${USER}username`]: [{ '@value': 'user1' }],
          [`${FOAF}firstName`]: [{ '@value': 'User' }],
          [`${FOAF}lastName`]: [{ '@value': '1' }],
        });
        userManagerStub.users = [user];
        group = {
            iri: 'group1',
            title: 'group1',
            external: false,
            description: '',
            roles: [],
            members: []
        };
        userManagerStub.groups = [group];
        catalogManagerStub.localCatalog = {'@id': 'catalogId', '@type': []};
        policyManagerStub.getPolicies.and.returnValue(of([]));
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        policyManagerStub = null;
        catalogManagerStub = null;
        userManagerStub = null;
        toastStub = null;
        everyoneMatch = null;
        userMatch = null;
        groupMatch = null;
        user = null;
        group = null;
    });

    describe('initializes policies correctly when getPolicies', function() {
        describe('resolves', function() {
            it('with no matching policies', fakeAsync(function() {
                component.ngOnInit();
                tick();
                expect(policyManagerStub.getPolicies).toHaveBeenCalledWith(undefined, undefined, undefined, true);
                expect(component.policies).toEqual([]);
                expect(toastStub.createErrorToast).not.toHaveBeenCalled();
            }));
            it('with policies', fakeAsync(function() {
                const policies = [
                    {
                        PolicyId: 'id1',
                        Description: 'Policy 1',
                        Rule: [ { Target: { AnyOf: [ { AllOf: [ { Match: [ everyoneMatch ] } ] } ] } } ]
                    },
                    {
                        PolicyId: 'id2',
                        Description: 'Policy 2',
                        Rule: [ { Target: { AnyOf: [ { AllOf: [ { Match: [ userMatch ] } ] } ] } } ]
                    },
                    {
                        PolicyId: 'id3',
                        Description: 'Policy 3',
                        Rule: [ { Target: { AnyOf: [ { AllOf: [ { Match: [ groupMatch ] } ] } ] } } ]
                    }
                ];
                policyManagerStub.getPolicies.and.returnValue(of(policies));
                component.ngOnInit();
                tick();
                
                expect(policyManagerStub.getPolicies).toHaveBeenCalledWith(undefined, undefined, undefined, true);
                expect(component.policies).toContain({
                    policy: policies[0],
                    id: 'id1',
                    title: 'Policy 1',
                    changed: false,
                    everyone: true,
                    selectedUsers: [],
                    selectedGroups: []
                });
                expect(component.policies).toContain({
                    policy: policies[1],
                    id: 'id2',
                    title: 'Policy 2',
                    changed: false,
                    everyone: false,
                    selectedUsers: [user],
                    selectedGroups: []
                });
                expect(component.policies).toContain({
                    policy: policies[2],
                    id: 'id3',
                    title: 'Policy 3',
                    changed: false,
                    everyone: false,
                    selectedUsers: [],
                    selectedGroups: [group],
                });
                expect(toastStub.createErrorToast).not.toHaveBeenCalled();
            }));
        });
        it('rejects', fakeAsync(function() {
            policyManagerStub.getPolicies.and.returnValue(throwError('Error message'));
            component.ngOnInit();
            tick();
            expect(policyManagerStub.getPolicies).toHaveBeenCalledWith(undefined, undefined, undefined, true);
            expect(toastStub.createErrorToast).toHaveBeenCalledWith('Error message');
        }));
    });
    describe('controller methods', function() {
        beforeEach(function() {
            this.policy = {
                changed: false,
                id: '',
                policy: {},
                title: '',
                everyone: false,
                selectedGroups: [],
                selectedUsers: []
            };
        });
        describe('should save changes to the policies', function() {
            beforeEach(function() {
                this.policy.changed = true;
                component.policies = [this.policy];
                policyManagerStub.updatePolicy.and.returnValue(of(null));
            });
            it('successfully', fakeAsync(function() {
                component.saveChanges();
                tick();
                expect(policyManagerStub.updatePolicy).toHaveBeenCalledWith({});
                expect(toastStub.createErrorToast).not.toHaveBeenCalled();
                expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                expect(this.policy.changed).toEqual(false);
            }));
            it('unless no policies were changed', fakeAsync(function() {
                this.policy.changed = false;
                component.saveChanges();
                tick();
                expect(policyManagerStub.updatePolicy).not.toHaveBeenCalled();
            }));
            it('unless an error occurs', fakeAsync(function() {
                component.policies = [this.policy];
                policyManagerStub.updatePolicy.and.returnValue(throwError('Error'));
                component.saveChanges();
                tick();
                expect(policyManagerStub.updatePolicy).toHaveBeenCalledWith({});
                expect(toastStub.createErrorToast).toHaveBeenCalledWith('Error');
                expect(toastStub.createSuccessToast).not.toHaveBeenCalled();
                expect(this.policy.changed).toEqual(true);
            }));
        });
        it('should determine whether there are changes to save', function() {
            expect(component.hasChanges()).toEqual(false);
            component.policies = [this.policy];
            expect(component.hasChanges()).toEqual(false);
            this.policy.changed = true;
            expect(component.hasChanges()).toEqual(true);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.permissions-page')).length).toEqual(1);
            expect(element.queryAll(By.css('.save-container')).length).toEqual(1);
        });
        it('depending on how many policies there are', function() {
            expect(element.queryAll(By.css('user-access-controls')).length).toEqual(0);

            component.policies = [{
                changed: false,
                id: '',
                policy: {},
                title: '',
                everyone: false,
                selectedGroups: [],
                selectedUsers: []
            }];
            fixture.detectChanges();
            expect(element.queryAll(By.css('user-access-controls')).length).toEqual(0);
        });
        it('with a button to save changes', function() {
            expect(element.queryAll(By.css('button.mat-fab[color="primary"]')).length).toEqual(1);
        });
        it('depending on whether there have been any changes', function() {
            fixture.detectChanges();
            const saveButton = element.query(By.css('button.mat-fab[color="primary"]'));
            expect(saveButton.properties['disabled']).toBeTruthy();

            spyOn(component, 'hasChanges').and.returnValue(true);
            fixture.detectChanges();
            expect(saveButton.properties['disabled']).toBeFalsy();
        });
    });
    it('should call saveChanges when the button is clicked', function() {
        spyOn(component, 'saveChanges');
        const saveButton = element.queryAll(By.css('button.mat-fab[color="primary"]'))[0];
        saveButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(component.saveChanges).toHaveBeenCalledWith();
    });
});

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

import { DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatButtonModule, MatTooltipModule } from '@angular/material';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { set } from 'lodash';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockProvider } from 'ng-mocks';

import { cleanStylesFromDOM, mockCatalogManager, mockPrefixes, mockUtil } from '../../../../../../test/ts/Shared';
import { UserAccessControlsComponent } from '../../../shared/components/userAccessControls/userAccessControls.component';
import { Group } from '../../../shared/models/group.interface';
import { User } from '../../../shared/models/user.interface';
import { PolicyManagerService } from '../../../shared/services/policyManager.service';
import { UserManagerService } from '../../../shared/services/userManager.service';
import { PermissionsPageComponent } from './permissionsPage.component';

describe('Permissions Page component', function() {
    let component: PermissionsPageComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<PermissionsPageComponent>;
    let policyManagerStub: jasmine.SpyObj<PolicyManagerService>;
    let userManagerStub: jasmine.SpyObj<UserManagerService>;
    let catalogManagerStub;
    let utilStub;
    let prefixesStub;
    let everyoneMatch;
    let userMatch;
    let groupMatch;
    let user: User;
    let group: Group;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
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
                { provide: 'catalogManagerService', useClass: mockCatalogManager },
                { provide: 'utilService', useClass: mockUtil },
                { provide: 'prefixes', useClass: mockPrefixes },
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(PermissionsPageComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        userManagerStub = TestBed.get(UserManagerService);
        policyManagerStub = TestBed.get(PolicyManagerService);
        catalogManagerStub = TestBed.get('catalogManagerService');
        utilStub = TestBed.get('utilService');
        prefixesStub = TestBed.get('prefixes');

        everyoneMatch = {
            AttributeDesignator: {
                AttributeId: prefixesStub.user + 'hasUserRole',
                Category: policyManagerStub.subjectCategory,
                DataType: prefixesStub.xsd + 'string',
                MustBePresent: true
            },
            AttributeValue: {
                content: [component.userRole],
                otherAttributes: {},
                DataType: prefixesStub.xsd + 'string'
            },
            MatchId: policyManagerStub.stringEqual
        };
        userMatch = {
            AttributeDesignator: {
                AttributeId: policyManagerStub.subjectId,
                Category: policyManagerStub.subjectCategory,
                DataType: prefixesStub.xsd + 'string',
                MustBePresent: true
            },
            AttributeValue: {
                content: ['user1'],
                otherAttributes: {},
                DataType: prefixesStub.xsd + 'string'
            },
            MatchId: policyManagerStub.stringEqual
        };
        groupMatch = {
            AttributeDesignator: {
                AttributeId: component.groupAttributeId,
                Category: policyManagerStub.subjectCategory,
                DataType: prefixesStub.xsd + 'string',
                MustBePresent: true
            },
            AttributeValue: {
                content: ['group1'],
                otherAttributes: {},
                DataType: prefixesStub.xsd + 'string'
            },
            MatchId: policyManagerStub.stringEqual
        };

        user = {
            iri: 'user1',
            username: 'user1',
            firstName: 'User',
            lastName: '1',
            email: '',
            roles: [],
            external: false
        };
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
        catalogManagerStub.localCatalog = {'@id': 'catalogId'};
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        policyManagerStub = null;
        catalogManagerStub = null;
        userManagerStub = null;
        utilStub = null;
        prefixesStub = null;
        everyoneMatch = null;
        userMatch = null;
        groupMatch = null;
        user = null;
        group = null;
    });

    describe('initializes policies correctly when getPolicies', function() {
        describe('resolves', function() {
            beforeEach(function() {
                this.firstTypePolicy = {
                    PolicyId: 'id',
                    Target: {AnyOf: [{AllOf: [{Match: [{
                        AttributeDesignator: {AttributeId: prefixesStub.rdf + 'type'},
                        AttributeValue: {content: ['type']}
                    }]}]}]}
                };
                this.secondTypePolicy = {
                    PolicyId: 'id2',
                    Target: {AnyOf: [{AllOf: [{Match: [{
                        AttributeDesignator: {AttributeId: prefixesStub.rdf + 'type'},
                        AttributeValue: {content: ['type']}
                    }]}]}]}
                };
            });
            it('with no matching policies', fakeAsync(function() {
                policyManagerStub.getPolicies.and.returnValue(Promise.resolve([]));
                component.ngOnInit();
                tick();
                expect(component.policiesInQuestion).toContain(jasmine.objectContaining({
                    resourceId: component.catalogId,
                    actionId: policyManagerStub.actionCreate,
                    subjectId: undefined
                }));
                expect(component.policiesInQuestion).toContain(jasmine.objectContaining({
                    resourceId: component.systemRepoId,
                    actionId: policyManagerStub.actionRead,
                    subjectId: undefined
                }));
                expect(policyManagerStub.getPolicies).toHaveBeenCalledWith(component.catalogId, undefined, policyManagerStub.actionCreate);
                expect(policyManagerStub.getPolicies).toHaveBeenCalledWith(component.systemRepoId, undefined, policyManagerStub.actionRead);
                expect(component.policies).toEqual([]);
                expect(utilStub.createErrorToast).not.toHaveBeenCalled();
            }));
            it('with a policy that allows everyone', fakeAsync(function() {
                const firstPolicyPolicies = [set(this.firstTypePolicy, 'Rule[0].Target.AnyOf[0].AllOf[0].Match[0]', everyoneMatch)];
                const secondPolicyPolicies = [set(this.secondTypePolicy, 'Rule[0].Target.AnyOf[0].AllOf[0].Match[0]', everyoneMatch)];

                policyManagerStub.getPolicies
                    .withArgs(catalogManagerStub.localCatalog['@id'], undefined, policyManagerStub.actionCreate).and.returnValue(Promise.resolve(firstPolicyPolicies))
                    .withArgs(component.systemRepoId, undefined, policyManagerStub.actionRead).and.returnValue(Promise.resolve(secondPolicyPolicies));

                component.ngOnInit();
                tick();
                
                expect(component.policiesInQuestion).toContain(jasmine.objectContaining({
                    resourceId: component.catalogId,
                    actionId: policyManagerStub.actionCreate,
                    subjectId: undefined
                }));
                expect(component.policiesInQuestion).toContain(jasmine.objectContaining({
                    resourceId: component.systemRepoId,
                    actionId: policyManagerStub.actionRead,
                    subjectId: undefined
                }));
                expect(policyManagerStub.getPolicies).toHaveBeenCalledWith(component.catalogId, undefined, policyManagerStub.actionCreate);
                expect(policyManagerStub.getPolicies).toHaveBeenCalledWith(component.systemRepoId, undefined, policyManagerStub.actionRead);
                expect(component.policies).toContain({
                    policy: firstPolicyPolicies[0],
                    id: this.firstTypePolicy.PolicyId,
                    title: 'Create type',
                    changed: false,
                    everyone: true,
                    selectedUsers: [],
                    selectedGroups: []
                });
                expect(component.policies).toContain({
                    policy: secondPolicyPolicies[0],
                    id: this.secondTypePolicy.PolicyId,
                    title: 'Query System Repo',
                    changed: false,
                    everyone: true,
                    selectedUsers: [],
                    selectedGroups: []
                });
                expect(utilStub.createErrorToast).not.toHaveBeenCalled();
            }));
            it('with a policy that has selected users', fakeAsync(function() {
                const firstPolicyPolicies = [set(this.firstTypePolicy, 'Rule[0].Target.AnyOf[0].AllOf[0].Match[0]', userMatch)];
                const secondPolicyPolicies = [set(this.secondTypePolicy, 'Rule[0].Target.AnyOf[0].AllOf[0].Match[0]', userMatch)];

                policyManagerStub.getPolicies
                    .withArgs(catalogManagerStub.localCatalog['@id'], undefined, policyManagerStub.actionCreate).and.returnValue(Promise.resolve(firstPolicyPolicies))
                    .withArgs(component.systemRepoId, undefined, policyManagerStub.actionRead).and.returnValue(Promise.resolve(secondPolicyPolicies));

                component.ngOnInit();
                tick();
                
                expect(component.policiesInQuestion).toContain(jasmine.objectContaining({
                    resourceId: component.catalogId,
                    actionId: policyManagerStub.actionCreate,
                    subjectId: undefined
                }));
                expect(component.policiesInQuestion).toContain(jasmine.objectContaining({
                    resourceId: component.systemRepoId,
                    actionId: policyManagerStub.actionRead,
                    subjectId: undefined
                }));
                expect(component.policies).toContain({
                    policy: firstPolicyPolicies[0],
                    id: this.firstTypePolicy.PolicyId,
                    title: 'Create type',
                    changed: false,
                    everyone: false,
                    selectedUsers: [user],
                    selectedGroups: [],
                });
                expect(component.policies).toContain({
                    policy: secondPolicyPolicies[0],
                    id: this.secondTypePolicy.PolicyId,
                    title: 'Query System Repo',
                    changed: false,
                    everyone: false,
                    selectedUsers: [user],
                    selectedGroups: [],
                });
            }));
            it('with a policy that has selected groups', fakeAsync(function() {
                const firstPolicyPolicies = [set(this.firstTypePolicy, 'Rule[0].Target.AnyOf[0].AllOf[0].Match[0]', groupMatch)];
                const secondPolicyPolicies = [set(this.secondTypePolicy, 'Rule[0].Target.AnyOf[0].AllOf[0].Match[0]', groupMatch)];

                policyManagerStub.getPolicies
                    .withArgs(catalogManagerStub.localCatalog['@id'], undefined, policyManagerStub.actionCreate).and.returnValue(Promise.resolve(firstPolicyPolicies))
                    .withArgs(component.systemRepoId, undefined, policyManagerStub.actionRead).and.returnValue(Promise.resolve(secondPolicyPolicies));

                component.ngOnInit();
                tick();

                expect(component.policies).toContain({
                    policy: firstPolicyPolicies[0],
                    id: this.firstTypePolicy.PolicyId,
                    title: 'Create type',
                    changed: false,
                    everyone: false,
                    selectedUsers: [],
                    selectedGroups: [group],
                });
                expect(component.policies).toContain({
                    policy: secondPolicyPolicies[0],
                    id: this.secondTypePolicy.PolicyId,
                    title: 'Query System Repo',
                    changed: false,
                    everyone: false,
                    selectedUsers: [],
                    selectedGroups: [group],
                });
            }));
        });
        it('rejects', fakeAsync(function() {
            policyManagerStub.getPolicies.and.returnValue(Promise.reject('Error message'));
            component.ngOnInit();
            tick();
            expect(component.policiesInQuestion).toContain(jasmine.objectContaining({
                resourceId: component.catalogId,
                actionId: policyManagerStub.actionCreate,
                subjectId: undefined
            }));
            expect(component.policiesInQuestion).toContain(jasmine.objectContaining({
                resourceId: component.systemRepoId,
                actionId: policyManagerStub.actionRead,
                subjectId: undefined
            }));
            expect(policyManagerStub.getPolicies).toHaveBeenCalledWith(component.catalogId, undefined, policyManagerStub.actionCreate);
            expect(policyManagerStub.getPolicies).toHaveBeenCalledWith(component.systemRepoId, undefined, policyManagerStub.actionRead);
            expect(utilStub.createErrorToast).toHaveBeenCalledWith('Error message');
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
        it('should reset the component', function() {
            spyOn(component, 'ngOnInit');
            component.reset();
            expect(component.ngOnInit).toHaveBeenCalled();
        });
        describe('should save changes to the policies', function() {
            beforeEach(function() {
                this.policy.changed = true;
                component.policies = [this.policy];
            });
            it('successfully', fakeAsync(function() {
                component.saveChanges();
                tick();
                expect(policyManagerStub.updatePolicy).toHaveBeenCalledWith({});
                expect(utilStub.createErrorToast).not.toHaveBeenCalled();
                expect(utilStub.createSuccessToast).toHaveBeenCalled();
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
                policyManagerStub.updatePolicy.and.returnValue(Promise.reject('Error'));
                component.saveChanges();
                tick();
                expect(policyManagerStub.updatePolicy).toHaveBeenCalledWith({});
                expect(utilStub.createErrorToast).toHaveBeenCalledWith('Error');
                expect(utilStub.createSuccessToast).not.toHaveBeenCalled();
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
        expect(component.saveChanges).toHaveBeenCalled();
    });
});

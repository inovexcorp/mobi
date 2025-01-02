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
import { DebugElement } from '@angular/core';

import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MockComponent, MockProvider } from 'ng-mocks';
import { FormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggle, MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { of, throwError } from 'rxjs';
import { By } from '@angular/platform-browser';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { UserStateService } from '../../../shared/services/userState.service';
import { UserManagerService } from '../../../shared/services/userManager.service';
import { Group } from '../../../shared/models/group.interface';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { AddMemberButtonComponent } from '../addMemberButton/addMemberButton.component';
import { MemberTableComponent } from '../memberTable/memberTable.component';
import { GroupsListComponent } from '../groupsList/groupsList.component';
import { CreateGroupOverlayComponent } from '../createGroupOverlay/createGroupOverlay.component';
import { EditGroupInfoOverlayComponent } from '../editGroupInfoOverlay/editGroupInfoOverlay.component';
import { ToastService } from '../../../shared/services/toast.service';
import { LoginManagerService } from '../../../shared/services/loginManager.service';
import { GroupsPageComponent } from './groupsPage.component';

describe('Groups Page component', function() {
    let component: GroupsPageComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<GroupsPageComponent>;
    let userStateStub: jasmine.SpyObj<UserStateService>;
    let userManagerStub: jasmine.SpyObj<UserManagerService>;
    let matDialog: jasmine.SpyObj<MatDialog>;
    let loginManagerStub: jasmine.SpyObj<LoginManagerService>;
    let toastStub: jasmine.SpyObj<ToastService>;
    let group: Group;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                FormsModule,
                MatSlideToggleModule,
                MatFormFieldModule,
                MatInputModule,
                MatDialogModule,
                MatButtonModule,
                NoopAnimationsModule
            ],
            declarations: [
                GroupsPageComponent,
                MockComponent(GroupsListComponent),
                MockComponent(AddMemberButtonComponent),
                MockComponent(MemberTableComponent)
            ],
            providers: [
                MockProvider(UserStateService),
                MockProvider(UserManagerService),
                MockProvider(LoginManagerService),
                MockProvider(ToastService),
                { provide: MatDialog, useFactory: () => jasmine.createSpyObj('MatDialog', {
                    open: { afterClosed: () => of(true)}
                }) }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(GroupsPageComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        userStateStub = TestBed.inject(UserStateService) as jasmine.SpyObj<UserStateService>;
        userManagerStub = TestBed.inject(UserManagerService) as jasmine.SpyObj<UserManagerService>;
        matDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
        loginManagerStub = TestBed.inject(LoginManagerService) as jasmine.SpyObj<LoginManagerService>;
        toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;

        group = {
            title: 'group',
            description: '',
            roles: [],
            members: [],
            external: false
        };
        loginManagerStub.currentUser = 'batman';
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        userManagerStub = null;
        userStateStub = null;
        matDialog = null;
        loginManagerStub = null;
        toastStub = null;
        group = null;
    });

    it('initializes with the correct values', function() {
        spyOn(component, 'setAdmin');
        userManagerStub.isAdmin.and.returnValue(true);
        userManagerStub.groups = [group];
        component.ngOnInit();
        expect(component.filteredGroups).toEqual([group]);
        expect(component.setAdmin).toHaveBeenCalledWith();
        expect(userManagerStub.isAdmin).toHaveBeenCalledWith(loginManagerStub.currentUser);
        expect(component.isAdmin).toEqual(true);
    });
    describe('controller methods', function() {
        it('should select a group', function() {
            spyOn(component, 'setAdmin');
            component.selectGroup(group);
            expect(userStateStub.selectedGroup).toEqual(group);
            expect(component.setAdmin).toHaveBeenCalledWith();
        });
        it('should open a modal for creating a group', function() {
            component.createGroup();
            expect(matDialog.open).toHaveBeenCalledWith(CreateGroupOverlayComponent);
        });
        it('should handle a search of the groups list', function() {
            userManagerStub.filterGroups.and.returnValue([group]);
            component.onSearch('test');
            expect(userStateStub.groupSearchString).toEqual('test');
            expect(component.filteredGroups).toEqual([group]);
            expect(userManagerStub.filterGroups).toHaveBeenCalledWith(userManagerStub.groups, 'test');
        });
        describe('should change the admin role on the selected group', function() {
            beforeEach(function() {
                userStateStub.selectedGroup = group;
                fixture.detectChanges();
            });
            describe('from false to true', function() {
                beforeEach(function() {
                    const slider = element.query(By.directive(MatSlideToggle));
                    this.event = new MatSlideToggleChange(slider.componentInstance, true);
                });
                it('successfully', fakeAsync(function() {
                    userManagerStub.addGroupRoles.and.returnValue(of(null));
                    component.changeAdmin(this.event);
                    tick();
                    expect(userManagerStub.addGroupRoles).toHaveBeenCalledWith(group.title, ['admin']);
                    expect(userManagerStub.deleteGroupRole).not.toHaveBeenCalled();
                    expect(toastStub.createErrorToast).not.toHaveBeenCalled();
                }));
                it('unless an error occurs', fakeAsync(function() {
                    userManagerStub.addGroupRoles.and.returnValue(throwError('Error message'));
                    component.changeAdmin(this.event);
                    tick();
                    expect(userManagerStub.addGroupRoles).toHaveBeenCalledWith(group.title, ['admin']);
                    expect(userManagerStub.deleteGroupRole).not.toHaveBeenCalled();
                    expect(toastStub.createErrorToast).toHaveBeenCalledWith('Error message');
                }));
            });
            describe('from true to false', function() {
                beforeEach(function() {
                    const slider = element.query(By.directive(MatSlideToggle));
                    this.event = new MatSlideToggleChange(slider.componentInstance, false);
                });
                it('successfully', fakeAsync(function() {
                    userManagerStub.deleteGroupRole.and.returnValue(of(null));
                    component.changeAdmin(this.event);
                    tick();
                    expect(userManagerStub.addGroupRoles).not.toHaveBeenCalled();
                    expect(userManagerStub.deleteGroupRole).toHaveBeenCalledWith(group.title, 'admin');
                    expect(toastStub.createErrorToast).not.toHaveBeenCalled();
                }));
                it('unless an error occurs', fakeAsync(function() {
                    userManagerStub.deleteGroupRole.and.returnValue(throwError('Error message'));
                    component.changeAdmin(this.event);
                    tick();
                    expect(userManagerStub.addGroupRoles).not.toHaveBeenCalled();
                    expect(userManagerStub.deleteGroupRole).toHaveBeenCalledWith(group.title, 'admin');
                    expect(toastStub.createErrorToast).toHaveBeenCalledWith('Error message');
                }));
            });
        });
        it('should open a modal for deleting a group', function() {
            userStateStub.selectedGroup = group;
            spyOn(component, 'deleteGroup');
            component.confirmDeleteGroup();
            expect(matDialog.open).toHaveBeenCalledWith(ConfirmModalComponent, {data: {content: jasmine.stringMatching('Are you sure you want to remove')}});
            expect(component.deleteGroup).toHaveBeenCalledWith();
        });
        it('should open a modal for editing a group description', function() {
            component.editDescription();
            expect(matDialog.open).toHaveBeenCalledWith(EditGroupInfoOverlayComponent);
        });
        it('should set whether the selected group is admin', function() {
            userStateStub.selectedGroup = group;
            component.setAdmin();
            expect(component.selectedAdmin).toBeFalse();

            userStateStub.selectedGroup.roles = ['admin'];
            component.setAdmin();
            expect(component.selectedAdmin).toBeTrue();
        });
        describe('should delete a group', function() {
            beforeEach(function() {
                userStateStub.selectedGroup = group;
                spyOn(component, 'setAdmin');
            });
            it('unless an error occurs', fakeAsync(function() {
                userManagerStub.deleteGroup.and.returnValue(throwError('Error message'));
                component.deleteGroup();
                tick();
                expect(userManagerStub.deleteGroup).toHaveBeenCalledWith(group.title);
                expect(userStateStub.selectedGroup).toEqual(group);
                expect(component.setAdmin).not.toHaveBeenCalled();
                expect(toastStub.createErrorToast).toHaveBeenCalledWith('Error message');
            }));
            it('successfully', fakeAsync(function() {
                userManagerStub.deleteGroup.and.returnValue(of(null));
                component.deleteGroup();
                tick();
                expect(userManagerStub.deleteGroup).toHaveBeenCalledWith(group.title);
                expect(userStateStub.selectedGroup).toBeUndefined();
                expect(component.setAdmin).toHaveBeenCalledWith();
                expect(toastStub.createErrorToast).not.toHaveBeenCalled();
            }));
        });
        describe('should add a group member', function() {
            beforeEach(function() {
                this.user = {
                    username: 'batman',
                    firstName: 'BATMAN',
                    lastName: 'DUH',
                    roles: [],
                    email: 'iambatman@test.com',
                    external: false
                };
                userStateStub.selectedGroup = group;
            });
            it('unless an error occurs', fakeAsync(function() {
                userManagerStub.addUserGroup.and.returnValue(throwError('Error message'));
                component.addMember(this.user);
                tick();
                expect(userManagerStub.addUserGroup).toHaveBeenCalledWith(this.user.username, group.title);
                expect(toastStub.createSuccessToast).not.toHaveBeenCalled();
                expect(toastStub.createErrorToast).toHaveBeenCalledWith('Error message');
            }));
            it('successfully', fakeAsync(function() {
                userManagerStub.addUserGroup.and.returnValue(of(null));
                component.addMember(this.user);
                tick();
                expect(userManagerStub.addUserGroup).toHaveBeenCalledWith(this.user.username, group.title);
                expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                expect(toastStub.createErrorToast).not.toHaveBeenCalled();
            }));
        });
        it('should open a modal for removing a member', function() {
            userStateStub.selectedGroup = group;
            spyOn(component, 'removeMember');
            component.confirmRemoveMember('batman');
            expect(matDialog.open).toHaveBeenCalledWith(ConfirmModalComponent, {data: {content: jasmine.stringMatching('Are you sure you want to remove')}});
            expect(component.removeMember).toHaveBeenCalledWith('batman');
        });
        describe('should remove a group member', function() {
            beforeEach(function() {
                userStateStub.selectedGroup = group;
            });
            it('unless an error occurs', fakeAsync(function() {
                userManagerStub.deleteUserGroup.and.returnValue(throwError('Error message'));
                component.removeMember('batman');
                tick();
                expect(userManagerStub.deleteUserGroup).toHaveBeenCalledWith('batman', group.title);
                expect(toastStub.createSuccessToast).not.toHaveBeenCalled();
                expect(toastStub.createErrorToast).toHaveBeenCalledWith('Error message');
            }));
            it('successfully', fakeAsync(function() {
                userManagerStub.deleteUserGroup.and.returnValue(of(null));
                component.removeMember('batman');
                tick();
                expect(userManagerStub.deleteUserGroup).toHaveBeenCalledWith('batman', group.title);
                expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                expect(toastStub.createErrorToast).not.toHaveBeenCalled();
            }));
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.groups-page')).length).toEqual(1);
            expect(element.queryAll(By.css('.col-4')).length).toEqual(1);
        });
        it('depending on whether a group is selected', function() {
            expect(element.queryAll(By.css('.col-8')).length).toEqual(0);

            userStateStub.selectedGroup = group;
            fixture.detectChanges();
            expect(element.queryAll(By.css('.col-8')).length).toEqual(1);
        });
        it('with a button to create a group', function() {
            const button = element.query(By.css('.col-4 button[color="primary"]'));
            expect(button).toBeDefined();
            expect(button.nativeElement.textContent.trim()).toEqual('Create Group');
        });
        it('with an input for searching', function() {
            expect(element.queryAll(By.css('.group-search mat-form-field input')).length).toEqual(1);
        });
        it('with a groups-list', function() {
            expect(element.queryAll(By.css('groups-list')).length).toEqual(1);
        });
        it('with a mat-slide-toggle when a group is selected', function() {
            userStateStub.selectedGroup = group;
            fixture.detectChanges();
            expect(element.queryAll(By.css('mat-slide-toggle')).length).toEqual(1);
        });
        it('with a button to delete when a group is selected', function() {
            userStateStub.selectedGroup = group;
            fixture.detectChanges();
            expect(element.queryAll(By.css('.col-8 .group-title button[color="warn"]')).length).toEqual(1);
        });
        it('with a .group-description when a group is selected', function() {
            group.description = 'This is a description';
            userStateStub.selectedGroup = group;
            fixture.detectChanges();
            const description = element.query(By.css('.group-description'));
            expect(description).toBeDefined();
            expect(description.nativeElement.textContent.trim()).toContain(group.description);
        });
        it('with an add-member-button and member-table when a group is selected', function() {
            userStateStub.selectedGroup = group;
            fixture.detectChanges();
            expect(element.queryAll(By.css('add-member-button')).length).toEqual(1);
            expect(element.queryAll(By.css('member-table')).length).toEqual(1);
        });
        it('with a button to edit the group description when a group is selected', function() {
            userStateStub.selectedGroup = group;
            fixture.detectChanges();
            expect(element.queryAll(By.css('.col-8 button.mat-icon-button[color="primary"]')).length).toEqual(1);
        });
        it('depending on whether the current user is an admin', function() {
            component.isAdmin = false;
            userStateStub.selectedGroup = group;
            fixture.detectChanges();
            const deleteButton = element.query(By.css('.col-8 .group-title button[color="warn"]'));
            const createButton = element.query(By.css('.col-4 button[color="primary"]'));
            const editButton = element.query(By.css('.col-8 button.mat-icon-button[color="primary"]'));
            expect(deleteButton.properties['disabled']).toBeTruthy();
            expect(createButton.properties['disabled']).toBeTruthy();
            expect(editButton.properties['disabled']).toBeTruthy();

            component.isAdmin = true;
            fixture.detectChanges();
            expect(deleteButton.properties['disabled']).toBeFalsy();
            expect(createButton.properties['disabled']).toBeFalsy();
            expect(editButton.properties['disabled']).toBeFalsy();
        });
        it('depending on whether a group is external', function() {
            userStateStub.selectedGroup = group;
            userManagerStub.isAdmin.and.returnValue(true);
            fixture.detectChanges();
            const deleteButton = element.query(By.css('.col-8 .group-title button[color="warn"]'));
            const editButton = element.query(By.css('.col-8 button.mat-icon-button[color="primary"]'));
            expect(deleteButton.properties['disabled']).toBeFalsy();
            expect(editButton.properties['disabled']).toBeFalsy();

            userStateStub.selectedGroup.external = true;
            fixture.detectChanges();
            expect(deleteButton.properties['disabled']).toBeTruthy();
            expect(editButton.properties['disabled']).toBeTruthy();
        });
    });
    it('should call createGroup when the button is clicked', function() {
        spyOn(component, 'createGroup');
        const createButton = element.query(By.css('.col-4 button[color="primary"]'));
        createButton.triggerEventHandler('click', null);
        expect(component.createGroup).toHaveBeenCalledWith();
    });
    it('should call confirmDeleteGroup when the button is clicked', function() {
        userStateStub.selectedGroup = group;
        fixture.detectChanges();
        spyOn(component, 'confirmDeleteGroup');
        const deleteButton = element.query(By.css('.col-8 .group-title button[color="warn"]'));
        deleteButton.triggerEventHandler('click', null);
        expect(component.confirmDeleteGroup).toHaveBeenCalledWith();
    });
    it('should call editDescription when the button is clicked', function() {
        userStateStub.selectedGroup = group;
        fixture.detectChanges();
        spyOn(component, 'editDescription');
        const editButton = element.query(By.css('.col-8 button.mat-icon-button[color="primary"]'));
        editButton.triggerEventHandler('click', null);
        expect(component.editDescription).toHaveBeenCalledWith();
    });
});

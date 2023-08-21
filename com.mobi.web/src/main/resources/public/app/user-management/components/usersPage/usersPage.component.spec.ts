/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggle, MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { Group } from '../../../shared/models/group.interface';
import { User } from '../../../shared/models/user.interface';
import { LoginManagerService } from '../../../shared/services/loginManager.service';
import { UserManagerService } from '../../../shared/services/userManager.service';
import { UserStateService } from '../../../shared/services/userState.service';
import { ToastService } from '../../../shared/services/toast.service';
import { CreateUserOverlayComponent } from '../createUserOverlay/createUserOverlay.component';
import { EditUserProfileOverlayComponent } from '../editUserProfileOverlay/editUserProfileOverlay.component';
import { ResetPasswordOverlayComponent } from '../resetPasswordOverlay/resetPasswordOverlay.component';
import { UsersListComponent } from '../usersList/usersList.component';
import { UsersPageComponent } from './usersPage.component';

describe('Users Page component', function() {
    let component: UsersPageComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<UsersPageComponent>;
    let userStateStub: jasmine.SpyObj<UserStateService>;
    let userManagerStub: jasmine.SpyObj<UserManagerService>;
    let matDialog: jasmine.SpyObj<MatDialog>;
    let loginManagerStub: jasmine.SpyObj<LoginManagerService>;
    let toastStub: jasmine.SpyObj<ToastService>;
    let user: User;

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
                UsersPageComponent,
                MockComponent(UsersListComponent),
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

        fixture = TestBed.createComponent(UsersPageComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        userStateStub = TestBed.inject(UserStateService) as jasmine.SpyObj<UserStateService>;
        userManagerStub = TestBed.inject(UserManagerService) as jasmine.SpyObj<UserManagerService>;
        matDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
        loginManagerStub = TestBed.inject(LoginManagerService) as jasmine.SpyObj<LoginManagerService>;
        toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;

        user = {
            username: 'batman',
            firstName: 'BATMAN',
            lastName: 'user',
            email: 'iambatman@test.com',
            external: false,
            roles: []
        };
        loginManagerStub.currentUserIRI = 'iri';
        loginManagerStub.currentUser = 'test';
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
        user = null;
    });

    describe('initializes with the correct values when', function() {
        it('no user is selected in state', function() {
            spyOn(component, 'setAdmin');
            spyOn(component, 'selectUser');
            userStateStub.selectedUser = undefined;
            userManagerStub.isAdmin.and.returnValue(true);
            userManagerStub.isAdminUser.and.returnValue(true);
            userManagerStub.users = [user];
            userManagerStub.filterUsers.and.returnValue([user]);
            component.ngOnInit();
            expect(component.filteredUsers).toEqual([user]);
            expect(component.setAdmin).toHaveBeenCalledWith();
            expect(userManagerStub.isAdminUser).toHaveBeenCalledWith(loginManagerStub.currentUserIRI);
            expect(userManagerStub.isAdmin).toHaveBeenCalledWith(loginManagerStub.currentUser);
        });
        it('a user is selected in state', function() {
            spyOn(component, 'setAdmin');
            spyOn(component, 'selectUser');
            userStateStub.selectedUser = user;
            userManagerStub.isAdmin.and.returnValue(true);
            userManagerStub.isAdminUser.and.returnValue(true);
            userManagerStub.users = [user];
            userManagerStub.filterUsers.and.returnValue([user]);
            component.ngOnInit();
            expect(component.filteredUsers).toEqual([user]);
            expect(component.setAdmin).not.toHaveBeenCalled();
            expect(userManagerStub.isAdminUser).toHaveBeenCalledWith(loginManagerStub.currentUserIRI);
            expect(userManagerStub.isAdmin).toHaveBeenCalledWith(loginManagerStub.currentUser);
            expect(component.selectUser).toHaveBeenCalledWith(user);
        });
    });
    describe('controller methods', function() {
        describe('should select a user', function() {
            beforeEach(function() {
                spyOn(component, 'setAdmin');
                spyOn(component, 'setUserGroups');
            });
            it('when it is the current user', function() {
                loginManagerStub.currentUser = user.username;
                component.selectUser(user);
                expect(userStateStub.selectedUser).toEqual(user);
                expect(component.selectedCurrentUser).toBeTruthy();
                expect(component.selectedAdminUser).toBeFalsy();
                expect(component.setAdmin).toHaveBeenCalledWith();
                expect(component.setUserGroups).toHaveBeenCalledWith();
            });
            it('when it is the admin user', function() {
                userManagerStub.isAdminUser.and.returnValue(true);
                component.selectUser(user);
                expect(userStateStub.selectedUser).toEqual(user);
                expect(component.selectedCurrentUser).toBeFalsy();
                expect(component.selectedAdminUser).toBeTruthy();
                expect(component.setAdmin).toHaveBeenCalledWith();
                expect(component.setUserGroups).toHaveBeenCalledWith();
            });
            it('when it is any old user', async function() {
                component.selectUser(user);
                await fixture.detectChanges();

                expect(userStateStub.selectedUser).toEqual(user);
                expect(component.selectedCurrentUser).toBeFalsy();
                expect(component.selectedAdminUser).toBeFalsy();
                expect(component.setAdmin).toHaveBeenCalledWith();
                expect(component.setUserGroups).toHaveBeenCalledWith();
            });
        });
        it('should open a modal for deleting a user', function() {
            userStateStub.selectedUser = user;
            spyOn(component, 'deleteUser');
            component.confirmDeleteUser();
            expect(matDialog.open).toHaveBeenCalledWith(ConfirmModalComponent, {data: {content: jasmine.stringMatching('Are you sure you want to remove')}});
            expect(component.deleteUser).toHaveBeenCalledWith();
        });
        it('should open a modal for creating a user', function() {
            component.createUser();
            expect(matDialog.open).toHaveBeenCalledWith(CreateUserOverlayComponent);
        });
        it('should open a modal for changing a user profile', function() {
            component.editProfile();
            expect(matDialog.open).toHaveBeenCalledWith(EditUserProfileOverlayComponent);
        });
        it('should open a modal for resetting a user password', function() {
            component.resetPassword();
            expect(matDialog.open).toHaveBeenCalledWith(ResetPasswordOverlayComponent);
        });
        describe('should delete a user', function() {
            beforeEach(function() {
                userStateStub.selectedUser = user;
                spyOn(component, 'setAdmin');
                spyOn(component, 'setUserGroups');
                component.selectedCurrentUser = true;
                component.selectedAdminUser = true;
            });
            it('unless an error occurs', async function() {
                userManagerStub.deleteUser.and.returnValue(throwError('Error message'));
                await component.deleteUser();
                await fixture.whenStable();
                expect(userManagerStub.deleteUser).toHaveBeenCalledWith(user.username);
                expect(toastStub.createSuccessToast).not.toHaveBeenCalled();
                expect(userStateStub.selectedUser).toEqual(user);
                expect(component.selectedCurrentUser).toBeTrue();
                expect(component.selectedAdminUser).toBeTrue();
                expect(component.setAdmin).not.toHaveBeenCalled();
                expect(component.setUserGroups).not.toHaveBeenCalled();
               
            });
            it('successfully', async function() {
                userManagerStub.deleteUser.and.returnValue(of(null));
                await component.deleteUser();
                await fixture.whenStable();

                userManagerStub.deleteUser('user').subscribe(() => {
                    expect(userManagerStub.deleteUser).toHaveBeenCalledWith(user.username);
                    expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                    expect(userStateStub.selectedUser).toBeUndefined();
                    expect(component.selectedCurrentUser).toBeFalse();
                    expect(component.selectedAdminUser).toBeFalse();
                    expect(component.setAdmin).toHaveBeenCalledWith();
                    expect(component.setUserGroups).toHaveBeenCalledWith();
                    expect(toastStub.createErrorToast).not.toHaveBeenCalled();
                });
                
            });
        });
        describe('should change the admin role on the selected user', function() {
            beforeEach(function() {
                userStateStub.selectedUser = user;
                userManagerStub.users = [user];
                fixture.detectChanges();
            });
            describe('from false to true', function() {
                beforeEach(function() {
                    const slider = element.query(By.directive(MatSlideToggle));
                    this.event = new MatSlideToggleChange(slider.componentInstance, true);
                });
                it('successfully', async function() {
                    userManagerStub.addUserRoles.and.returnValue(of(null));
                    await component.changeAdmin(this.event);
                    fixture.detectChanges();
                    await fixture.whenStable();
                    expect(userManagerStub.addUserRoles).toHaveBeenCalledWith(user.username, ['admin']);
                    expect(userManagerStub.deleteUserRole).not.toHaveBeenCalled();
                    expect(toastStub.createErrorToast).not.toHaveBeenCalled();
                });
                it('unless an error occurs',  async function() {
                    userManagerStub.addUserRoles.and.returnValue(throwError('Error message'));
                    await component.changeAdmin(this.event);
                    await fixture.whenStable();
                    expect(userManagerStub.addUserRoles).toHaveBeenCalledWith(user.username, ['admin']);
                    expect(userManagerStub.deleteUserRole).not.toHaveBeenCalled();
                    expect(toastStub.createErrorToast).toHaveBeenCalledWith('Error message');
                });
            });
            describe('from true to false', function() {
                beforeEach(function() {
                    const slider = element.query(By.directive(MatSlideToggle));
                    this.event = new MatSlideToggleChange(slider.componentInstance, false);
                });
                it('successfully', async function() {
                    userManagerStub.deleteUserRole.and.returnValue(of(null));
                    component.changeAdmin(this.event);
                    fixture.detectChanges();
                    await fixture.whenStable();
                    expect(userManagerStub.addUserRoles).not.toHaveBeenCalled();
                    expect(userManagerStub.deleteUserRole).toHaveBeenCalledWith(user.username, 'admin');
                    expect(toastStub.createErrorToast).not.toHaveBeenCalled();
                });
                it('unless an error occurs', async function() {
                    userManagerStub.deleteUserRole.and.returnValue(throwError('Error message'));
                    await component.changeAdmin(this.event);
                    fixture.detectChanges();
                    await fixture.whenStable();
                    expect(userManagerStub.addUserRoles).not.toHaveBeenCalled();
                    expect(userManagerStub.deleteUserRole).toHaveBeenCalledWith(user.username, 'admin');
                    expect(toastStub.createErrorToast).toHaveBeenCalledWith('Error message');
                });
            });
        });
        it('should set all groups a user is a part of', function() {
            userStateStub.selectedUser = user;
            const group1: Group = {
                title: 'group1',
                description: '',
                roles: [],
                members: [user.username],
                external: false
            };
            const group2: Group = {
                title: 'group2',
                description: '',
                roles: [],
                members: [],
                external: false
            };
            userManagerStub.groups = [group1, group2];
            component.setUserGroups();
            expect(component.groups).toEqual([group1]);
        });
        it('should set the correct state for opening a group', function() {
            const group: Group = {
                title: 'group',
                description: '',
                roles: [],
                members: [],
                external: false
            };
            component.goToGroup(group);
            expect(userStateStub.selectedGroup).toEqual(group);
            expect(userStateStub.tabIndex).toEqual(1);
        });
        it('should set whether the selected user is admin', function() {
            userStateStub.selectedUser = user;
            component.setAdmin();
            expect(component.selectedAdmin).toBeFalse();

            userStateStub.selectedUser.roles = ['admin'];
            component.setAdmin();
            expect(component.selectedAdmin).toBeTrue();
        });
        it('should handle a search of users list', function() {
            userManagerStub.filterUsers.and.returnValue([user]);
            component.onSearch('test');
            expect(userStateStub.userSearchString).toEqual('test');
            expect(component.filteredUsers).toEqual([user]);
            expect(userManagerStub.filterUsers).toHaveBeenCalledWith(userManagerStub.users, 'test');
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.users-page')).length).toEqual(1);
            expect(element.queryAll(By.css('.col-4')).length).toEqual(1);
        });
        it('depending on whether a user is selected', function() {
            expect(element.queryAll(By.css('.col-8')).length).toEqual(0);

            userStateStub.selectedUser = user;
            userManagerStub.users = [user];
            fixture.detectChanges();
            expect(element.queryAll(By.css('.col-8')).length).toEqual(1);
        });
        it('with a button to create a user', function() {
            const button = element.query(By.css('.col-4 button[color="primary"]'));
            expect(button).toBeDefined();
            expect(button.nativeElement.textContent.trim()).toEqual('Create User');
        });
        it('with an input for searching', function() {
            expect(element.queryAll(By.css('.user-search mat-form-field input')).length).toEqual(1);
        });
        it('with a users-list', function() {
            expect(element.queryAll(By.css('users-list')).length).toEqual(1);
        });
        it('with a mat-slide-toggle when a user is selected', function() {
            userStateStub.selectedUser = user;
            userManagerStub.users = [user];
            fixture.detectChanges();
            expect(element.queryAll(By.css('mat-slide-toggle')).length).toEqual(1);
        });
        it('with a button to reset the password when a user is selected', function() {
            userStateStub.selectedUser = user;
            userManagerStub.users = [user];
            fixture.detectChanges();
            expect(element.queryAll(By.css('.col-8 button.mat-raised-button[color="primary"]')).length).toEqual(1);
        });
        it('with a button to delete when a user is selected', function() {
            userStateStub.selectedUser = user;
            userManagerStub.users = [user];
            fixture.detectChanges();
            expect(element.queryAll(By.css('.col-8 .user-title button[color="warn"]')).length).toEqual(1);
        });
        it('with a button to edit the user profile when a user is selected', function() {
            userStateStub.selectedUser = user;
            userManagerStub.users = [user];
            fixture.detectChanges();
            expect(element.queryAll(By.css('.col-8 button.mat-icon-button[color="primary"]')).length).toEqual(1);
        });
        it('with a .user-profile when a user is selected', function() {
            userStateStub.selectedUser = user;
            userManagerStub.users = [user];
            fixture.detectChanges();
            const profile = element.query(By.css('.user-profile'));
            expect(profile).toBeDefined();
            expect(profile.nativeElement.textContent.trim()).toContain(user.firstName);
        });
        it('with a .user-groups-list when a user is selected', function() {
            userStateStub.selectedUser = user;
            userManagerStub.users = [user];
            const group1: Group = {
                title: 'group',
                description: '',
                roles: [],
                members: ['batman'],
                external: false
            };
            const group2: Group = {
                title: 'group',
                description: '',
                roles: ['admin'],
                members: ['batman'],
                external: false
            };
            userManagerStub.groups = [group1, group2];
            component.ngOnInit();
            fixture.detectChanges();
            const list = element.query(By.css('.user-groups-list'));
            expect(list).toBeDefined();
            expect(list.queryAll(By.css('li')).length).toEqual(component.groups.length);
            expect(list.queryAll(By.css('li .admin')).length).toEqual(1);
        });
        it('depending on whether the current user is an admin', async function() {
            component.isAdmin = false;
            userStateStub.selectedUser = user;
            userManagerStub.users = [user];
            userManagerStub.isAdmin.and.returnValue(component.isAdmin);
            fixture.detectChanges();
            await fixture.whenStable();
            
            const deleteButton = element.query(By.css('.col-8 .user-title button[color="warn"]'));
            const resetButton = element.query(By.css('.col-8 button.mat-raised-button[color="primary"]'));
            const createButton = element.query(By.css('.col-4 button[color="primary"]'));
            const editButton = element.query(By.css('.col-8 button.mat-icon-button[color="primary"]'));
            expect(deleteButton.properties['disabled']).toBeTruthy();
            expect(resetButton.properties['disabled']).toBeTruthy();
            expect(createButton.properties['disabled']).toBeTruthy();
            expect(editButton.properties['disabled']).toBeTruthy();

            component.isAdmin = true;
            fixture.detectChanges();
            expect(deleteButton.properties['disabled']).toBeFalsy();
            expect(resetButton.properties['disabled']).toBeFalsy();
            expect(createButton.properties['disabled']).toBeFalsy();
            expect(editButton.properties['disabled']).toBeFalsy();
        });
        it('depending on whether a user is external', function() {
            userStateStub.selectedUser = user;
            userManagerStub.isAdmin.and.returnValue(true);
            userManagerStub.users = [user];
            fixture.detectChanges();
            const deleteButton = element.query(By.css('.col-8 .user-title button[color="warn"]'));
            const resetButton = element.query(By.css('.col-8 button.mat-raised-button[color="primary"]'));
            const editButton = element.query(By.css('.col-8 button.mat-icon-button[color="primary"]'));
            expect(deleteButton.properties['disabled']).toBeFalsy();
            expect(resetButton.properties['disabled']).toBeFalsy();
            expect(editButton.properties['disabled']).toBeFalsy();

            userStateStub.selectedUser.external = true;
            fixture.detectChanges();
            expect(deleteButton.properties['disabled']).toBeTruthy();
            expect(resetButton.properties['disabled']).toBeTruthy();
            expect(editButton.properties['disabled']).toBeTruthy();
        });
        it('depending on whether the selected user is the current user', function() {
            userStateStub.selectedUser = user;
            userManagerStub.isAdmin.and.returnValue(true);
            userManagerStub.users = [user];
            fixture.detectChanges();
            const deleteButton = element.query(By.css('.col-8 .user-title button[color="warn"]'));
            const adminToggle = element.query(By.css('.mat-slide-toggle-input'));
            expect(deleteButton.properties['disabled']).toBeFalsy();
            expect(adminToggle.properties['disabled']).toBeFalsy();

            component.selectedCurrentUser = true;
            fixture.detectChanges();
            expect(deleteButton.properties['disabled']).toBeTruthy();
            expect(adminToggle.properties['disabled']).toBeTruthy();
        });
        it('depending on whether the selected user is the admin user', function() {
            userStateStub.selectedUser = user;
            userManagerStub.isAdmin.and.returnValue(true);
            userManagerStub.users = [user];
            fixture.detectChanges();
            const deleteButton = element.query(By.css('.col-8 .user-title button[color="warn"]'));
            const adminToggle = element.query(By.css('.mat-slide-toggle-input'));
            expect(deleteButton.properties['disabled']).toBeFalsy();
            expect(adminToggle.properties['disabled']).toBeFalsy();

            component.selectedAdminUser = true;
            fixture.detectChanges();
            expect(deleteButton.properties['disabled']).toBeTruthy();
            expect(adminToggle.properties['disabled']).toBeTruthy();
        });
    });
    it('should call createUser when the button is clicked', function() {
        spyOn(component, 'createUser');
        const createButton = element.query(By.css('.col-4 button[color="primary"]'));
        createButton.triggerEventHandler('click', null);
        expect(component.createUser).toHaveBeenCalledWith();
    });
    it('should call editProfile when the button is clicked', function() {
        userStateStub.selectedUser = user;
        userManagerStub.users = [user];
        fixture.detectChanges();
        spyOn(component, 'editProfile');
        const editButton = element.query(By.css('.col-8 button.mat-icon-button[color="primary"]'));
        editButton.triggerEventHandler('click', null);
        expect(component.editProfile).toHaveBeenCalledWith();
    });
    it('should call confirmDeleteUser when the button is clicked', function() {
        userStateStub.selectedUser = user;
        userManagerStub.users = [user];
        fixture.detectChanges();
        spyOn(component, 'confirmDeleteUser');
        const deleteButton = element.query(By.css('.col-8 .user-title button[color="warn"]'));
        deleteButton.triggerEventHandler('click', null);
        expect(component.confirmDeleteUser).toHaveBeenCalledWith();
    });
    it('should call resetPassword when the button is clicked', function() {
        userStateStub.selectedUser = user;
        userManagerStub.users = [user];
        fixture.detectChanges();
        spyOn(component, 'resetPassword');
        const resetButton = element.query(By.css('.col-8 button.mat-raised-button[color="primary"]'));
        resetButton.triggerEventHandler('click', null);
        expect(component.resetPassword).toHaveBeenCalledWith();
    });
});

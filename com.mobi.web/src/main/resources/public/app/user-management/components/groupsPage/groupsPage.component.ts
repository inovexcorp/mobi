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
import { Component, OnInit } from '@angular/core';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MatDialog } from '@angular/material/dialog';
import { includes, get, noop } from 'lodash';

import { UserStateService } from '../../../shared/services/userState.service';
import { UserManagerService } from '../../../shared/services/userManager.service';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { CreateGroupOverlayComponent } from '../createGroupOverlay/createGroupOverlay.component';
import { EditGroupInfoOverlayComponent } from '../editGroupInfoOverlay/editGroupInfoOverlay.component';
import { Group } from '../../../shared/models/group.interface';
import { User } from '../../../shared/models/user.interface';
import { UtilService } from '../../../shared/services/util.service';
import { LoginManagerService } from '../../../shared/services/loginManager.service';

/**
 * @class groupsPage.GroupsPageComponent
 *
 * A component that creates a Bootstrap `row` div with functionality to select and edit a group. The left column
 * contains a {@link user-management.GroupsListComponent list of groups} for selecting the current
 * {@link shared.UserStateService#selectedGroup group} and a button to create a Group. On the right is a display of the
 * group's title, description, the {@link user-management.MemberTableComponent members} of the group, and buttons to
 * toggle user the group is an admin and deleting the group.
 */
@Component({
    selector: 'groups-page',
    templateUrl: './groupsPage.component.html',
    styleUrls: ['./groupsPage.component.scss']
})
export class GroupsPageComponent implements OnInit {
    isAdmin = false;
    filteredGroups: Group[] = [];
    selectedAdmin = false;

    constructor(private dialog: MatDialog, public state: UserStateService, private um: UserManagerService,
        private lm: LoginManagerService, private util: UtilService) {}
    
    ngOnInit(): void {
        this.filteredGroups = this.um.groups;
        this.setAdmin();
        this.isAdmin = this.um.isAdmin(this.lm.currentUser);
    }
    selectGroup(group: Group): void {
        this.state.selectedGroup = group;
        this.setAdmin();
    }
    createGroup(): void {
        this.dialog.open(CreateGroupOverlayComponent);
    }
    onSearch(searchString: string): void {
        this.state.groupSearchString = searchString;
        this.setGroups();
    }
    changeAdmin(event: MatSlideToggleChange): void {
        const request = event.checked ? this.um.addGroupRoles(this.state.selectedGroup.title, ['admin']) : this.um.deleteGroupRole(this.state.selectedGroup.title, 'admin');
        request.subscribe(noop, this.util.createErrorToast);
    }
    confirmDeleteGroup(): void {
        this.dialog.open(ConfirmModalComponent, {
            data: {
                content: 'Are you sure you want to remove <strong>' + this.state.selectedGroup.title + '</strong>?'
            }
        }).afterClosed().subscribe((result: boolean) => {
            if (result) {
                this.deleteGroup();
            }
        });
    }
    editDescription(): void {
        this.dialog.open(EditGroupInfoOverlayComponent);
    }
    setAdmin(): void {
        this.selectedAdmin = includes(get(this.state.selectedGroup, 'roles', []), 'admin');
    }
    deleteGroup(): void {
        this.um.deleteGroup(this.state.selectedGroup.title)
            .subscribe(() => {
                this.state.selectedGroup = undefined;
                this.setAdmin();
            }, error => this.util.createErrorToast(error));
    }
    addMember(member: User): void {
        this.um.addUserGroup(member.username, this.state.selectedGroup.title).subscribe(() => {
            this.util.createSuccessToast('Successfully added member');
        }, error => this.util.createErrorToast(error));
    }
    confirmRemoveMember(member: string): void {
        this.dialog.open(ConfirmModalComponent, {
            data: {
                content: 'Are you sure you want to remove <strong>' + member + '</strong> from <strong>' + this.state.selectedGroup.title + '</strong>?'
            }
        }).afterClosed().subscribe((result: boolean) => {
            if (result) {
                this.removeMember(member);
            }
        });
    }
    removeMember(member: string): void {
        this.um.deleteUserGroup(member, this.state.selectedGroup.title).subscribe(() => {
            this.util.createSuccessToast('Successfully removed member');
        }, error => this.util.createErrorToast(error));
    }
    private setGroups(): void {
        this.filteredGroups = this.um.filterGroups(this.um.groups, this.state.groupSearchString);
    }
}

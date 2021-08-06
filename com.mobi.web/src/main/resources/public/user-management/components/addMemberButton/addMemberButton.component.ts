import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { MatMenuTrigger } from '@angular/material';
import { filter, includes } from 'lodash';

import { User } from '../../../shared/models/user.interface';
import { UserManagerService } from '../../../shared/services/userManager.service';
import { UserStateService } from '../../../shared/services/userState.service';

/**
 * @class user-management.AddMemberButtonComponent
 *
 * A component that creates a Material Button which will trigger a dropdown for adding a member to a Group. The form
 * within the dropdown is populated by the provided list of exiting members and the mechanism for adding a new member is
 * controlled by the provided function.
 */
@Component({
    selector: 'add-member-button',
    templateUrl: './addMemberButton.component.html'
})
export class AddMemberButtonComponent {
    /**
     * A list of usernames of the existing members of the Group to be edited
     * @type {string[]}
     */
    @Input() existingMembers: string[];
    /**
     * A method to be run when adding a member. It's expected for this method to handle the addition of the member to
     * the list of `existingMembers`. Takes the new member as an argument in the form of a {@link User} object.
     */
    @Output() addMember = new EventEmitter<User>();

    @ViewChild('trigger') trigger: MatMenuTrigger;

    userFilter;
    availableUsers: User[] = [];
    filteredAvailableUsers: User[] = [];
    selectedMember: User;

    constructor(private state: UserStateService, private um: UserManagerService) {}

    emitAddMember(member: User): void {
        this.addMember.emit(member);
        this.clearAddMember();
        this.trigger.closeMenu();
    }
    setAvailableUsers(): void {
        this.availableUsers = filter(this.um.users, (user: User) => !includes(this.existingMembers, user.username));
        this.setFilteredUsers();
    }
    setFilteredUsers(): void {
        this.filteredAvailableUsers = this.um.filterUsers(this.availableUsers, typeof this.userFilter === 'string' ? this.userFilter : this.userFilter ? this.userFilter.username : undefined);
    }
    selectMember(member: User): void {
        this.selectedMember = member;
    }
    cancelAdd(): void {
        this.clearAddMember();
        this.trigger.closeMenu();
    }
    clearAddMember(): void {
        this.selectedMember = undefined;
        this.userFilter = undefined;
    }
    getName(user: User): string {
        return (user ? (user.firstName || user.lastName) ? (user.firstName + ' ' + user.lastName) : user.username : '').trim();
    }
}
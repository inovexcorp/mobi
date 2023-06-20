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
import { find, cloneDeep, replace } from 'lodash';
import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';

import { UserManagerService } from '../../../shared/services/userManager.service';
import { User } from '../../../shared/models/user.interface';
import { FOAF } from '../../../prefixes';
import { LoginManagerService } from '../../../shared/services/loginManager.service';

/**
 * @name settings.ProfileTabComponent
 *
 * `profileTab` is a component that creates a Bootstrap `row` with a form allowing the current user to change their
 * profile information. This information includes their first name, last name, and email address.
 */
@Component({
    selector: 'profile-tab',
    templateUrl: './profileTab.component.html',
})
export class ProfileTabComponent implements OnInit {
    currentUser: User = undefined;
    errorMessage: string;
    success: boolean;
    profileForm = this.fb.group({
        firstName: [''],
        lastName: [''],
        email: ['', [ Validators.email ]]
    });

    constructor(private um: UserManagerService, private lm: LoginManagerService,
        private fb: UntypedFormBuilder) {}

    ngOnInit(): void {
        this.currentUser = cloneDeep(find(this.um.users, { username: this.lm.currentUser }));
        this.errorMessage = '';
        this.profileForm.setValue({
            firstName: this.currentUser.firstName,
            lastName: this.currentUser.lastName,
            email: replace(this.currentUser.email, 'mailto:', '')
        });
        if (this.currentUser.external) {
            Object.keys(this.profileForm.controls).forEach(controlName => {
                this.profileForm.controls[controlName].disable();
            });
        }
    }

    reset(): void {
        this.profileForm.markAsPristine();
    }
    
    save(): void {
        if (this.profileForm.controls.firstName.value) {
            this.currentUser.jsonld[FOAF + 'firstName'] = [{'@value': this.profileForm.controls.firstName.value}];
            this.currentUser.firstName = this.profileForm.controls.firstName.value;
        } else {
            delete this.currentUser.jsonld[FOAF + 'firstName'];
            this.currentUser.firstName = '';
        }
        if (this.profileForm.controls.lastName.value) {
            this.currentUser.jsonld[FOAF + 'lastName'] = [{'@value': this.profileForm.controls.lastName.value}];
            this.currentUser.lastName = this.profileForm.controls.lastName.value;
        } else {
            delete this.currentUser.jsonld[FOAF + 'lastName'];
            this.currentUser.lastName = '';
        }
        if (this.profileForm.controls.email.value) {
            this.currentUser.jsonld[FOAF + 'mbox'] = [{'@id': 'mailto:' + this.profileForm.controls.email.value}];
            this.currentUser.email = this.profileForm.controls.email.value;
        } else {
            delete this.currentUser.jsonld[FOAF + 'mbox'];
            this.currentUser.email = '';
        }
        this.um.updateUser(this.currentUser.username, this.currentUser)
            .subscribe(() => {
                this.errorMessage = '';
                this.success = true;
                this.reset();
            }, error => {
                this.errorMessage = error;
                this.success = false;
            });
    }
}

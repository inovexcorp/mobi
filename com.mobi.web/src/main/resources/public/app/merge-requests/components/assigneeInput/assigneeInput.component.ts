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
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete'; 
import { MatChipInputEvent } from '@angular/material/chips';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { User } from '../../../shared/models/user.interface';
import { UserManagerService } from '../../../shared/services/userManager.service';

@Component({
    selector: 'assignee-input',
    templateUrl: './assigneeInput.component.html'
})
export class AssigneeInputComponent implements OnInit {
    filteredUsers: Observable<User[]>;
    separatorKeysCodes: number[] = [ENTER, COMMA];
   
    @Input() parentForm: UntypedFormGroup;
    @Input() selected: string[];

    @Output() selectedChange = new EventEmitter<string[]>();

    @ViewChild('assigneeInput', { static: true }) assigneeInput: ElementRef;

    constructor(private um: UserManagerService) {}

    ngOnInit(): void {
        this.filteredUsers = this.parentForm.controls.assignees.valueChanges.pipe(
            startWith<string | User>(''),
            map(val => {
                const searchText = typeof val === 'string' ? 
                    val : 
                    val ? 
                        val.username :
                        undefined;
                return this.um.filterUsers(this.um.users, searchText);
            }));
    }

    add(event: MatChipInputEvent): void {
        const input = event.input;
        const value = event.value;
    
        if (value) {
            this.selected.push(value);
            this.selectedChange.emit(this.selected);
        }
    
        // Reset the input value
        if (input) {
            input.value = '';
        }
    
        this.parentForm.controls.assignees.setValue(null);
    }
    removeAssignee(user: string): void {
        const index = this.selected.indexOf(user);
    
        if (index >= 0) {
            this.selected.splice(index, 1);
            this.selectedChange.emit(this.selected);
        }
    }
    select(event: MatAutocompleteSelectedEvent): void {
        this.selected.push(event.option.value);
        this.selectedChange.emit(this.selected);
        this.assigneeInput.nativeElement.value = '';
        this.parentForm.controls.assignees.setValue(null);
      }
}

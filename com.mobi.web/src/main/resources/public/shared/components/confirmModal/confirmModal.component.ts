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
import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

import './confirmModal.component.scss';

/**
 * @class shared.ConfirmModalComponent
 * 
 * A component that creates content for a modal that will confirm or deny an action being taken. Meant to be used in
 * conjunction with the `MatDialog` service. If the action is confirmed, the dialog will be closed with a `true` value.
 * If the action is denied, the dialog will be closed with a `false` value.
 */
@Component({
    selector: 'confirm-modal',
    templateUrl: './confirmModal.component.html'
})
export class ConfirmModalComponent {
    constructor(@Inject(MAT_DIALOG_DATA) public data: any, private dialogRef: MatDialogRef<ConfirmModalComponent>) {}

    confirm(): void {
        this.dialogRef.close(true);
    }
    deny(): void {
        this.dialogRef.close(false);
    }
}

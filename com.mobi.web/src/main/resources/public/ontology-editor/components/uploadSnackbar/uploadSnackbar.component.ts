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
import { animate, style, transition, trigger } from '@angular/animations';
import { Component, EventEmitter, OnDestroy, Output } from '@angular/core';
import { MatDialog } from '@angular/material';

import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { OntologyUploadItem } from '../../../shared/models/ontologyUploadItem.interface';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { UploadErrorsOverlayComponent } from '../uploadErrorsOverlay/uploadErrorsOverlay.component';

import './uploadSnackbar.component.scss';

/**
 * @class ontology-editor.UploadSnackbarComponent
 *
 * A component that creates a custom Material Design `snackbar` on the right of the screen with a body containing the
 * list of ontologies currently being uploaded. The list displays the ontology record title and an indicator of the
 * status of the upload. The header of the snackbar contains an indicator of how many ontologies have been uploaded and
 * buttons to minimize the body of the snackbar and close it. Whether the snackbar should be shown is handled by the
 * provided boolean variable.
 *
 * @param {Function} closeEvent An emitted that gets fired when the snackbar is closed
 */
@Component({
    selector: 'upload-snackbar',
    templateUrl: './uploadSnackbar.component.html',
    animations: [
        trigger('enterLeave', [
            transition(':enter', [
                style({
                    opacity: 0,
                    transform: 'translateY(100%)'
                }),
                animate('.15s cubic-bezier(0.4, 0, 1, 1)', style({
                    opacity: 1,
                    transform: 'translateY(-1.5rem)'
                }))
            ]),
            transition(':leave', [
                style({
                    opacity: 1,
                    transform: 'translateY(-1.5rem)'
                }),
                animate('.13s cubic-bezier(0.4, 0, 1, 1)', style({
                    opacity: 0,
                    transform: 'translateY(100%)'
                }))
            ])
        ])
    ]
})
export class UploadSnackbarComponent implements OnDestroy {
    collapse = false;

    @Output() closeEvent = new EventEmitter<null>();
    
    constructor(public os: OntologyStateService, private dialog: MatDialog) {}

    ngOnDestroy(): void {
        this.close();
    }
    attemptClose(): void {
        if (this.os.uploadPending > 0) {
            this.dialog.open(ConfirmModalComponent, {
                data: {
                    content: 'Closing the snackbar will cancel all pending uploads. Are you sure you want to proceed?'
                }
            }).afterClosed().subscribe(result => {
                if (result) {
                    this.close();
                }
            });
        } else {
            this.close();
        }
    }
    close(): void {
        this.closeEvent.emit();
        this.os.uploadList.forEach(item => item.sub.unsubscribe());
        this.os.uploadList = [];
        this.os.uploadFiles = [];
        this.os.uploadPending = 0;
    }
    getTitle(): string {
        if (this.os.uploadPending > 0) {
            return 'Uploading ' + (this.os.uploadPending === 1 ? '1 item' : this.os.uploadPending + ' items');
        } else {
            return this.os.uploadList.length + ' upload(s) complete';
        }
    }
    showUploadErrorsOverlay(item: OntologyUploadItem): void {
        this.dialog.open(UploadErrorsOverlayComponent, {data: { item }});
    }
}

/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { LoginManagerService } from '../../../shared/services/loginManager.service';
import { UserManagerService } from '../../../shared/services/userManager.service';
import { getDctermsId, getDctermsValue, getPropertyId } from '../../../shared/utility';
import { MERGEREQ } from '../../../prefixes';

/**
 * @class merge-requests.CommentDisplayComponent
 *
 * A component which creates a div containing a display of the provided Comment on the provided Merge Request. The
 * display includes the user who made the comment, the datetime is was made, and the body of the comment rendered as
 * HTML Markdown. If the current user is the one who made the comment, a button to remove the comment is shown on hover
 * of the body.
 *
 * @param {MergeRequest} request An object representing the Merge Request the Comment belongs to
 * @param {JSONLDObject} comment The Comment to display
 * @param {boolean} isReply Whether the Comment is a reply comment
 * @param {boolean} accepted Whether the Request has been accepted
 * @param {Function} delete The Function to call to delete a comment
 */
@Component({
    selector: 'comment-display',
    templateUrl: './commentDisplay.component.html',
    styleUrls: ['./commentDisplay.component.scss']
})
export class CommentDisplayComponent implements OnInit, OnChanges {
    commentText = '';
    creatorIRI = '';
    creatorUsername = '';
    creator = '';
    isCreator: boolean;
    issued = '';
    modified = '';
    edit = false;
    edited = false;
    updatedComment = '';
    tooltip = '';

    private _comment: JSONLDObject;

    @Input() isReply: boolean;
    @Input() requestStatus: string;
    @Input() editInProgress: boolean;
    @Input() set comment(value: JSONLDObject) {
        this._comment = value;
        this.commentText = getDctermsValue(value, 'description');
        this.creatorIRI = getDctermsId(value, 'creator');
        const user = this.um.users.find(user => user.iri === this.creatorIRI);
        this.creatorUsername = user ? user.username : '[Not Available]';
        this.creator = user ? user.displayName : '[Not Available]';
        this.isCreator = this.lm.currentUserIRI === this.creatorIRI;
        this.issued = getDctermsValue(value, 'issued');
        this.modified = getDctermsValue(value, 'modified');
    }
    get comment(): JSONLDObject {
        return this._comment;
    }
    
    @Output() delete = new EventEmitter<string>();
    @Output() editInProgressChange = new EventEmitter<boolean>();
    @Output() saveEdit = new EventEmitter<{
        commentId:string,
        mergeRequestId: string,
        newComment: string
    }>();

    constructor(private dialog: MatDialog, private um: UserManagerService, private lm: LoginManagerService) {}

    ngOnInit(): void {
        if (this._comment) {
            this.edited = !(this.issued === this.modified);
        }

        this.createTooltip();
    }

    ngOnChanges(): void {
        this.createTooltip();
    }

    confirmDelete(): void {
        this.dialog.open(ConfirmModalComponent, {
            data: {
                content: 'Are you sure you want to delete this comment?'
            }
        }).afterClosed().subscribe((result: boolean) => {
            if (result) {
                this.delete.emit(this.comment['@id']);
            }
        });
    }

    editComment(): void {
        this.edit = true;
        this.editInProgress = !this.editInProgress;
        this.updatedComment = this.commentText;
        this.editInProgressChange.emit(this.editInProgress);
    }

    save(): void {
        const commentId = this._comment['@id'];
        const mergeRequestId = getPropertyId(this._comment, `${MERGEREQ}onMergeRequest`);
        const details = {
            commentId,
            mergeRequestId,
            newComment: this.updatedComment
        };
        this.updatedComment = '';
        this.edit = false;
        this.editInProgress = !this.editInProgress;
        this.editInProgressChange.emit(this.editInProgress);
        this.saveEdit.emit(details);
    }

    cancel(): void {
        this.updatedComment = '';
        this.edit = false;
        this.editInProgress = !this.editInProgress;
        this.editInProgressChange.emit(this.editInProgress);
    }

    private createTooltip(): void {
        this.tooltip = this.editInProgress ? 'Editing has been disabled as there is already an edit in progress' :
            'Click to edit';
    }
}

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

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { switchMap } from 'rxjs/operators';

import { MergeRequest } from '../../../shared/models/mergeRequest.interface';
import { MergeRequestManagerService } from '../../../shared/services/mergeRequestManager.service';
import { ToastService } from '../../../shared/services/toast.service';

/**
 * @class merge-requests.ReplyCommentComponent
 *
 * A component which creates a div containing a box indicating a reply can be made. Once that
 * box is clicked, it is replaced with a {@link shared.MarkdownEditorComponent} for submitting a reply
 * to the provided parent comment of the provided request.
 *
 * @param {MergeRequest} request An object representing the Merge Request with the parent comment
 * @param {string} parentId The IRI id of the parent comment this component will reply to
 */
@Component({
    selector: 'reply-comment',
    templateUrl: './replyComment.component.html'
})
export class ReplyCommentComponent {
    edit = false;
    replyComment = '';

    @Input() parentId: string;
    @Input() request: MergeRequest;
    @Output() requestChange = new EventEmitter<MergeRequest>();
    
    constructor(public mm: MergeRequestManagerService, private toast: ToastService) {}

    reply(): void {
        this.mm.createComment(this.request.jsonld['@id'], this.replyComment, this.parentId)
            .pipe(
                switchMap(() => {
                    this.replyComment = '';
                    this.edit = false;
                    return this.mm.getComments(this.request.jsonld['@id']);
                })
            )
            .subscribe(comments => {
                this.request.comments = comments;
                this.requestChange.emit(this.request);
            }, error => this.toast.createErrorToast(error));
    }
    cancel(): void {
        this.replyComment = '';
        this.edit = false;
    }
}

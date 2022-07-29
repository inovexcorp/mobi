/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import { Component, EventEmitter, Inject, Input, Output } from '@angular/core';
import { switchMap } from 'rxjs/operators';

import { MergeRequest } from '../../../shared/models/mergeRequest.interface';
import { MergeRequestManagerService } from '../../../shared/services/mergeRequestManager.service';

import './mergeRequestDiscussion.component.scss';

/**
 * @class merge-requests.MergeRequestDiscussionComponent
 *
 * A component which creates a div containing {@link marge-requsets.CommentDisplayComponent comment displays} of the
 * comment chains on a merge request along with a {@link shared.MarkdownEditorComponent} for making new comments and
 * {@link merge-requests.ReplyCommentComponent reply comments} on comment chains. If a request is accepted,
 * no markdown editors are shown since the discussion on the request is now read only.
 *
 * @param {MergeRequest} request A Merge Request with comments
 */
@Component({
    selector: 'merge-request-discussion',
    templateUrl: './mergeRequestDiscussion.component.html'
})
export class MergeRequestDiscussionComponent {
    newComment = '';
    isAccepted = false;

    private _request: MergeRequest;

    @Input() set request(value: MergeRequest) {
        this._request = value;
        this.isAccepted = this.mm.isAccepted(this.request.jsonld);
    }

    get request(): MergeRequest {
        return this._request;
    }

    @Output() requestChange = new EventEmitter<MergeRequest>();

    constructor(public mm: MergeRequestManagerService, @Inject('utilService') public util) {}

    saveComment(): void {
        this.mm.createComment(this.request.jsonld['@id'], this.newComment)
            .pipe(
                switchMap(() => {
                    this.newComment = '';
                    return this.mm.getComments(this.request.jsonld['@id']);
                })
            )
            .subscribe(comments => {
                this.request.comments = comments;
                this.requestChange.emit(this.request);
            }, error => this.util.createErrorToast(error));
    }
    deleteComment(commentId: string): void {
        this.mm.deleteComment(this.request.jsonld['@id'], commentId)
            .pipe(
                switchMap(() => {
                    return this.mm.getComments(this.request.jsonld['@id']);
                })
            )
            .subscribe(comments => {
                this.request.comments = comments;
                this.requestChange.emit(this.request);
            }, error => this.util.createErrorToast(error));
    }
}

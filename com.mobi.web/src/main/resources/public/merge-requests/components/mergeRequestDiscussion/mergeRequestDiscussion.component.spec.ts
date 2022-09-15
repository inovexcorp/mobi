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
import { DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import {
    cleanStylesFromDOM,
} from '../../../../../../test/ts/Shared';
import { MarkdownEditorComponent } from '../../../shared/components/markdownEditor/markdownEditor.component';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { MergeRequest } from '../../../shared/models/mergeRequest.interface';
import { MergeRequestManagerService } from '../../../shared/services/mergeRequestManager.service';
import { UtilService } from '../../../shared/services/util.service';
import { CommentDisplayComponent } from '../commentDisplay/commentDisplay.component';
import { ReplyCommentComponent } from '../replyComment/replyComment.component';
import { MergeRequestDiscussionComponent } from './mergeRequestDiscussion.component';

describe('Merge Request Discussion component', function() {
    let component: MergeRequestDiscussionComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<MergeRequestDiscussionComponent>;
    let mergeRequestManagerStub: jasmine.SpyObj<MergeRequestManagerService>;
    let utilStub: jasmine.SpyObj<UtilService>;

    const request: MergeRequest = {
        jsonld: {'@id': 'request', '@type': []},
        title: '',
        creator: '',
        date: '',
        recordIri: '',
        assignees: []
    };
    const newComment = 'WOW';

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [],
            declarations: [
                MergeRequestDiscussionComponent,
                MockComponent(CommentDisplayComponent),
                MockComponent(MarkdownEditorComponent),
                MockComponent(ReplyCommentComponent)
            ],
            providers: [
                MockProvider(MergeRequestManagerService),
                MockProvider(UtilService),
            ],
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(MergeRequestDiscussionComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        mergeRequestManagerStub = TestBed.get(MergeRequestManagerService);
        utilStub = TestBed.get(UtilService);
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        mergeRequestManagerStub = null;
        utilStub = null;
    });

    describe('controller methods', function() {
        describe('should comment on the request', function() {
            beforeEach(function() {
                component.newComment = newComment;
                component.request = Object.assign({}, request);
            });
            describe('if createComment resolves', function() {
                beforeEach(function() {
                    mergeRequestManagerStub.createComment.and.returnValue(of(null));
                    spyOn(component.requestChange, 'emit');
                });
                it('and getComments resolves', fakeAsync(function() {
                    const comments: JSONLDObject[][] = [[{'@id': 'comment'}]];
                    mergeRequestManagerStub.getComments.and.returnValue(of(comments));
                    component.saveComment();
                    tick();
                    expect(mergeRequestManagerStub.createComment).toHaveBeenCalledWith(request.jsonld['@id'], newComment);
                    expect(component.newComment).toEqual('');
                    expect(mergeRequestManagerStub.getComments).toHaveBeenCalledWith(request.jsonld['@id']);
                    expect(component.request.comments).toEqual(comments);
                    expect(component.requestChange.emit).toHaveBeenCalledWith(component.request);
                    expect(utilStub.createErrorToast).not.toHaveBeenCalled();
                }));
                it('unless getComments rejects', fakeAsync(function() {
                    mergeRequestManagerStub.getComments.and.returnValue(throwError('Error message'));
                    component.saveComment();
                    tick();
                    expect(mergeRequestManagerStub.createComment).toHaveBeenCalledWith(request.jsonld['@id'], newComment);
                    expect(component.newComment).toEqual('');
                    expect(mergeRequestManagerStub.getComments).toHaveBeenCalledWith(request.jsonld['@id']);
                    expect(component.request.comments).toBeUndefined();
                    expect(utilStub.createErrorToast).toHaveBeenCalledWith('Error message');
                }));
            });
            it('unless createComment rejects', fakeAsync(function() {
                mergeRequestManagerStub.createComment.and.returnValue(throwError('Error message'));
                component.saveComment();
                tick();
                expect(mergeRequestManagerStub.createComment).toHaveBeenCalledWith(request.jsonld['@id'], newComment);
                expect(component.newComment).toEqual(newComment);
                expect(mergeRequestManagerStub.getComments).not.toHaveBeenCalled();
                expect(component.request.comments).toBeUndefined();
                expect(utilStub.createErrorToast).toHaveBeenCalledWith('Error message');
            }));
        });
        describe('should delete the comment', function() {
            beforeEach(function() {
                component.request = Object.assign({}, request);
                spyOn(component.requestChange, 'emit');
            });
            describe('if deleteComment resolves', function() {
                beforeEach(function() {
                    mergeRequestManagerStub.deleteComment.and.returnValue(of(null));
                });
                it('and getComments resolves', fakeAsync(function() {
                    const comments: JSONLDObject[][] = [[{'@id': 'othercomment'}]];
                    mergeRequestManagerStub.getComments.and.returnValue(of(comments));
                    component.deleteComment('id');
                    tick();
                    expect(mergeRequestManagerStub.deleteComment).toHaveBeenCalledWith(request.jsonld['@id'], 'id');
                    expect(mergeRequestManagerStub.getComments).toHaveBeenCalledWith(request.jsonld['@id']);
                    expect(component.request.comments).toEqual(comments);
                    expect(component.requestChange.emit).toHaveBeenCalledWith(component.request);
                    expect(utilStub.createErrorToast).not.toHaveBeenCalled();
                }));
                it('unless getComments rejects', fakeAsync(function() {
                    mergeRequestManagerStub.getComments.and.returnValue(throwError('Error message'));
                    component.deleteComment('id');
                    tick();
                    expect(mergeRequestManagerStub.deleteComment).toHaveBeenCalledWith(request.jsonld['@id'], 'id');
                    expect(mergeRequestManagerStub.getComments).toHaveBeenCalledWith(request.jsonld['@id']);
                    expect(component.request.comments).toBeUndefined();
                    expect(utilStub.createErrorToast).toHaveBeenCalledWith('Error message');
                }));
            });
            it('unless deleteComment rejects', fakeAsync(function() {
                mergeRequestManagerStub.deleteComment.and.returnValue(throwError('Error message'));
                component.deleteComment('id');
                tick();
                expect(mergeRequestManagerStub.deleteComment).toHaveBeenCalledWith(request.jsonld['@id'], 'id');
                expect(mergeRequestManagerStub.getComments).not.toHaveBeenCalled();
                expect(component.request.comments).toBeUndefined();
                expect(utilStub.createErrorToast).toHaveBeenCalledWith('Error message');
            }));
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.merge-request-discussion')).length).toEqual(1);
        });
        it('depending on how many comments have been made', function() {
            expect(element.queryAll(By.css('.comment-chain')).length).toEqual(0);
            expect(element.queryAll(By.css('comment-display')).length).toEqual(0);

            component.request = Object.assign({}, request);
            component.request.comments = [[{'@id': '0'}, {'@id': '1'}], [{'@id': '2'}]];
            fixture.detectChanges();
            expect(element.queryAll(By.css('.comment-chain')).length).toEqual(2);
            expect(element.queryAll(By.css('comment-display')).length).toEqual(3);
        });
        it('if the request is accepted', function() {
            component.isAccepted = false;
            component.request = Object.assign({}, request);
            component.request.comments = [[{'@id': '0'}, {'@id': '1'}], [{'@id': '2'}]];
            fixture.detectChanges();
            expect(element.queryAll(By.css('.new-comment')).length).toEqual(1);
            expect(element.queryAll(By.css('markdown-editor')).length).toEqual(1);
            expect(element.queryAll(By.css('reply-comment')).length).toEqual(2);

            component.isAccepted = true;
            fixture.detectChanges();
            expect(element.queryAll(By.css('.new-comment')).length).toEqual(0);
            expect(element.queryAll(By.css('markdown-editor')).length).toEqual(0);
            expect(element.queryAll(By.css('reply-comment')).length).toEqual(0);
        });
    });
});

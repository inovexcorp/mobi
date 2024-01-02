/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import {
    cleanStylesFromDOM,
} from '../../../../../public/test/ts/Shared';
import { MarkdownEditorComponent } from '../../../shared/components/markdownEditor/markdownEditor.component';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { MergeRequest } from '../../../shared/models/mergeRequest.interface';
import { MergeRequestManagerService } from '../../../shared/services/mergeRequestManager.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ReplyCommentComponent } from './replyComment.component';

describe('Reply Comment component', function() {
    let component: ReplyCommentComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<ReplyCommentComponent>;
    let mergeRequestManagerStub: jasmine.SpyObj<MergeRequestManagerService>;
    let toastStub: jasmine.SpyObj<ToastService>;

    const request: MergeRequest = {
        jsonld: {'@id': 'request', '@type': []},
        title: '',
        creator: '',
        date: '',
        recordIri: '',
        assignees: []
    };
    const replyComment = 'WOW';

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [],
            declarations: [
                ReplyCommentComponent,
                MockComponent(MarkdownEditorComponent),
            ],
            providers: [
                MockProvider(MergeRequestManagerService),
                MockProvider(ToastService),
            ],
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(ReplyCommentComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        mergeRequestManagerStub = TestBed.inject(MergeRequestManagerService) as jasmine.SpyObj<MergeRequestManagerService>;
        toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        mergeRequestManagerStub = null;
        toastStub = null;
    });

    describe('controller methods', function() {
        describe('should reply to the parent comment', function() {
            beforeEach(function() {
                component.parentId = 'parent';
                component.edit = true;
                component.replyComment = replyComment;
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
                    component.reply();
                    tick();
                    expect(mergeRequestManagerStub.createComment).toHaveBeenCalledWith(request.jsonld['@id'], replyComment, component.parentId);
                    expect(component.edit).toEqual(false);
                    expect(component.replyComment).toEqual('');
                    expect(mergeRequestManagerStub.getComments).toHaveBeenCalledWith(request.jsonld['@id']);
                    expect(component.request.comments).toEqual(comments);
                    expect(component.requestChange.emit).toHaveBeenCalledWith(component.request);
                    expect(toastStub.createErrorToast).not.toHaveBeenCalled();
                }));
                it('unless getComments rejects', fakeAsync(function() {
                    mergeRequestManagerStub.getComments.and.returnValue(throwError('Error message'));
                    component.reply();
                    tick();
                    expect(mergeRequestManagerStub.createComment).toHaveBeenCalledWith(request.jsonld['@id'], replyComment, component.parentId);
                    expect(component.edit).toEqual(false);
                    expect(component.replyComment).toEqual('');
                    expect(mergeRequestManagerStub.getComments).toHaveBeenCalledWith(request.jsonld['@id']);
                    expect(component.request.comments).toBeUndefined();
                    expect(toastStub.createErrorToast).toHaveBeenCalledWith('Error message');
                }));
            });
            it('unless createComment rejects', fakeAsync(function() {
                mergeRequestManagerStub.createComment.and.returnValue(throwError('Error message'));
                component.reply();
                tick();
                expect(mergeRequestManagerStub.createComment).toHaveBeenCalledWith(request.jsonld['@id'], replyComment, component.parentId);
                expect(component.edit).toEqual(true);
                expect(component.replyComment).toEqual(replyComment);
                expect(mergeRequestManagerStub.getComments).not.toHaveBeenCalled();
                expect(component.request.comments).toBeUndefined();
                expect(toastStub.createErrorToast).toHaveBeenCalledWith('Error message');
            }));
        });
        it('should cancel the reply', function() {
            component.edit = true;
            component.replyComment = 'test';
            component.cancel();
            expect(component.edit).toEqual(false);
            expect(component.replyComment).toEqual('');
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.reply-comment')).length).toEqual(1);
        });
        it('depending on whether the reply is being edited', function() {
            fixture.detectChanges();
            expect(element.queryAll(By.css('.reply-box')).length).toEqual(1);
            expect(element.queryAll(By.css('markdown-editor')).length).toEqual(0);

            component.edit = true;
            fixture.detectChanges();
            expect(element.queryAll(By.css('.reply-box')).length).toEqual(0);
            expect(element.queryAll(By.css('markdown-editor')).length).toEqual(1);
        });
    });
});

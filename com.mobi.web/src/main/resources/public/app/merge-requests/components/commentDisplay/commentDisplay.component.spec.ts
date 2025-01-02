/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent, MockProvider } from 'ng-mocks';
import { ShowdownComponent } from 'ngx-showdown';
import { of } from 'rxjs';

import {
    cleanStylesFromDOM,
} from '../../../../test/ts/Shared';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { LoginManagerService } from '../../../shared/services/loginManager.service';
import { UserManagerService } from '../../../shared/services/userManager.service';
import { DCTERMS, USER, MERGEREQ } from '../../../prefixes';
import { User } from '../../../shared/models/user.class';
import { MarkdownEditorComponent } from '../../../shared/components/markdownEditor/markdownEditor.component';
import { CommentDisplayComponent } from './commentDisplay.component';

describe('Comment Display component', function() {
    let component: CommentDisplayComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<CommentDisplayComponent>;
    let userManagerStub: jasmine.SpyObj<UserManagerService>;
    let matDialog: jasmine.SpyObj<MatDialog>;

    const userId = 'user';
    const username = 'username';
    const comment: JSONLDObject = {
        '@id': 'comment',
        '@type': [],
        [`${DCTERMS}description`]: [{ '@value': 'description' }],
        [`${DCTERMS}issued`]: [{ '@value': 'issued' }],
        [`${DCTERMS}modified`]: [{ '@value': 'modified' }],
        [`${DCTERMS}creator`]: [{ '@id': userId }],
        [`${MERGEREQ}onMergeRequest`]: [{ '@id': 'https:www.example.com' }]
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                MatButtonModule
            ],
            declarations: [
                CommentDisplayComponent,
                MockComponent(MarkdownEditorComponent),
                MockComponent(ShowdownComponent),
            ],
            providers: [
                MockProvider(UserManagerService),
                MockProvider(LoginManagerService),
                {
                    provide: MatDialog, useFactory: () => jasmine.createSpyObj('MatDialog', {
                        open: {afterClosed: () => of(true)}
                    })
                }
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(CommentDisplayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        userManagerStub = TestBed.inject(UserManagerService) as jasmine.SpyObj<UserManagerService>;
        matDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
        
        userManagerStub.users = [new User({
            '@id': userId,
            '@type': [`${USER}User`],
            [`${USER}username`]: [{ '@value': username }],
        })];
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        userManagerStub = null;
        matDialog = null;
    });

    it('initializes correctly on comment change', function() {
        component.comment = comment;
        expect(component.commentText).toEqual('description');
        expect(component.creatorIRI).toEqual(userId);
        expect(component.creator).toEqual(username);
        expect(component.isCreator).toEqual(false);
        expect(component.edit).toEqual(false);
        expect(component.edited).toEqual(false);
        expect(component.issued).toEqual('issued');
    });
    describe('controller methods', function() {
        it('should open a confirm comment delete modal', fakeAsync(function() {
            component.comment = comment;
            spyOn(component.delete, 'emit');
            component.confirmDelete();
            tick();
            expect(matDialog.open).toHaveBeenCalledWith(ConfirmModalComponent, {data: {content: jasmine.stringMatching('Are you sure you want to delete')}});
            expect(component.delete.emit).toHaveBeenCalledWith(comment['@id']);
        }));
        it('should emit an edited comment', fakeAsync(function() {
            component.comment = comment;
            spyOn(component.saveEdit, 'emit');
            component.save();
            tick();
            const commentObject = {
                'commentId': comment['@id'],
                'mergeRequestId': 'https:www.example.com',
                'newComment': ''
            };
            expect(component.saveEdit.emit).toHaveBeenCalledWith(commentObject);
        }));
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            fixture.detectChanges();
            expect(element.queryAll(By.css('.comment-display')).length).toEqual(1);
            expect(element.queryAll(By.css('.comment-title')).length).toEqual(1);
            expect(element.queryAll(By.css('.comment-body')).length).toEqual(1);
            expect(element.queryAll(By.css('showdown')).length).toEqual(1);
            expect(element.queryAll(By.css('.markdown-editor')).length).toEqual(0);
        });
        it('if the comment is a reply', function() {
            fixture.detectChanges();
            const title = element.queryAll(By.css('.comment-title'))[0];
            expect(title.nativeElement.innerHTML).not.toContain('replied');
            expect(title.nativeElement.innerHTML).toContain('commented');
            
            component.isReply = true;
            fixture.detectChanges();
            expect(title.nativeElement.innerHTML).toContain('replied');
            expect(title.nativeElement.innerHTML).not.toContain('commented');
        });
        it('if the current user is the creator', function() {
            fixture.detectChanges();
            expect(element.queryAll(By.css('.comment-body button')).length).toEqual(0);

            component.isCreator = true;
            fixture.detectChanges();
            expect(element.queryAll(By.css('.comment-body button')).length).toEqual(2);
        });
        it('if the request is accepted', function() {
            component.isCreator = true;
            fixture.detectChanges();
            expect(element.queryAll(By.css('.comment-body button')).length).toEqual(2);
            
            component.requestStatus = 'accepted';
            fixture.detectChanges();
            expect(element.queryAll(By.css('.comment-body button')).length).toEqual(1);
        });
        it('if the comment is being edited', function() {
            component.isCreator = true;
            fixture.detectChanges();
            expect(element.queryAll(By.css('.comment-body button')).length).toEqual(2);

            component.edit = true;
            fixture.detectChanges();
            expect(element.queryAll(By.css('.comment-body button')).length).toEqual(0);
            expect(element.queryAll(By.css('markdown-editor')).length).toEqual(1);
        });
    });
});

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
import { MatButtonModule, MatDialog } from '@angular/material';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockProvider } from 'ng-mocks';
import { ShowdownComponent } from 'ngx-showdown';
import { of } from 'rxjs';

import {
    cleanStylesFromDOM,
    mockLoginManager,
    mockUtil,
} from '../../../../../../test/ts/Shared';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { UserManagerService } from '../../../shared/services/userManager.service';
import { CommentDisplayComponent } from './commentDisplay.component';

describe('Comment Display component', function() {
    let component: CommentDisplayComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<CommentDisplayComponent>;
    let userManagerStub: jasmine.SpyObj<UserManagerService>;
    let utilStub;
    let matDialog;

    const userId = 'user';
    const username = 'username';
    const comment: JSONLDObject = {
        '@id': 'comment',
        '@type': []
    };

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                MatButtonModule
            ],
            declarations: [
                CommentDisplayComponent,
                MockComponent(ShowdownComponent),
            ],
            providers: [
                MockProvider(UserManagerService),
                { provide: 'loginManagerService', useClass: mockLoginManager },
                { provide: 'utilService', useClass: mockUtil },
                { provide: MatDialog, useFactory: () => jasmine.createSpyObj('MatDialog', {
                    open: { afterClosed: () => of(true)}
                }) }
            ],
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(CommentDisplayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        userManagerStub = TestBed.get(UserManagerService);
        utilStub = TestBed.get('utilService');
        matDialog = TestBed.get(MatDialog);
        
        utilStub.getDctermsId.and.returnValue(userId);
        utilStub.getDctermsValue.and.callFake((obj, prop) => prop);
        userManagerStub.users = [{
            iri: userId,
            username,
            external: false,
            firstName: '',
            lastName: '',
            email: '',
            roles: []
        }];
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        userManagerStub = null;
        utilStub = null;
        matDialog = null;
    });

    it('initializes correctly on comment change', function() {
        component.comment = comment;
        expect(utilStub.getDctermsId).toHaveBeenCalledWith(comment, 'creator');
        expect(utilStub.getDctermsValue).toHaveBeenCalledWith(comment, 'description');
        expect(utilStub.getDctermsValue).toHaveBeenCalledWith(comment, 'issued');
        expect(component.commentText).toEqual('description');
        expect(component.creatorIRI).toEqual(userId);
        expect(component.creator).toEqual(username);
        expect(component.isCreator).toEqual(false);
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
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.comment-display')).length).toEqual(1);
            expect(element.queryAll(By.css('.comment-title')).length).toEqual(1);
            expect(element.queryAll(By.css('.comment-body')).length).toEqual(1);
            expect(element.queryAll(By.css('.comment-body-text')).length).toEqual(1);
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
            expect(element.queryAll(By.css('.comment-body button')).length).toEqual(1);
        });
        it('if the request is accepted', function() {
            component.isCreator = true;
            fixture.detectChanges();
            expect(element.queryAll(By.css('.comment-body button')).length).toEqual(1);
            
            component.accepted = true;
            fixture.detectChanges();
            expect(element.queryAll(By.css('.comment-body button')).length).toEqual(0);
        });
    });
});

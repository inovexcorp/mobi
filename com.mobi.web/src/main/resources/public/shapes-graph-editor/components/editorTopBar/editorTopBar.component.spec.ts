/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2021 iNovex Information Systems, Inc.
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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { By } from '@angular/platform-browser';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { cleanStylesFromDOM } from '../../../../../../test/ts/Shared';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { DownloadRecordModalComponent } from '../downloadRecordModal/downloadRecordModal.component';
import { EditorRecordSelectComponent } from '../editorRecordSelect/editorRecordSelect.component';
import { EditorTopBarComponent } from './editorTopBar.component';

describe('Editor Top Bar component', function() {
    let component: EditorTopBarComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<EditorTopBarComponent>;
    let matDialog: jasmine.SpyObj<MatDialog>;
    let shapesGraphStateStub;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [
                MatButtonModule,
                MatIconModule,
                MatDividerModule
            ],
            declarations: [
                EditorTopBarComponent,
                MockComponent(EditorRecordSelectComponent)
            ],
            providers: [
                MockProvider(ShapesGraphStateService),
                { provide: MatDialog, useFactory: () => jasmine.createSpyObj('MatDialog', {
                        open: { afterClosed: () => of(true)}
                    })
                }
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(EditorTopBarComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        matDialog = TestBed.get(MatDialog);
        shapesGraphStateStub = TestBed.get(ShapesGraphStateService);
        shapesGraphStateStub.currentShapesGraphRecordIri = 'record1';
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        matDialog = null;
        shapesGraphStateStub = null;
    });

    describe('controller methods', function() {
        it('should open the download modal', function() {
            component.download();
            expect(matDialog.open).toHaveBeenCalledWith(DownloadRecordModalComponent, { data: { recordId: 'record1'}});
        });
        it('should check if the download button is disabled', function() {
            expect(component.downloadDisabled()).toBeFalse();
            shapesGraphStateStub.currentShapesGraphRecordIri = '';
            expect(component.downloadDisabled()).toBeTrue();
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.editor-top-bar')).length).toEqual(1);
        });
        it('with an editor record select', function() {
            const recordSelect = element.queryAll(By.css('editor-record-select'));
            expect(recordSelect.length).toEqual(1);
        });
        it('with button to download', async function() {
            let downloadButton = element.queryAll(By.css('button.download-record'));
            expect(downloadButton.length).toEqual(1);
            expect(downloadButton[0].nativeElement.getAttribute('disabled')).toBeNull();

            shapesGraphStateStub.currentShapesGraphRecordIri = '';
            fixture.detectChanges();
            await fixture.whenStable();
            downloadButton = element.queryAll(By.css('button.download-record'));
            expect(downloadButton.length).toEqual(1);
            expect(downloadButton[0].nativeElement.getAttribute('disabled')).toEqual('');
        });
    });
    it('should call download when the download button is clicked', async function() {
        spyOn(component, 'download');
        fixture.detectChanges();
        await fixture.whenStable();

        const createButton = element.queryAll(By.css('button.download-record'))[0];
        createButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(component.download).toHaveBeenCalled();
    });
});

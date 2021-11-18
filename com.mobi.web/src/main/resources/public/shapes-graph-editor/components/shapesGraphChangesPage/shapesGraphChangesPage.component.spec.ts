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
import { By } from '@angular/platform-browser';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockProvider } from 'ng-mocks';
import { cleanStylesFromDOM, mockUtil, mockCatalogManager } from '../../../../../../test/ts/Shared';
import { InfoMessageComponent } from '../../../shared/components/infoMessage/infoMessage.component';
import { ShapesGraphChangesPageComponent } from '../shapesGraphChangesPage/shapesGraphChangesPage.component';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';

describe('Shapes Graph Changes Page component', function() {
    let component: ShapesGraphChangesPageComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<ShapesGraphChangesPageComponent>;
    let shapesGraphStateStub;
    let utilStub;
    let catalogManagerStub;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [ ],
            declarations: [
                MockComponent(InfoMessageComponent),
                ShapesGraphChangesPageComponent
            ],
            providers: [
                { provide: 'utilService', useClass: mockUtil },
                { provide: 'catalogManagerService', useClass: mockCatalogManager },
                MockProvider(ShapesGraphStateService)
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(ShapesGraphChangesPageComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        shapesGraphStateStub = TestBed.get(ShapesGraphStateService);
        shapesGraphStateStub.inProgressCommit = {
            additions: [],
            deletions: []
        };
        catalogManagerStub = TestBed.get('catalogManagerService');
        catalogManagerStub.deleteInProgressCommit.and.returnValue(Promise.resolve());
        utilStub = TestBed.get('utilService');
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        shapesGraphStateStub = null;
        utilStub = null;
        catalogManagerStub = null;
    });

    describe('controller methods', function() {
        describe('should remove in progress changes', function() {
            it('successfully', async function() {
                shapesGraphStateStub.inProgressCommit = {
                    additions: [{'@id': '12345'}],
                    deletions: []
                };
                component.removeChanges();
                fixture.detectChanges();
                await fixture.whenStable();

                expect(shapesGraphStateStub.clearInProgressCommit).toHaveBeenCalled();
                expect(utilStub.createSuccessToast).toHaveBeenCalled();
            });
            it('unless an error occurs', async function() {
                catalogManagerStub.deleteInProgressCommit.and.returnValue(Promise.reject());
                shapesGraphStateStub.inProgressCommit = {
                    additions: [{'@id': '12345'}],
                    deletions: []
                };
                component.removeChanges();
                fixture.detectChanges();
                await fixture.whenStable();

                expect(shapesGraphStateStub.inProgressCommit).toEqual({
                    additions: [{'@id': '12345'}],
                    deletions: []
                });
                expect(utilStub.createSuccessToast).not.toHaveBeenCalled();
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('div.shapes-graph-changes-page')).length).toEqual(1);
        });
        it('when there are no changes', async function() {
            let infoMessage = element.queryAll(By.css('info-message'));
            expect(infoMessage.length).toEqual(0);

            shapesGraphStateStub.isCommittable.and.returnValue(false);
            shapesGraphStateStub.currentShapesGraphRecordIri = 'record';
            fixture.detectChanges();
            await fixture.whenStable();
            infoMessage = element.queryAll(By.css('info-message'));

            expect(infoMessage.length).toBe(1);
            expect(infoMessage[0].nativeElement.innerText).toEqual('No Changes to Display');
            const buttons = element.queryAll(By.css('button'));
            expect(buttons.length).toEqual(0);

        });
        it('when there are changes', async function() {
            let infoMessage = element.queryAll(By.css('info-message'));
            expect(infoMessage.length).toEqual(0);

            shapesGraphStateStub.isCommittable.and.returnValue(true);
            shapesGraphStateStub.currentShapesGraphRecordIri = 'record';
            fixture.detectChanges();
            await fixture.whenStable();
            infoMessage = element.queryAll(By.css('info-message'));

            expect(infoMessage.length).toBe(0);
            const buttons = element.queryAll(By.css('button'));
            expect(buttons.length).toEqual(1);
            expect(['Remove All Changes']).toContain(buttons[0].nativeElement.textContent.trim());
        });
    });
    it('should call removeChanges when the button is clicked', async function() {
        shapesGraphStateStub.isCommittable.and.returnValue(true);
        shapesGraphStateStub.currentShapesGraphRecordIri = 'record';
        fixture.detectChanges();
        await fixture.whenStable();

        spyOn(component, 'removeChanges');
        const setButton = element.queryAll(By.css('button'))[0];
        setButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(component.removeChanges).toHaveBeenCalled();
    });
});
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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockProvider } from 'ng-mocks';
import { cleanStylesFromDOM, mockUtil, mockCatalogManager, mockPrefixes } from '../../../../../../test/ts/Shared';
import { InfoMessageComponent } from '../../../shared/components/infoMessage/infoMessage.component';
import { Difference } from '../../../shared/models/difference.class';
import { VersionedRdfListItem } from '../../../shared/models/versionedRdfListItem.class';
import { ShapesGraphChangesPageComponent } from '../shapesGraphChangesPage/shapesGraphChangesPage.component';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { MatExpansionModule, MatTooltipModule } from '@angular/material';
import { StatementContainerComponent } from '../../../shared/components/statementContainer/statementContainer.component';
import { StatementDisplayComponent } from '../../../shared/components/statementDisplay/statementDisplay.component';
import { CommitHistoryTableComponent } from '../../../shared/components/commitHistoryTable/commitHistoryTable.component';
import { range, map, forEach } from 'lodash';

describe('Shapes Graph Changes Page component', function() {
    let component: ShapesGraphChangesPageComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<ShapesGraphChangesPageComponent>;
    let shapesGraphStateStub;
    let utilStub;
    let catalogManagerStub;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [
                MatExpansionModule,
                MatTooltipModule
            ],
            declarations: [
                MockComponent(InfoMessageComponent),
                MockComponent(CommitHistoryTableComponent),
                MockComponent(StatementContainerComponent),
                MockComponent(StatementDisplayComponent),
                ShapesGraphChangesPageComponent
            ],
            providers: [
                { provide: 'utilService', useClass: mockUtil },
                { provide: 'catalogManagerService', useClass: mockCatalogManager },
                { provide: 'prefixes', useClass: mockPrefixes },
                MockProvider(ShapesGraphStateService)
            ]
        });
    });
    beforeEach(function() {
        fixture = TestBed.createComponent(ShapesGraphChangesPageComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        shapesGraphStateStub = TestBed.get(ShapesGraphStateService);
        shapesGraphStateStub.listItem = new VersionedRdfListItem();
        shapesGraphStateStub.listItem.inProgressCommit = new Difference();
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
    describe('should update the list of changes when additions/deletions change', function() {
        beforeEach(function() {
            utilStub.getChangesById.and.returnValue([{}]);
            utilStub.getPredicatesAndObjects.and.returnValue([{}]);
        });
        it('if there are less than 100 changes', function() {
            component.additions = [{'@id': '1', 'value': ['stuff']}];
            component.deletions = [{'@id': '1', 'value': ['otherstuff']}, {'@id': '2'}];
            component.ngOnChanges();
            forEach(shapesGraphStateStub.listItem.inProgressCommit.additions, change => {
                expect(utilStub.getPredicatesAndObjects).toHaveBeenCalledWith(change);
            });
            forEach(shapesGraphStateStub.listItem.inProgressCommit.deletions, change => {
                expect(utilStub.getPredicatesAndObjects).toHaveBeenCalledWith(change);
            });
            expect(component.showList).toEqual([
                {id: '1', additions: [{}], deletions: [{}], disableAll: false},
                {id: '2', additions: [], deletions: [{}], disableAll: false},
            ]);
        });
        it('if there are more than 100 changes', function() {
            var ids = range(102);
            component.additions = map(ids, id => ({'@id': id}));
            component.ngOnChanges();
            forEach(shapesGraphStateStub.listItem.inProgressCommit.additions, change => {
                expect(utilStub.getPredicatesAndObjects).toHaveBeenCalledWith(change);
            });
            expect(component.showList.length).toEqual(100);
        });
    });
    describe('controller methods', function() {
        describe('should remove in progress changes', function() {
            it('successfully', async function() {
                shapesGraphStateStub.listItem.inProgressCommit = {
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
                shapesGraphStateStub.listItem.inProgressCommit = {
                    additions: [{'@id': '12345'}],
                    deletions: []
                };
                component.removeChanges();
                fixture.detectChanges();
                await fixture.whenStable();

                expect(shapesGraphStateStub.listItem.inProgressCommit).toEqual({
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
            shapesGraphStateStub.listItem.versionedRdfRecord.recordId = 'record';
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
            shapesGraphStateStub.listItem.versionedRdfRecord.recordId = 'record';
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
        shapesGraphStateStub.listItem.versionedRdfRecord.recordId = 'record';
        fixture.detectChanges();
        await fixture.whenStable();

        spyOn(component, 'removeChanges');
        const setButton = element.queryAll(By.css('button'))[0];
        setButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(component.removeChanges).toHaveBeenCalled();
    });
});
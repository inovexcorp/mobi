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
import { range, map, forEach } from 'lodash';
import { MatExpansionModule, MatTooltipModule } from '@angular/material';
import { of, throwError } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../../../test/ts/Shared';
import { InfoMessageComponent } from '../../../shared/components/infoMessage/infoMessage.component';
import { Difference } from '../../../shared/models/difference.class';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { StatementContainerComponent } from '../../../shared/components/statementContainer/statementContainer.component';
import { StatementDisplayComponent } from '../../../shared/components/statementDisplay/statementDisplay.component';
import { CommitHistoryTableComponent } from '../../../shared/components/commitHistoryTable/commitHistoryTable.component';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { ShapesGraphListItem } from '../../../shared/models/shapesGraphListItem.class';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { OWL, RDF } from '../../../prefixes';
import { ShapesGraphChangesPageComponent } from './shapesGraphChangesPage.component';
import { UtilService } from '../../../shared/services/util.service';

interface PredicateObject {
    p: string,
    o: string
}
interface CommitChanges {
    id: string,
    additions: PredicateObject[],
    deletions: PredicateObject[],
    disableAll: boolean
}

describe('Shapes Graph Changes Page component', function() {
    let component: ShapesGraphChangesPageComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<ShapesGraphChangesPageComponent>;
    let shapesGraphStateStub: jasmine.SpyObj<ShapesGraphStateService>;
    let utilStub: jasmine.SpyObj<UtilService>;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
    const commitChanges: CommitChanges = {id: 'test', additions: [], deletions: [], disableAll: false};

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
                MockProvider(UtilService),
                MockProvider(CatalogManagerService),
                MockProvider(ShapesGraphStateService)
            ]
        });
    });
    beforeEach(function() {
        catalogManagerStub = TestBed.get(CatalogManagerService);
        catalogManagerStub.localCatalog = {'@id': 'catalog', '@type': []};
        catalogManagerStub.deleteInProgressCommit.and.returnValue(of(null));
        fixture = TestBed.createComponent(ShapesGraphChangesPageComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        shapesGraphStateStub = TestBed.get(ShapesGraphStateService);
        shapesGraphStateStub.listItem = new ShapesGraphListItem();
        shapesGraphStateStub.listItem.versionedRdfRecord.recordId = 'record';
        shapesGraphStateStub.listItem.inProgressCommit = new Difference();
        utilStub = TestBed.get(UtilService);
        utilStub.getPredicatesAndObjects.and.returnValue([{p: '', o: ''}]);
        utilStub.condenseCommitId.and.returnValue('test');
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
            utilStub.getChangesById.and.returnValue([{p: '', o: ''}]);
        });
        it('if there are less than 100 changes', function() {
            component.additions = [{'@id': '1', 'value': ['stuff']}];
            component.deletions = [{'@id': '1', 'value': ['otherstuff']}, {'@id': '2'}];
            component.ngOnChanges();
            forEach(shapesGraphStateStub.listItem.inProgressCommit.additions as JSONLDObject[], change => {
                expect(utilStub.getPredicatesAndObjects).toHaveBeenCalledWith(change);
            });
            forEach(shapesGraphStateStub.listItem.inProgressCommit.deletions as JSONLDObject[], change => {
                expect(utilStub.getPredicatesAndObjects).toHaveBeenCalledWith(change);
            });
            expect(component.showList).toEqual([
                {id: '1', additions: [{p: '', o: ''}], deletions: [{p: '', o: ''}], disableAll: false},
                {id: '2', additions: [], deletions: [{p: '', o: ''}], disableAll: false},
            ]);
        });
        it('if there are more than 100 changes', function() {
            const ids = range(102);
            component.additions = map(ids, id => ({'@id': '' + id}));
            component.ngOnChanges();
            forEach(shapesGraphStateStub.listItem.inProgressCommit.additions as JSONLDObject[], change => {
                expect(utilStub.getPredicatesAndObjects).toHaveBeenCalledWith(change);
            });
            expect(component.showList.length).toEqual(100);
        });
    });
    describe('controller methods', function() {
        describe('should remove in progress changes', function() {
            it('successfully', async function() {
                shapesGraphStateStub.listItem.inProgressCommit = new Difference();
                shapesGraphStateStub.listItem.inProgressCommit.additions = [{'@id': '12345', '@type': []}];
                component.removeChanges();
                fixture.detectChanges();
                await fixture.whenStable();

                expect(shapesGraphStateStub.clearInProgressCommit).toHaveBeenCalledWith();
                expect(utilStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                expect(utilStub.createErrorToast).not.toHaveBeenCalled();
            });
            it('unless an error occurs', async function() {
                catalogManagerStub.deleteInProgressCommit.and.returnValue(throwError(''));
                const diff = new Difference();
                diff.additions = [{'@id': '12345', '@type': []}];
                shapesGraphStateStub.listItem.inProgressCommit = diff;
                component.removeChanges();
                fixture.detectChanges();
                await fixture.whenStable();

                expect(shapesGraphStateStub.listItem.inProgressCommit).toEqual(diff);
                expect(utilStub.createSuccessToast).not.toHaveBeenCalled();
                expect(utilStub.createErrorToast).toHaveBeenCalledWith(jasmine.any(String));
            });
        });
        it('should get more results', function() {
            component.chunks = [[commitChanges], [commitChanges]];
            expect(component.index).toEqual(0);
            expect(component.showList).toEqual([]);

            component.getMoreResults();
            expect(component.index).toEqual(1);
            expect(component.showList).toEqual([commitChanges]);
        });
        describe('should check if a specific type exists', function() {
            it('when it exists', function() {
                const commitChange: PredicateObject = {p: RDF + 'type', o: OWL + 'Class'};
                expect(component.hasSpecificType([commitChange])).toBeTrue();
            });
            it('when it does not exist', function() {
                const commitChange: PredicateObject = {p: 'thing', o: 'type'};
                expect(component.hasSpecificType([commitChange])).toBeFalse();
            });
        });
        it('should retrieve a list of commit changes', function() {
            component.list = [commitChanges];
            expect(component.chunks).toEqual([]);
            expect(component.getList()).toEqual([commitChanges]);
        });
        it('should return the commit id', function() {
            expect(component.getCommitId(commitChanges)).toEqual('test');
        });
        describe('should open a selected commit', function() {
            it('successfully', async function() {
                shapesGraphStateStub.changeShapesGraphVersion.and.resolveTo();

                await component.openCommit(commitChanges);
                expect(shapesGraphStateStub.changeShapesGraphVersion).toHaveBeenCalledWith('record', null, 'test', null, 'test');
                expect(utilStub.createErrorToast).not.toHaveBeenCalled();
            });
            it('unless an error occurs', async function() {
                shapesGraphStateStub.changeShapesGraphVersion.and.rejectWith('Error');

                await component.openCommit(commitChanges);
                expect(shapesGraphStateStub.changeShapesGraphVersion).toHaveBeenCalledWith('record', null, 'test', null, 'test');
                expect(utilStub.createErrorToast).toHaveBeenCalledWith('Error');
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
        fixture.detectChanges();
        await fixture.whenStable();

        spyOn(component, 'removeChanges');
        const setButton = element.queryAll(By.css('button'))[0];
        setButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(component.removeChanges).toHaveBeenCalledWith();
    });
});
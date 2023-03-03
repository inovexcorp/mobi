/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { MockComponent, MockProvider } from 'ng-mocks';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { MergeBlockComponent } from '../mergeBlock/mergeBlock.component';
import { ResolveConflictsBlock } from '../../../shared/components/resolveConflictsBlock/resolveConflictsBlock.component';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { Difference } from '../../../shared/models/difference.class';
import { MergeTabComponent } from './mergeTab.component';

describe('Merge Tab component', function() {
    let component: MergeTabComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<MergeTabComponent>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [],
            declarations: [
                MergeTabComponent,
                MockComponent(MergeBlockComponent),
                MockComponent(ResolveConflictsBlock)
            ],
            providers: [
                MockProvider(OntologyStateService)
            ],
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(MergeTabComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;
        ontologyStateStub.listItem = new OntologyListItem();
        fixture.detectChanges();
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        ontologyStateStub = null;
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.merge-tab')).length).toEqual(1);
        });
        it('depending on whether there are conflicts', function() {
            expect(element.queryAll(By.css('merge-block')).length).toEqual(1);
            expect(element.queryAll(By.css('resolve-conflicts-block')).length).toEqual(0);

            ontologyStateStub.listItem.merge.conflicts = [{iri: '', left: new Difference(), right: new Difference()}];
            fixture.detectChanges();
            expect(element.queryAll(By.css('merge-block')).length).toEqual(0);
            expect(element.queryAll(By.css('resolve-conflicts-block')).length).toEqual(1);
        });
    });
});

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
import { MockComponent } from 'ng-mocks';

import {
    cleanStylesFromDOM
} from '../../../../../../test/ts/Shared';
import { SharedModule } from '../../../shared/shared.module';
import { DatasetsListComponent } from '../datasetsList/datasetsList.component';
import { DatasetsPageComponent } from './datasetsPage.component';

describe('Datasets Page component', function() {
    let component: DatasetsPageComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<DatasetsPageComponent>;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [ SharedModule ],
            declarations: [
                DatasetsPageComponent,
                MockComponent(DatasetsListComponent)
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(DatasetsPageComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.datasets-page')).length).toEqual(1);
        });
        it('with a datasets-list', function() {
            expect(element.queryAll(By.css('datasets-list')).length).toBe(1);
        });
    });
});
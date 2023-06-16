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
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MockComponent, MockDirective, MockProvider } from 'ng-mocks';

import { 
    cleanStylesFromDOM
 } from '../../../../../public/test/ts/Shared';
import { DiscoverStateService } from '../../../shared/services/discoverState.service';
import { SharedModule } from '../../../shared/shared.module';
import { ExploreTabComponent } from '../../explore/components/exploreTab/exploreTab.component';
import { QueryTabComponent } from '../../query/components/queryTab/queryTab.component';
import { DiscoverPageComponent } from './discoverPage.component';

describe('Discover Page component', function() {
    let component: DiscoverPageComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<DiscoverPageComponent>;
    let discoverStateStub: jasmine.SpyObj<DiscoverStateService>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ SharedModule ],
            declarations: [
                DiscoverPageComponent,
                MockComponent(ExploreTabComponent),
                MockComponent(QueryTabComponent)
            ],
            providers: [
                MockProvider(DiscoverStateService),
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(DiscoverPageComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        discoverStateStub = TestBed.inject(DiscoverStateService) as jasmine.SpyObj<DiscoverStateService>;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        discoverStateStub = null;
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.discover')).length).toEqual(1);
        });
        describe('if the tab index is', function() {
            it('0', function() {
                discoverStateStub.tabIndex = 0;
                fixture.detectChanges();
                expect(element.queryAll(By.css('explore-tab')).length).toEqual(1);
            });
            it('1', function() {
                discoverStateStub.tabIndex = 1;
                fixture.detectChanges();
                expect(element.queryAll(By.css('query-tab')).length).toEqual(1);
            });
        });
    });
});

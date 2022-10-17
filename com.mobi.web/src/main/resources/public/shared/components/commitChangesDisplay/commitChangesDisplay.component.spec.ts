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

import { DebugElement, SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule, MatExpansionModule, MatIconModule, MatExpansionPanel } from '@angular/material';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { map, range } from 'lodash';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockProvider } from 'ng-mocks';
import { cleanStylesFromDOM } from '../../../../../../test/ts/Shared';
import { CommitChange } from '../../models/commitChange.interface';
import { JSONLDObject } from '../../models/JSONLDObject.interface';
import { OntologyStateService } from '../../services/ontologyState.service';
import { UtilService } from '../../services/util.service';
import { StatementContainerComponent } from '../statementContainer/statementContainer.component';
import { StatementDisplayComponent } from '../statementDisplay/statementDisplay.component';
import { CommitChangesDisplayComponent } from './commitChangesDisplay.component';

describe('Commit Changes Display component', function() {
    let component: CommitChangesDisplayComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<CommitChangesDisplayComponent>;
    let utilStub: jasmine.SpyObj<UtilService>;

    const geoJsonldList: JSONLDObject[] =  [
        {
            '@id':'http://topquadrant.com/ns/examples/geography#Abilene',
            '@type':['http://topquadrant.com/ns/examples/geography#City'],
            'http://www.w3.org/2003/01/geo/wgs84_pos#lat':[{'@type':'http://www.w3.org/2001/XMLSchema#double','@value':'32.4263401615464'}],
            'http://www.w3.org/2003/01/geo/wgs84_pos#long':[{'@type':'http://www.w3.org/2001/XMLSchema#double','@value':'-99.744873046875'}],
            'http://www.w3.org/2004/02/skos/core#broader':[{'@id':'http://topquadrant.com/ns/examples/geography#Texas'}],
            'http://www.w3.org/2004/02/skos/core#prefLabel':[{'@language':'en','@value':'Abilene'}]
        },
        {
            '@id':'http://topquadrant.com/ns/examples/geography#Abu_Dhabi',
            '@type':['http://topquadrant.com/ns/examples/geography#City'],
            'http://www.w3.org/2003/01/geo/wgs84_pos#lat':[{'@type':'http://www.w3.org/2001/XMLSchema#double','@value':'24.46666717529297'}],
            'http://www.w3.org/2003/01/geo/wgs84_pos#long':[{'@type':'http://www.w3.org/2001/XMLSchema#double','@value':'54.36666488647461'}],
            'http://www.w3.org/2004/02/skos/core#broader':[{'@id':'http://topquadrant.com/ns/examples/geography#United_Arab_Emirates'}],
            'http://www.w3.org/2004/02/skos/core#prefLabel':[{'@language':'en','@value':'Abu Dhabi'}]
        }
    ];
    const change: CommitChange = {
        p: '', 
        o: {'@value': ''}
    };

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                MatButtonModule,
                MatIconModule,
                MatExpansionModule
            ],
            declarations: [
                CommitChangesDisplayComponent,
                MockComponent(StatementContainerComponent),
                MockComponent(StatementDisplayComponent)
            ],
            providers: [
                MockProvider(UtilService),
                MockProvider(OntologyStateService)
            ]
        });
    });
    
    beforeEach(function() {
        fixture = TestBed.createComponent(CommitChangesDisplayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        utilStub = TestBed.get(UtilService);

        utilStub.getPredicatesAndObjects.and.returnValue([change]);
        utilStub.getPredicateLocalNameOrdered.and.callFake(a => a);
        component.additions = [];
        component.deletions = [];
        component.entityNameFunc = jasmine.createSpy('entityNameFunc');
        component.hasMoreResults = false;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        utilStub = null;
    });

    describe('should initialize with the correct data for', function() {
        it('additions', function() {
            expect(component.additions).toEqual([]);
        });
        it('deletions', function() {
            expect(component.deletions).toEqual([]);
        });
        it('entityNameFunc', function() {
            expect(component.entityNameFunc).toBeDefined();
        });
        it('hasMoreResults', function() {
            expect(component.hasMoreResults).toBeFalsy();
        });
        it('startIndex', function() {
            expect(component.startIndex).toBeUndefined();
        });
    });
    describe('controller methods', function() {
        it('ngOnChanges should produce current number of changesItems elements', function() {
            component.entityNameFunc = (entityIRI: string, os: OntologyStateService) => {
                return entityIRI;
            }
            component.additions = map(range(0, 4), i => ({'@id': `${i}`, '@type': ['http://example.com/ns/geo#City']}));
            component.deletions = map(range(2, 6), i => ({'@id': `${i}`, '@type': ['http://example.com/ns/geo#City']}));
            expect(component.additions.length).withContext('additions.length').toEqual(4);
            expect(component.deletions.length).withContext('deletions.length').toEqual(4);
            expect(component.changesItems.length).withContext('changesItems.length').toEqual(0);
            
            component.ngOnChanges({
                additions: new SimpleChange(null, [], true),
                deletions: new SimpleChange(null, [], true)
            });

            expect(component.changesItems.length).withContext('changesItems.length').toEqual(6);
            expect(component.changesItems).toEqual([
                {'id':'0', 'entityName': '0', 'additions':[{'p':'','o':{'@value':''}}],'deletions':[],'disableAll':false},
                {'id':'1', 'entityName': '1', 'additions':[{'p':'','o':{'@value':''}}],'deletions':[],'disableAll':false},
                {'id':'2', 'entityName': '2', 'additions':[{'p':'','o':{'@value':''}}],'deletions':[{'p':'','o':{'@value':''}}],'disableAll':false},
                {'id':'3', 'entityName': '3', 'additions':[{'p':'','o':{'@value':''}}],'deletions':[{'p':'','o':{'@value':''}}],'disableAll':false},
                {'id':'4', 'entityName': '4', 'additions':[],'deletions':[{'p':'','o':{'@value':''}}],'disableAll':false},
                {'id':'5', 'entityName': '5', 'additions':[],'deletions':[{'p':'','o':{'@value':''}}],'disableAll':false}
            ]);
        });
        it('should add paged changes to results', function() {
            spyOn(component.showMoreResultsEmitter, 'emit');
            component.limit = 2;
            component.offsetIndex = 0;
            expect(component.showMoreResultsEmitter.emit).withContext('page 1 showMoreResultsEmitter').not.toHaveBeenCalled();
            component.loadMore();
            expect(component.offsetIndex).withContext('page 2 offsetIndex').toEqual(2);
            expect(component.showMoreResultsEmitter.emit).withContext('page 2 showMoreResultsEmitter').toHaveBeenCalledWith({limit: 2, offset: 2});
            component.loadMore();
            expect(component.offsetIndex).withContext('page 3 offsetIndex').toEqual(4);
            expect(component.showMoreResultsEmitter.emit).withContext('page 3 showMoreResultsEmitter').toHaveBeenCalledWith({limit: 2, offset: 4});
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.commit-changes-display')).length).toEqual(1);
        });
        it('depending on whether there are additions and deletions', async function() {
            expect(element.queryAll(By.css('mat-expansion-panel')).length).toEqual(0);

            component.additions = geoJsonldList;
            component.deletions = geoJsonldList;
            component.ngOnChanges({
                additions: new SimpleChange(null, [], true),
                deletions: new SimpleChange(null, [], true)
            });

            fixture.detectChanges();
            await fixture.whenStable();
            
            expect(element.queryAll(By.css('mat-expansion-panel')).length).toEqual(component.changesItems.length);
        });
        it('depending on whether there are additions', async function() {
            expect(element.queryAll(By.css('mat-panel-title')).length).toEqual(0);
            expect(element.queryAll(By.css('mat-panel-description')).length).toEqual(0);

            component.additions = geoJsonldList;
            component.ngOnChanges({
                additions: new SimpleChange(null, [], true),
                deletions: new SimpleChange(null, [], true)
            });
           
            fixture.detectChanges();
            await fixture.whenStable();
            
            expect(element.queryAll(By.css('mat-panel-title')).length).toEqual(2);
            expect(element.queryAll(By.css('mat-panel-description')).length).toEqual(2);
            // expand
            expect(element.queryAll(By.css('statement-container')).length).toEqual(0);
            expect(element.queryAll(By.css('statement-display')).length).toEqual(0);

            const panels = element.queryAll(By.directive(MatExpansionPanel));
            expect(panels.length).toEqual(2);
            panels.forEach(panel => {
                panel.componentInstance.expanded = true;
            });

            fixture.detectChanges();
            await fixture.whenStable();

            expect(element.queryAll(By.css('statement-container')).length).toEqual(2);
            expect(element.queryAll(By.css('statement-display')).length).toEqual(2);
        });
        it('depending on whether there are deletions', async function() {
            expect(element.queryAll(By.css('mat-panel-title')).length).toEqual(0);
            expect(element.queryAll(By.css('mat-panel-description')).length).toEqual(0);

            component.deletions = geoJsonldList;
            component.ngOnChanges({
                additions: new SimpleChange(null, [], true),
                deletions: new SimpleChange(null, [], true)
            });

            fixture.detectChanges();
            await fixture.whenStable();
            
            expect(element.queryAll(By.css('mat-panel-title')).length).toEqual(2);
            expect(element.queryAll(By.css('mat-panel-description')).length).toEqual(2);
            // expand
            expect(element.queryAll(By.css('statement-container')).length).toEqual(0);
            expect(element.queryAll(By.css('statement-display')).length).toEqual(0);

            const panels = element.queryAll(By.directive(MatExpansionPanel));
            expect(panels.length).toEqual(2);
            panels.forEach(panel => {
                panel.componentInstance.expanded = true;
            });

            fixture.detectChanges();
            await fixture.whenStable();

            expect(element.queryAll(By.css('statement-container')).length).toEqual(2);
            expect(element.queryAll(By.css('statement-display')).length).toEqual(2);
        });
        it('depending on whether there are additions and deletions', async function() {
            expect(element.queryAll(By.css('mat-panel-title')).length).toEqual(0);
            expect(element.queryAll(By.css('mat-panel-description')).length).toEqual(0);
            
            component.additions = geoJsonldList;
            component.deletions = geoJsonldList;
            component.ngOnChanges({
                additions: new SimpleChange(null, [], true),
                deletions: new SimpleChange(null, [], true)
            });

            fixture.detectChanges();
            await fixture.whenStable();
            
            expect(element.queryAll(By.css('mat-panel-title')).length).toEqual(2);
            expect(element.queryAll(By.css('mat-panel-description')).length).toEqual(2);
            // expand
            expect(element.queryAll(By.css('statement-container')).length).toEqual(0);
            expect(element.queryAll(By.css('statement-display')).length).toEqual(0);

            const panels = element.queryAll(By.directive(MatExpansionPanel));
            expect(panels.length).toEqual(2);
            panels.forEach(panel => {
                panel.componentInstance.expanded = true;
            });

            fixture.detectChanges();
            await fixture.whenStable();

            expect(element.queryAll(By.css('statement-container')).length).toEqual(4);
            expect(element.queryAll(By.css('statement-display')).length).toEqual(4);
        });
    });
});

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
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatButtonModule, MatExpansionModule, MatIconModule, MatExpansionPanel, MatSlideToggleModule } from '@angular/material';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { map, range } from 'lodash';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../../../test/ts/Shared';
import { Difference } from '../../models/difference.class';
import { JSONLDObject } from '../../models/JSONLDObject.interface';
import { CatalogManagerService } from '../../services/catalogManager.service';
import { OntologyStateService } from '../../services/ontologyState.service';
import { UtilService } from '../../services/util.service';
import { CommitCompiledResourceComponent } from '../commitCompiledResource/commitCompiledResource.component';
import { CommitChangesDisplayComponent } from './commitChangesDisplay.component';

describe('Commit Changes Display component', function() {
    let component: CommitChangesDisplayComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<CommitChangesDisplayComponent>;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
    let utilStub: jasmine.SpyObj<UtilService>;

    const geoJsonldList: JSONLDObject[] =  [
        {
            '@id': 'http://topquadrant.com/ns/examples/geography#Abilene',
            '@type': ['http://topquadrant.com/ns/examples/geography#City'],
            'http://www.w3.org/2003/01/geo/wgs84_pos#lat': [{'@type': 'http://www.w3.org/2001/XMLSchema#double','@value': '32.4263401615464'}],
            'http://www.w3.org/2003/01/geo/wgs84_pos#long': [{'@type': 'http://www.w3.org/2001/XMLSchema#double','@value': '-99.744873046875'}],
            'http://www.w3.org/2004/02/skos/core#broader': [{'@id': 'http://topquadrant.com/ns/examples/geography#Texas'}],
            'http://www.w3.org/2004/02/skos/core#prefLabel': [{'@language': 'en','@value': 'Abilene'}]
        },
        {
            '@id': 'http://topquadrant.com/ns/examples/geography#Abu_Dhabi',
            '@type': ['http://topquadrant.com/ns/examples/geography#City'],
            'http://www.w3.org/2003/01/geo/wgs84_pos#lat': [{'@type': 'http://www.w3.org/2001/XMLSchema#double','@value': '24.46666717529297'}],
            'http://www.w3.org/2003/01/geo/wgs84_pos#long': [{'@type': 'http://www.w3.org/2001/XMLSchema#double','@value': '54.36666488647461'}],
            'http://www.w3.org/2004/02/skos/core#broader': [{'@id': 'http://topquadrant.com/ns/examples/geography#United_Arab_Emirates'}],
            'http://www.w3.org/2004/02/skos/core#prefLabel': [{'@language': 'en','@value': 'Abu Dhabi'}]
        }
    ];

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                FormsModule,
                MatSlideToggleModule,
                MatButtonModule,
                MatIconModule,
                MatExpansionModule
            ],
            declarations: [
                CommitChangesDisplayComponent,
                MockComponent(CommitCompiledResourceComponent)
            ],
            providers: [
                MockProvider(UtilService),
                MockProvider(CatalogManagerService),
                MockProvider(OntologyStateService)
            ]
        });
    });
    
    beforeEach(function() {
        fixture = TestBed.createComponent(CommitChangesDisplayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        catalogManagerStub = TestBed.get(CatalogManagerService);
        utilStub = TestBed.get(UtilService);
        utilStub.isBlankNodeId.and.returnValue(false);

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
        catalogManagerStub = null;
        utilStub = null;
    });

    describe('controller methods', function() {
        it('ngOnChanges should produce current number of changesItems elements', function() {
            component.entityNameFunc = (entityIRI: string) => {
                return entityIRI;
            };
            component.additions = map(range(0, 4), i => ({'@id': `${i}`, '@type': ['http://example.com/ns/geo#City']}));
            component.deletions = map(range(2, 6), i => ({'@id': `${i}`, '@type': ['http://example.com/ns/geo#City']}));
            expect(component.additions.length).toEqual(4);
            expect(component.deletions.length).toEqual(4);
            expect(component.changesItems.length).toEqual(0);
            
            component.ngOnChanges({
                additions: new SimpleChange(null, [], true),
                deletions: new SimpleChange(null, [], true)
            });

            expect(component.changesItems.length).toEqual(6);
            expect(component.changesItems).toEqual([
                {'id': '0', 'entityName': '0', 'difference': new Difference([{'@id': '0', '@type': ['http://example.com/ns/geo#City']}]), 'disableAll': false, resource: undefined, showFull: false, isBlankNode: false},
                {'id': '1', 'entityName': '1', 'difference': new Difference([{'@id': '1', '@type': ['http://example.com/ns/geo#City']}]),'disableAll': false, resource: undefined, showFull: false, isBlankNode: false},
                {'id': '2', 'entityName': '2', 'difference': new Difference([{'@id': '2', '@type': ['http://example.com/ns/geo#City']}], [{'@id': '2', '@type': ['http://example.com/ns/geo#City']}]),'disableAll': false, resource: undefined, showFull: false, isBlankNode: false},
                {'id': '3', 'entityName': '3', 'difference': new Difference([{'@id': '3', '@type': ['http://example.com/ns/geo#City']}], [{'@id': '3', '@type': ['http://example.com/ns/geo#City']}]),'disableAll': false, resource: undefined, showFull: false, isBlankNode: false},
                {'id': '4', 'entityName': '4', 'difference': new Difference([], [{'@id': '4', '@type': ['http://example.com/ns/geo#City']}]),'disableAll': false, resource: undefined, showFull: false, isBlankNode: false},
                {'id': '5', 'entityName': '5', 'difference': new Difference([], [{'@id': '5', '@type': ['http://example.com/ns/geo#City']}]),'disableAll': false, resource: undefined, showFull: false, isBlankNode: false}
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
        describe('toggleFull sets the full resource on a changes item', function() {
            it('unless the commitId is not set', function() {
                component.commitId = '';
                const item = {id: 'id', entityName: '', difference: new Difference(), disableAll: false, resource: {'@id': 'id'}, showFull: false, isBlankNode: false};
                component.toggleFull(item);
                expect(catalogManagerStub.getCompiledResource).not.toHaveBeenCalled();
                expect(item.resource).toEqual({'@id': 'id'});
            });
            it('unless the full display should be removed', function() {
                component.commitId = 'commitId';
                const item = {id: 'id', entityName: '', difference: new Difference(), disableAll: false, resource: {'@id': 'id'}, showFull: false, isBlankNode: false};
                component.toggleFull(item);
                expect(catalogManagerStub.getCompiledResource).not.toHaveBeenCalled();
                expect(item.resource).toBeUndefined();
            });
            it('successfully', fakeAsync(function() {
                component.commitId = 'commitId';
                catalogManagerStub.getCompiledResource.and.returnValue(of([{'@id': 'other'}, {'@id': 'id'}]));
                const item = {id: 'id', entityName: '', difference: new Difference(), disableAll: false, resource: undefined, showFull: true, isBlankNode: false};
                component.toggleFull(item);
                tick();
                expect(catalogManagerStub.getCompiledResource).toHaveBeenCalledWith('commitId', 'id');
                expect(item.resource).toEqual({'@id': 'id'});
                expect(utilStub.createErrorToast).not.toHaveBeenCalled();
            }));
            it('unless an error occurs', fakeAsync(function() {
                component.commitId = 'commitId';
                catalogManagerStub.getCompiledResource.and.returnValue(throwError('Error Message'));
                const item = {id: 'id', entityName: '', difference: new Difference(), disableAll: false, resource: undefined, showFull: true, isBlankNode: false};
                component.toggleFull(item);
                tick();
                expect(catalogManagerStub.getCompiledResource).toHaveBeenCalledWith('commitId', 'id');
                expect(item.resource).toBeUndefined();
                expect(utilStub.createErrorToast).toHaveBeenCalledWith(jasmine.any(String));
            }));
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
        it('depending on whether the changes are on blank nodes', async function() {
            expect(element.queryAll(By.css('mat-panel-title')).length).toEqual(0);
            expect(element.queryAll(By.css('mat-panel-description')).length).toEqual(0);

            component.commitId = 'commitId';
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
            expect(element.queryAll(By.css('commit-compiled-resource')).length).toEqual(0);

            const panels = element.queryAll(By.directive(MatExpansionPanel));
            expect(panels.length).toEqual(2);
            panels.forEach(panel => {
                panel.componentInstance.expanded = true;
            });

            fixture.detectChanges();
            await fixture.whenStable();

            expect(element.queryAll(By.css('commit-compiled-resource')).length).toEqual(2);
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
            expect(element.queryAll(By.css('commit-compiled-resource')).length).toEqual(0);

            const panels = element.queryAll(By.directive(MatExpansionPanel));
            expect(panels.length).toEqual(2);
            panels.forEach(panel => {
                panel.componentInstance.expanded = true;
            });

            fixture.detectChanges();
            await fixture.whenStable();

            expect(element.queryAll(By.css('commit-compiled-resource')).length).toEqual(2);
        });
        it('depending on whether there are additions and deletions', async function() {
            expect(element.queryAll(By.css('mat-panel-title')).length).toEqual(0);
            expect(element.queryAll(By.css('mat-panel-description')).length).toEqual(0);
            
            component.commitId = 'id';
            component.additions = geoJsonldList;
            component.deletions = geoJsonldList;
            utilStub.isBlankNodeId.and.callFake(id => id === geoJsonldList[0]['@id']);
            component.ngOnChanges({
                additions: new SimpleChange(null, [], true),
                deletions: new SimpleChange(null, [], true)
            });
           
            fixture.detectChanges();
            await fixture.whenStable();
            
            expect(element.queryAll(By.css('mat-panel-title')).length).withContext('mat-panel-title').toEqual(2);
            expect(element.queryAll(By.css('mat-panel-description')).length).withContext('mat-panel-description').toEqual(2);
            // expand
            expect(element.queryAll(By.css('mat-slide-toggle')).length).withContext('mat-slide-toggle = 0').toEqual(0);
            expect(element.queryAll(By.css('commit-compiled-resource')).length).withContext('has commit-compiled-resource = 0').toEqual(0);

            const panels = element.queryAll(By.directive(MatExpansionPanel));
            expect(panels.length).withContext('panels.length').toEqual(2);
            panels.forEach(panel => {
                panel.componentInstance.expanded = true;
            });

            fixture.detectChanges();
            await fixture.whenStable();

            expect(element.queryAll(By.css('mat-slide-toggle')).length).withContext('mat-slide-toggle = 1').toEqual(1);
            expect(element.queryAll(By.css('commit-compiled-resource')).length).withContext('commit-compiled-resource = 2').toEqual(2);
        });
    });
});

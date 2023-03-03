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
import { DebugElement, SimpleChange } from '@angular/core';
import { By } from '@angular/platform-browser';
import { fakeAsync, TestBed, tick, ComponentFixture } from '@angular/core/testing';
import { MockComponent, MockProvider } from 'ng-mocks';
import { Subject } from 'rxjs';

import { OntologyVisualizationService } from '../../services/ontologyVisualizaton.service';
import { InfoMessageComponent } from '../../../shared/components/infoMessage/infoMessage.component';
import { SpinnerComponent } from '../../../shared/components/progress-spinner/components/spinner/spinner.component';
import { cleanStylesFromDOM, MockOntologyVisualizationService } from '../../../../../public/test/ts/Shared';
import { SidePanelPayloadI }  from '../../interfaces/visualization.interfaces';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';
import { UtilService } from '../../../shared/services/util.service';
import { OntologyVisualization } from './ontologyVisualization.component';

describe('Ontology Visualization component', () => {
    let component: OntologyVisualization;
    let element: DebugElement;
    let fixture: ComponentFixture<OntologyVisualization>;
    let serviceStub: OntologyVisualizationService;
    let utilStub: jasmine.SpyObj<UtilService>;

    let cyChartSpy;

    beforeEach(async () =>  {
        await TestBed.configureTestingModule({
            declarations: [
                OntologyVisualization,
                MockComponent(SpinnerComponent),
                MockComponent(InfoMessageComponent)
            ],
            providers: [
                MockProvider(ProgressSpinnerService),
                { provide: OntologyVisualizationService, useClass: MockOntologyVisualizationService },
                MockProvider(UtilService),
            ]
        }).compileComponents();

        cyChartSpy = jasmine.createSpyObj('cyChart', {
            json: { elements: { nodes: [], edges: [] } },
            ready: undefined,
        });

        fixture = TestBed.createComponent(OntologyVisualization);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        serviceStub = TestBed.inject(OntologyVisualizationService) as jasmine.SpyObj<OntologyVisualizationService>;
        utilStub = TestBed.inject(UtilService) as jasmine.SpyObj<UtilService>;
        serviceStub.sidePanelActionAction$ = new Subject<SidePanelPayloadI>().asObservable();
        spyOn(component, 'updateGraphState').and.callFake(() => {});
    });

    afterEach(() => {
        cleanStylesFromDOM();
        element = null;
        fixture = null;
        component = null;
        serviceStub = null;
        utilStub = null;
    });

    describe('should initialize with the correct values', () => {
        it('successfully', fakeAsync(() => {
            fixture.autoDetectChanges();
            tick(60000);
            expect(component.cyChartSize).toBeTruthy();
            expect(serviceStub.init).toHaveBeenCalled();
            component.ngOnDestroy();
            expect(utilStub.clearToast).toHaveBeenCalledWith();
        }));
    });
    describe('component lifecycle should initialize with the right values', () => {
        it('ngOnChanges', fakeAsync(() => {
            fixture.autoDetectChanges();
            tick(60000);
            component.ontology = 1;
            spyOn(component, 'updateCytoscapeGraph').and.callFake(() => {});
            component.ngOnChanges({
                ontology: new SimpleChange(null, component.ontology, true)
            });
            fixture.detectChanges();
            tick(5000);
            expect(component.status.loaded).toBeFalse();
        }));
        it('ngOnInit', () =>  {
            component.commitId = 'commitId12345';
            spyOn(component, 'createCytoscapeInstance').and.returnValue(cyChartSpy);
            component.ngOnInit();
            component.sidePanelActionSub$ = serviceStub.sidePanelActionAction$.subscribe();
            spyOn(component.sidePanelActionSub$, 'unsubscribe').and.callThrough();
            expect(cyChartSpy.ready).toHaveBeenCalled();
            expect(serviceStub.init).toHaveBeenCalled();
            expect(component.sidePanelActionSub$.unsubscribe).not.toHaveBeenCalled();
            expect(utilStub.clearToast).not.toHaveBeenCalled();
            expect(component.updateGraphState).not.toHaveBeenCalled();
        });
        it('onDestroy was initialized', () =>  {
            component.commitId = 'commitId12345';
            component.cyChart = cyChartSpy;
            component.status.initialized = true;
            component.ngOnDestroy();
            expect(utilStub.clearToast).toHaveBeenCalledWith();
            expect(component.sidePanelActionSub$).toEqual(undefined);
            expect(component.updateGraphState).toHaveBeenCalledWith('commitId12345');
            component.status.initialized = false;
        });
        it('onDestroy was not initialized', () =>  {
            component.commitId = 'commitId12345';
            component.cyChart = cyChartSpy;
            component.status.initialized = false;
            component.ngOnDestroy();
            expect(utilStub.clearToast).toHaveBeenCalledWith();
            expect(component.sidePanelActionSub$).toEqual(undefined);
            expect(component.updateGraphState).not.toHaveBeenCalled();
        });
    });
    describe('contains the correct html', () => {
        it('for wrapping containers', () => {
            expect(element.query(By.css('.ontology-visualization-container'))).toBeTruthy();
            expect(element.query(By.css('.ontology-visualization'))).toBeTruthy();
        });
        it('for graph container', fakeAsync(() => {
            fixture.autoDetectChanges();
            tick(50000);
            expect(element.query(By.css('.ontology-visualization.__________cytoscape_container'))).toBeTruthy();
        }));
        it('when ontology has no class', () =>  {
            expect(element.query(By.css('info-message'))).toBeFalsy();
            component.cyChartSize = 0;
            fixture.detectChanges();
            expect(element.query(By.css('info-message'))).toBeTruthy();
        });
    });
});

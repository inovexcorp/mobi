
import { DebugElement, SimpleChange } from '@angular/core';
import { By } from '@angular/platform-browser';
import { fakeAsync, TestBed, tick, ComponentFixture } from "@angular/core/testing";
import { configureTestSuite } from 'ng-bullet';
import { MockComponent } from 'ng-mocks';

import { OntologyVisualizationService } from '../../services/ontologyVisualizaton.service';
import { OntologyVisualization } from './ontologyVisualization.component';
import { InfoMessageComponent } from '../../../shared/components/infoMessage/infoMessage.component';
import { SpinnerComponent } from '../../../shared/components/progress-spinner/spinner.component';
import { MockOntologyVisualizationService, mockUtil, mockHttpService} from  '../../../../../../test/ts/Shared';

describe('Ontology Visualization component', () => {
    let component: OntologyVisualization;
    let element: DebugElement;
    let fixture: ComponentFixture<OntologyVisualization>;
    let serviceStub: OntologyVisualizationService;
    let utilStub;
    let httpStub;

    configureTestSuite(() =>  {
        TestBed.configureTestingModule({
            declarations: [
                OntologyVisualization,
                MockComponent(SpinnerComponent),
                MockComponent(InfoMessageComponent)
            ],
            providers: [
                { provide: OntologyVisualizationService, useClass: MockOntologyVisualizationService },
                { provide: 'utilService', useClass: mockUtil },
                { provide: 'httpService', useClass: mockHttpService }
            ]
        });
    });

    beforeEach(fakeAsync(() => {
        fixture = TestBed.createComponent(OntologyVisualization);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        serviceStub = TestBed.get(OntologyVisualizationService);
        utilStub = TestBed.get('utilService');
        httpStub = TestBed.get('httpService');
    }));
    afterEach(() => {
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
            expect(utilStub.clearToast).toHaveBeenCalled();
        }));
    });
    describe('component lifecycle should initialize with the right values', () => {
        it('onChanges', fakeAsync(() => {
            fixture.autoDetectChanges();
            tick(60000);
            component.ontology = 1;
            spyOn(component,'updateCytoscapeGraph').and.callFake(() => {});
            spyOn(component,'updateGraphState').and.callFake(() => {});
            component.ngOnChanges({
                ontology: new SimpleChange(null, component.ontology, true)
            });
            fixture.detectChanges();
            tick(5000);
        }));

        it('ngOnInit', fakeAsync(() =>  {
            component.commitId = 'commitId12345';
            const cyChart = jasmine.createSpyObj('cyChart', ['ready']);
            spyOn(component, 'updateGraphState');
            spyOn(component, 'createCytoscapeInstance').and.returnValue(cyChart);
            component.ngOnInit();
            expect(cyChart.ready).toHaveBeenCalled();
            expect(serviceStub.init).toHaveBeenCalled();
            expect(component.sidePanelActionSub$.unsubscribe).not.toHaveBeenCalled();
            expect(utilStub.clearToast).not.toHaveBeenCalled();
            expect(component.updateGraphState).not.toHaveBeenCalled();
        }));
        it('onDestroy was initialized', fakeAsync(() =>  {
            component.commitId = 'commitId12345';
            spyOn(component, 'updateGraphState');
            component.cyChart = jasmine.createSpy('cyChart');
            component.status.initialized = true;
            component.sidePanelActionSub$ = serviceStub.sidePanelActionSubject$.asObservable().subscribe();
            component.ngOnDestroy();
            expect(utilStub.clearToast).toHaveBeenCalled();
            expect(component.sidePanelActionSub$.unsubscribe).toHaveBeenCalled();
            expect(component.updateGraphState).toHaveBeenCalledWith('commitId12345');
        }));
        it('onDestroy was not initialized', fakeAsync(() =>  {
            component.commitId = 'commitId12345';
            component.cyChart = jasmine.createSpy('cyChart');
            component.status.initialized = false;
            spyOn(component, 'updateGraphState');
            component.ngOnDestroy();
            expect(utilStub.clearToast).toHaveBeenCalled();
            expect(component.sidePanelActionSub$).toEqual(undefined);
            expect(component.updateGraphState).not.toHaveBeenCalled()
        }));
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

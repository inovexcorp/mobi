
import { DebugElement, SimpleChange } from '@angular/core';
import { By } from '@angular/platform-browser';
import { fakeAsync, TestBed, tick, ComponentFixture } from "@angular/core/testing";
import { configureTestSuite } from 'ng-bullet';
import { MockComponent } from 'ng-mocks';

import { OntologyVisualizationService } from '../services/ontologyVisualizaton.service';
import { OntologyVisualization } from './ontologyVisualization.component';
import { InfoMessageComponent } from '../../shared/components/infoMessage/infoMessage.component';
import { SpinnerComponent } from '../../shared/components/progress-spinner/spinner.component';
import { mockUtil } from  '../../../../../test/ts/Shared';
import { MockOntologyVisualization }  from '../../../../../test/ts/Shared';

describe('Ontology Visualization component', function()  {
    let component: OntologyVisualization;
    let element: DebugElement;
    let fixture: ComponentFixture<OntologyVisualization>;
    let ontologyVisStub;
    let utilStub;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            declarations: [
                OntologyVisualization,
                MockComponent(SpinnerComponent),
                MockComponent(InfoMessageComponent)
            ],
            providers: [
                { provide: OntologyVisualizationService, useClass: MockOntologyVisualization },
                { provide: 'utilService', useClass: mockUtil },
            ]
        });
    });

    beforeEach(fakeAsync(function() {
        fixture = TestBed.createComponent(OntologyVisualization);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        ontologyVisStub = TestBed.get(OntologyVisualizationService);
        utilStub = TestBed.get('utilService');
    }));
    afterEach(function() {
        element = null;
        fixture = null;
        component = null;
    });
    describe('should initialize with the correct values', function() {
        it('successfully', fakeAsync(function() {
            fixture.autoDetectChanges();
            tick(60000);
            expect(component.layout).toEqual('d3-force');
            expect(ontologyVisStub.getGraphData).toHaveBeenCalled();
            expect(component.length).toBeTruthy();
            component.ngOnDestroy();
            expect(ontologyVisStub.setGraphState).toHaveBeenCalled();
            expect(utilStub.clearToast).toHaveBeenCalled();
        }));
    });
    describe('component lifecycle should initialize with the right values', function() {
        it('onDestroy', fakeAsync(function() {
            fixture.autoDetectChanges();
            tick(60000);
            component.ngOnDestroy();
            expect(ontologyVisStub.setGraphState).toHaveBeenCalled();
            expect(utilStub.clearToast).toHaveBeenCalled();
        }));
        it('onChanges', fakeAsync(function() {
            fixture.autoDetectChanges();
            tick(60000);
            component.ontology = 1;
            component.hasInit = true;
            spyOn(component,'updateGraph').and.callFake(()=>{});
            spyOn(component,'updateGraphData').and.callFake(()=>{});
            ontologyVisStub.hasPositions.and.returnValue('true');
            component.ngOnChanges({
                ontology: new SimpleChange(null, component.ontology,true)
            });
            fixture.detectChanges();
            tick(5000);
            expect(component.updateGraphData).toHaveBeenCalled();
        }));
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.query(By.css('.ontology-visualization-container'))).toBeTruthy();
            expect(element.query(By.css('.ontology-visualization'))).toBeTruthy();
        });
        it('for graph container', fakeAsync(function() {
            fixture.autoDetectChanges();
            tick(50000);
            expect(element.query(By.css('.ontology-visualization.__________cytoscape_container'))).toBeTruthy();
        }));
        it('when ontology has no class', function() {
            expect(element.query(By.css('info-message'))).toBeFalsy();
            component.length = 0;
            fixture.detectChanges();
            expect(element.query(By.css('info-message'))).toBeTruthy();
        });
    });
});

/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
import { By } from '@angular/platform-browser';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderChange, MatSliderModule } from '@angular/material/slider';

import { MockProvider } from 'ng-mocks';

import { cleanStylesFromDOM, MockOntologyVisualizationService } from '../../../../test/ts/Shared';
import { D3SimulatorService } from '../../services/d3Simulator.service';
import { OntologyVisualizationService } from '../../services/ontologyVisualization.service';
import { VisualizationMenuComponent } from './visualization-menu.component';

describe('VisualizationMenuComponent', () => {
  let component: VisualizationMenuComponent;
  let element: DebugElement;
  let fixture: ComponentFixture<VisualizationMenuComponent>;
  let cyChartSpy;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VisualizationMenuComponent],
      providers: [
        {provide: OntologyVisualizationService, useClass: MockOntologyVisualizationService},
        MockProvider(D3SimulatorService)
      ],
      imports: [
        MatButtonModule,
        MatIconModule,
        MatSliderModule
      ]
    }).compileComponents();

    cyChartSpy = jasmine.createSpyObj('cyChart', {
      json: {elements: {nodes: [], edges: []}},
      ready: undefined,
      zoom: (zoomLevel: any) => {},
      elements: jasmine.createSpy('elements').and.returnValue({
        length: 0,
        [0]: undefined
      }),
    });

    fixture = TestBed.createComponent(VisualizationMenuComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;

    component.cyChart = cyChartSpy;
    component.initialZoom = 2;
    fixture.detectChanges();
  });

  afterEach(() => {
    cleanStylesFromDOM();
    element = null;
    fixture = null;
    component = null;
  });

  it('should call fitGraph method when reset button is clicked', () => {
    spyOn(component, 'fitGraph');
    const fitButton = element.query(By.css('.menu-container Button.reset'));
    fitButton.triggerEventHandler('click', null);
    expect(component.fitGraph).toHaveBeenCalledWith();
  });
  it('should call zoomIn method when plus button is clicked', () => {
    spyOn(component, 'zoomIn');
    const fitButton = element.query(By.css('.menu-container Button.plus'));
    fitButton.triggerEventHandler('click', null);
    expect(component.zoomIn).toHaveBeenCalledWith();
  });
  it('should call zoomOut method when minus button is clicked', () => {
    spyOn(component, 'zoomOut');
    const fitButton = element.query(By.css('.menu-container Button.minus'));
    fitButton.triggerEventHandler('click', null);
    expect(component.zoomOut).toHaveBeenCalledWith();
  });
  describe('contains the correct html', () => {
    it('for wrapping elements', () => {
      expect(element.query(By.css('.menu-container'))).toBeTruthy();
      expect(element.queryAll(By.css('.menu-container Button.mat-primary')).length).toEqual(3);
      expect(element.query(By.css('.menu-container mat-slider'))).toBeTruthy();
    });
    it('if the lower zoom limit has been reached', () => {
      component.lowerThanLimit = true;
      fixture.detectChanges();
      const button = element.query(By.css('.menu-container Button.minus'));
      expect(button.properties['disabled']).toBeTruthy();
    });
    it('if the upper zoom limit has been reached', () => {
      component.higherThanLimit = true;
      fixture.detectChanges();
      const button = element.query(By.css('.menu-container Button.plus'));
      expect(button.properties['disabled']).toBeTruthy();
    });
  });
  describe('controller methods', () => {
    describe('should set the zoomLevel correctly', () => {
      beforeEach(() => {
        spyOn(component, 'calculateLimits');
      });
      describe('when there are no focused elements in the graph', () => {
        it('when zoomOut is called', () => {
          testZoomOut('zoomOut', 1.9);
        });
        it('when zoomIn is called', () => {
          testZoomOut('zoomIn', 2.1);
        });
        it('when calculateSlider is called', () => {
          testZoomSlider();
        });
      });
      describe('when there is a focused element in the graph', () => {
        const positionData = {
          'id': 'http://www.bauhaus-luftfahrt.net/ontologies/2012/AircraftDesign.owl#Aircraft',
          'x': -214.12701066463472,
          'y': 1104.5249884636648,
          'index': 2,
          'vy': -0.018942166164434428,
          'vx': -0.009661511456417072
        };
        beforeEach(() => {
          cyChartSpy.elements = jasmine.createSpy('elements').and.returnValue({
            length: 1,
            [0]: { position: jasmine.createSpy('position').and.returnValue(positionData) }
          });
        });
        it('when zoomOut is called', () => {
          testZoomOut('zoomOut', 1.9, positionData);
        });
        it('when zoomIn is called', () => {
          testZoomOut('zoomIn', 2.1, positionData);
        });
        it('when calculateSlider is called', () => {
          testZoomSlider(positionData);
        });
      });
    });
  });

  //helper functions
  function testZoomOut(action: string, zoomLevel: number, expObj: any = undefined) {
    if (action === 'zoomOut') {
      component.zoomOut();
    } else {
      component.zoomIn();
    }

    expect(component.zoomLevel).toEqual(zoomLevel);
    expect(component.calculateLimits).toHaveBeenCalledWith();
    if (!expObj) {
      expect(cyChartSpy.zoom).toHaveBeenCalledWith(zoomLevel);
    } else {
      expect(cyChartSpy.zoom).toHaveBeenCalledWith({
        level: zoomLevel,
        position: expObj
      });
    }
  }

  function testZoomSlider(expObj: any = undefined) {
    const event = new MatSliderChange();
    event.value = 2.5;
    component.calculateSlider(event);
    expect(component.zoomLevel).toEqual(2.5);
    expect(component.calculateLimits).toHaveBeenCalledWith();
    if (!expObj) {
      expect(cyChartSpy.zoom).toHaveBeenCalledWith(2.5);
    } else {
      expect(cyChartSpy.zoom).toHaveBeenCalledWith({
        level: 2.5,
        position: expObj
      });
    }
  }
});

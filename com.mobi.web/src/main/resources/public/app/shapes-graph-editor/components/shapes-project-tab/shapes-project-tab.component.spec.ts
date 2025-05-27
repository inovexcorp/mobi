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
import { ComponentFixture, TestBed, tick, fakeAsync } from '@angular/core/testing';
import { DebugElement } from '@angular/core';

import { ImportsBlockComponent } from '../../../shared/components/importsBlock/importsBlock.component';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';
import { ShapesGraphDetailsComponent } from '../shapesGraphDetails/shapesGraphDetails.component';
import { ShapesGraphListItem } from '../../../shared/models/shapesGraphListItem.class';
import { ShapesGraphManagerService } from '../../../shared/services/shapesGraphManager.service';
import { ShapesGraphPropertiesBlockComponent } from '../shapesGraphPropertiesBlock/shapesGraphPropertiesBlock.component';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { ShapesProjectTabComponent } from './shapes-project-tab.component';
import { ShapesPreviewComponent } from '../shapes-preview/shapes-preview.component';


describe('Shapes Project Tab component', () => {
  let component: ShapesProjectTabComponent;
  let fixture: ComponentFixture<ShapesProjectTabComponent>;
  let element: DebugElement;
  let stateSvcStub: jasmine.SpyObj<ShapesGraphStateService>;
  let managerSvcStub: jasmine.SpyObj<ShapesGraphManagerService>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        ShapesProjectTabComponent,
        MockComponent(ImportsBlockComponent),
        MockComponent(ShapesGraphDetailsComponent),
        MockComponent(ShapesGraphPropertiesBlockComponent),
        MockComponent(ShapesPreviewComponent)
      ],
      providers: [
        MockProvider(ShapesGraphStateService),
        MockProvider(ShapesGraphManagerService)
      ]
    });
    fixture = TestBed.createComponent(ShapesProjectTabComponent);
    element = fixture.debugElement;
    component = fixture.componentInstance;

    //setting up the services
    managerSvcStub = TestBed.inject(ShapesGraphManagerService) as jasmine.SpyObj<ShapesGraphManagerService>;
    stateSvcStub = TestBed.inject(ShapesGraphStateService) as jasmine.SpyObj<ShapesGraphStateService>;
    stateSvcStub.listItem = new ShapesGraphListItem();
    stateSvcStub.listItem.metadata = {
      '@id': 'http://www.example.com/test',
      '@type': ['http://www.w3.org/2002/07/owl#Ontology'],
      'http://purl.org/dc/elements/1.1/description': [
        {
          '@value': 'Test shapes graph description'
        }
      ],
      'http://purl.org/dc/elements/1.1/title': [
        {
          '@value': 'Test Shapes Graph'
        }
      ],

    };
    stateSvcStub.listItem.versionedRdfRecord = {
      'title': 'Test Shapes',
      'recordId': 'https://mobi.com/testRecord',
      'branchId': 'https://mobi.com/branches#testBranch',
      'commitId': 'https://mobi.com/commits#testCommit',
      'tagId': ''
    };

    fixture.detectChanges();
  });

  afterEach(() => {
    component = null;
    element = null;
    fixture.destroy();
    stateSvcStub = null;
    managerSvcStub = null;
  });

  describe('should initialize ', function() {
    describe('with the correct html', function() {
      ['shapes-graph-details', 'shapes-graph-properties-block', 'shapes-preview']
        .forEach(test => {
          it('containing a ' + test, function() {
            expect(element.queryAll(By.css(test)).length).toEqual(1);
          });
        });
    });
    it('while retrieving the appropriate list of keys', function() {
      const retrievedKeys = component.keys(stateSvcStub.listItem.metadata);
      expect(retrievedKeys).toEqual(
        jasmine.arrayContaining([
          '@id',
          '@type',
          'http://purl.org/dc/elements/1.1/description',
          'http://purl.org/dc/elements/1.1/title'
        ])
      );
    });
  });
  describe('should be able to update the format of the content in the preview', function() {
    it('when the call to the shapes manager service is called', fakeAsync(function() {
      managerSvcStub.getShapesGraphContent.and.returnValue(of('Some content'));
      component.updateContentType('turtle');
      tick();
      expect(managerSvcStub.getShapesGraphContent)
        .toHaveBeenCalledWith('https://mobi.com/testRecord', 'https://mobi.com/branches#testBranch', 'https://mobi.com/commits#testCommit', 'turtle', true);
      expect(stateSvcStub.listItem.content).toEqual('Some content');
    }));
    it('unless an error is thrown from the shapes manager service', fakeAsync(function() {
      managerSvcStub.getShapesGraphContent.and.returnValue(throwError('Error'));
      component.updateContentType('turtle');
      tick();
      expect(managerSvcStub.getShapesGraphContent)
        .toHaveBeenCalledWith('https://mobi.com/testRecord', 'https://mobi.com/branches#testBranch', 'https://mobi.com/commits#testCommit', 'turtle', true);
      expect(stateSvcStub.listItem.content).toEqual('Error');
    }));
  });
});

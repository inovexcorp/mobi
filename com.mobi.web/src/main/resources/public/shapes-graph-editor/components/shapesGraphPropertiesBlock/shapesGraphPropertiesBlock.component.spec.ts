import { ShapesGraphStateService } from "../../../shared/services/shapesGraphState.service";
import { ShowPropertiesPipe } from "../../../shared/pipes/showProperties.pipe";
import { ShapesGraphManagerService } from "../../../shared/services/shapesGraphManager.service";
import { mockPropertyManager, cleanStylesFromDOM } from "../../../../../../test/ts/Shared";
import { ShapesGraphPropertyValuesComponent } from "../shapesGraphPropertyValues/shapesGraphPropertyValues.component";
import { ShapesGraphPropertiesBlockComponent } from "./shapesGraphPropertiesBlock.component";
import { TestBed, ComponentFixture } from "@angular/core/testing";
import { configureTestSuite } from "ng-bullet";
import { DebugElement } from "@angular/core";
import { MockProvider, MockComponent } from "ng-mocks";
import { VersionedRdfListItem } from "../../../shared/models/versionedRdfListItem.class";
import { By } from "@angular/platform-browser";

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
describe('Shapes Graph Properties Block component', function() {
    
    let component: ShapesGraphPropertiesBlockComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<ShapesGraphPropertiesBlockComponent>;
    let shapesGraphStateStub;
    let propertyManagerStub;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            declarations: [
                ShapesGraphPropertiesBlockComponent,
                MockComponent(ShapesGraphPropertyValuesComponent),
                ShowPropertiesPipe
            ],
            providers: [
                ShowPropertiesPipe,
                MockProvider(ShapesGraphStateService),
                MockProvider(ShapesGraphManagerService),
                { provide: 'propertyManagerService', useClass: mockPropertyManager }
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(ShapesGraphPropertiesBlockComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        shapesGraphStateStub = TestBed.get(ShapesGraphStateService);
        shapesGraphStateStub.listItem = new VersionedRdfListItem();
        shapesGraphStateStub.listItem.metadata = {};
        propertyManagerStub = TestBed.get('propertyManagerService');

        component.shapesGraph = {
            'prop1': [{'@id': 'value1'}],
            'prop2': [{'@value': 'value2'}]
        };

        fixture.detectChanges();
    });

    afterAll(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        propertyManagerStub = null;
        shapesGraphStateStub = null;
    });

    it('initializes with the correct data', function() {
        component.shapesGraph = {
            'prop1': [{'@id': 'value1'}],
            'prop2': [{'@value': 'value2'}],
            '@id': 'id'
        };
        component.ngOnChanges();
        expect(component.properties).toEqual(['prop1', 'prop2']);
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.shapes-graph-properties-block')).length).toEqual(1);
            expect(element.queryAll(By.css('.annotation-block')).length).toEqual(1);
        });
        it('with a .section-header', function() {
            expect(element.queryAll(By.css('.section-header')).length).toEqual(1);
        });
        it('depending on how many shapes graph properties there are', function() {
            component.properties = ['prop1', 'prop2'];
            fixture.detectChanges();
            expect(element.queryAll(By.css('shapes-graph-property-values')).length).toEqual(2);
            component.shapesGraph = undefined;
            fixture.detectChanges();
            expect(element.queryAll(By.css('shapes-graph-property-values')).length).toEqual(0);
        });
    });
});
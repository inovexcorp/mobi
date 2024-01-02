/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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
import { cloneDeep } from 'lodash';

import {
    cleanStylesFromDOM,
} from '../../../../../public/test/ts/Shared';
import { MappingClass } from '../../../shared/models/mappingClass.interface';
import { OWL, XSD } from '../../../prefixes';
import { MappingProperty } from '../../../shared/models/mappingProperty.interface';
import { PropPreviewComponent } from './propPreview.component';

describe('Prop Preview component', function() {
    let component: PropPreviewComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<PropPreviewComponent>;
    
    const classId = 'classId';
    const propId = 'propId';
    const objProperty: MappingProperty = {
        iri: propId,
        type: `${OWL}ObjectProperty`,
        name: 'Object Property',
        deprecated: false,
        description: 'Description Object',
        ranges: [classId]
    };
    const dataProperty: MappingProperty = {
        iri: propId,
        type: `${OWL}DatatypeProperty`,
        name: 'Datatype Property',
        deprecated: false,
        description: 'Description Data',
        ranges: [`${XSD}string`]
    };
    const mappingClass: MappingClass = {
        iri: classId,
        name: 'Class Name',
        description: '',
        deprecated: true
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                PropPreviewComponent,
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(PropPreviewComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
    });

    it('should set the correct variables when propDetails changes', function() {
        component.propDetails = dataProperty;
        expect(component.name).toEqual(dataProperty.name);
        expect(component.description).toEqual(dataProperty.description);
    });
    describe('should set the correct variables when the rangeClassDetails changes', function() {
        it('if the property does not have ranges', function() {
            const dataPropertyClone = cloneDeep(dataProperty);
            dataPropertyClone.ranges = [];
            component.propDetails = dataPropertyClone;
            component.rangeClassDetails = undefined;
            expect(component.ranges).toEqual([]);
        });
        it('if it is a data property', function() {
            component.propDetails = dataProperty;
            component.rangeClassDetails = undefined;
            expect(component.ranges).toEqual([{ iri: `${XSD}string`, name: 'String', deprecated: false }]);
        });
        describe('if it is an object property', function() {
            beforeEach(function() {
                component.propDetails = objProperty;
            });
            it('and the range class was passed', function() {
                component.rangeClassDetails = [mappingClass];
                expect(component.ranges).toEqual([{ iri: mappingClass.iri, name: mappingClass.name, deprecated: mappingClass.deprecated }]);
            });
            it('and the range class was not passed', function() {
                component.rangeClassDetails = undefined;
                expect(component.ranges).toEqual([]);
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.prop-preview')).length).toEqual(1);
        });
        it('depending on how many ranges there are', function() {
            fixture.detectChanges();
            expect(element.queryAll(By.css('.has-ranges')).length).toEqual(0);
            expect(element.queryAll(By.css('.no-range')).length).toEqual(1);
            expect(element.queryAll(By.css('.range-item')).length).toEqual(0);

            component.ranges = [
                { iri: 'A', name: 'A', deprecated: false },
                { iri: 'B', name: 'B', deprecated: false },
            ];
            fixture.detectChanges();
            expect(element.queryAll(By.css('.has-ranges')).length).toEqual(1);
            expect(element.queryAll(By.css('.no-range')).length).toEqual(0);
            expect(element.queryAll(By.css('.range-item')).length).toEqual(2);
        });
        it('depending on whether the range class is deprecated', function() {
            expect(element.queryAll(By.css('.deprecated')).length).toEqual(0);

            component.ranges = [{ iri: 'A', name: 'A', deprecated: true }];
            fixture.detectChanges();
            expect(element.queryAll(By.css('.deprecated')).length).toEqual(1);
        });
    });
});

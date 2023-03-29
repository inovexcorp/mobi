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
import { fakeAsync, TestBed } from '@angular/core/testing';

import { ControlRecordI, ControlRecordSearchI, ControlRecordType } from '../classes/controlRecords';
import { ControlRecordUtilsService } from './controlRecordUtils.service';

describe('ControlRecordUtils Service', () => {
    let service : ControlRecordUtilsService;
    let cru1: ControlRecordI;
    let cr1: ControlRecordI;
    let cru2: ControlRecordI;
    let cr21: ControlRecordI;
    let cr22: ControlRecordI;
    let cr41: ControlRecordI;
    let cr410: ControlRecordI;
    let controlRecordsList1: ControlRecordI[];

    beforeEach(async () => {
        await TestBed.configureTestingModule({ 
            providers: [ControlRecordUtilsService] 
        });
        service = TestBed.inject(ControlRecordUtilsService);
        cru1 = { type: ControlRecordType.NODE, id: '0.0', name: 'A',  isImported: undefined,  ontologyId: undefined, onGraph: true, disabled: false};
        cru2 = { type: ControlRecordType.NODE, id: '0.1', name: undefined,  isImported: undefined,  ontologyId: undefined, onGraph: true, disabled: false};
        cr1 = { type: ControlRecordType.NODE, id: '1.1', name: 'A',  isImported: false,  ontologyId: 'Ont1', onGraph: true, disabled: false};
        cr21 = { type: ControlRecordType.NODE, id: '2.1', name: 'A',  isImported: true,  ontologyId: 'Ont2', onGraph: true, disabled: false};
        cr22 = { type: ControlRecordType.NODE, id: '2.2', name: 'B',  isImported: true,  ontologyId: 'Ont2', onGraph: true, disabled: false};
        cr41 = { type: ControlRecordType.NODE, id: '4.1', name: 'A',  isImported: true,  ontologyId: 'Ont4', onGraph: true, disabled: false};
        cr410 = { type: ControlRecordType.NODE, id: '4.10', name: 'Z',  isImported: true,  ontologyId: 'Ont4', onGraph: true, disabled: false};
        controlRecordsList1 =  [cru1, cr21, cru2, cr22, cr41, cr410 ,cr1];
    });
    afterEach(() => {
        service = undefined;
        cru1 = undefined;
        cru2 = undefined;
        cr1 = undefined;
        cr21 = undefined;
        cr22 = undefined;
        cr41 = undefined;
        cr410 = undefined;
        controlRecordsList1 = undefined;
    });
    it('service should be defined', () => { 
        expect(service).toBeDefined();
    });
    describe('service controlRecordComparer should sort data', () => {
        it('successfully', () => {
            const expectedControlRecords: ControlRecordI[] = [ cr1, cr21, cr22, cr41, cr410, cru1, cru2 ];
            const actualSortedControlRecords = [...controlRecordsList1].sort(service.comparer);
            const actualSortedIds = actualSortedControlRecords.map(x => x.id);
            const expectedControlIds = expectedControlRecords.map(x => x.id);
            expect(actualSortedIds.join('|')).toEqual(expectedControlIds.join('|'));
        });
    });
    describe('service getControlRecordSearch', () => {
        it('successfully', () => {
            const search1: ControlRecordSearchI = service.getControlRecordSearch(undefined, 0);
            expect(search1).toEqual({name: ''});
        });
    });
    describe('emitSidebarData method', () => {
        it('successfully', fakeAsync(() => { 
            expect(true).toBe(true); // TODO finish
            // let subCount = [];
            // graphState.allGraphNodes = actualControlRecords;
            // const controlRecordSearch: ControlRecordSearchI = {}
            // const sub1$: Subscription = graphState.controlRecordObservable$.subscribe((controlRecordSearchResultI) => {
            //     subCount.push(controlRecordSearchResultI.count);
            //     expect(controlRecordSearchResultI.count).toEqual(6);
            //     expect(controlRecordSearchResultI.limit).toEqual(500);
            //     expect(controlRecordSearchResultI.records.length).toEqual(3);
            // });

            // graphState.emitGraphData(controlRecordSearch);
            
            // flush();
            
            // const replay$: Subscription = graphState.controlRecordObservable$.subscribe((controlRecordSearchResultI) => {
            //     subCount.push(controlRecordSearchResultI.count);
            //     expect(controlRecordSearchResultI.count).toEqual(6);
            //     expect(controlRecordSearchResultI.limit).toEqual(500);
            //     expect(controlRecordSearchResultI.records.length).toEqual(3);
            // });
            
            // flush();
            // sub1$.unsubscribe();
            // replay$.unsubscribe();
            // flush();
            // expect(subCount).toEqual([6, 6]);
            // expect(controlRecordSubject$.observers.length).toBe(0); // TODO Figure out subscribers would not be 0
        }));
    });
    describe('service mapByOntologyId', () => {
        it('successfully', () => {
            const actualMap: {[key:string]: ControlRecordI[]} = service.mapByOntologyId(controlRecordsList1);
            const expectMap:any = {
                'Ont1': [
                    {'type': 'NODE', 'id': '1.1', 'name': 'A', 'isImported': false,'ontologyId': 'Ont1', 'onGraph': true,'disabled': false}
                ],
                'Ont2': [
                    {'type': 'NODE', 'id': '2.1', 'name': 'A', 'isImported': true, 'ontologyId': 'Ont2', 'onGraph': true,'disabled': false},
                    {'type': 'NODE', 'id': '2.2', 'name': 'B', 'isImported': true, 'ontologyId': 'Ont2', 'onGraph': true,'disabled': false}
                ],
                'Ont4': [
                    {'type': 'NODE', 'id': '4.1', 'name': 'A', 'isImported': true, 'ontologyId': 'Ont4', 'onGraph': true,'disabled': false},
                    {'type': 'NODE', 'id': '4.10', 'name': 'Z', 'isImported': true, 'ontologyId': 'Ont4', 'onGraph': true,'disabled': false}
                ]
            };
            expect(actualMap).toEqual(expectMap);
        });
    });
});
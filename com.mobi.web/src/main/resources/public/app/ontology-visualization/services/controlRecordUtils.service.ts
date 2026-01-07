/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import { Injectable } from '@angular/core';

import { filter, map, toArray } from 'rxjs/operators';
import { from, Observable } from 'rxjs';

import {
  ControlGroupRecordI,
  ControlRecordI,
  ControlRecordSearchGroupedI,
  ControlRecordSearchI,
  ControlRecordSearchResultI,
  GroupedRecord
} from '../classes/controlRecords';
import { GraphState } from '../classes';
import { ImportedOntology } from '../../shared/models/shapesGraphImports.interface';

/**
 * @class ControlRecordUtilsService
 *
 * Service used as ControlRecord utils
 */
@Injectable()
export class ControlRecordUtilsService {
  /**
   * All the classes in the import closure (i.e. direct and imported) grouped by parent ontology
   * The groups are ordered alphabetically along with their lists of child classes
   * @param a ControlRecordI
   * @param b ControlRecordI
   * @returns number
   */
  comparer(a: ControlRecordI, b: ControlRecordI): number {
    let isImported = 0;
    let ontologyId = 0;
    let name = 0;

    if (a.isImported === b.isImported) {
      isImported = 0;
    } else if (a.isImported !== undefined && b.isImported === undefined) {
      isImported = -1;
    } else if (a.isImported === undefined && b.isImported !== undefined) {
      isImported = 1;
    } else if (a.isImported === true && b.isImported === false) {
      isImported = 1;
    } else if (a.isImported === false && b.isImported === true) {
      isImported = -1;
    }

    if (a.ontologyId === b.ontologyId) {
      ontologyId = 0;
    } else if (a.ontologyId !== undefined && b.ontologyId === undefined) {
      ontologyId = -1;
    } else if (a.ontologyId === undefined && b.ontologyId !== undefined) {
      ontologyId = 1;
    } else {
      ontologyId = a.ontologyId.localeCompare(b.ontologyId, 'en', {sensitivity: 'base'});
    }

    if (a.name === b.name) {
      name = 0;
    } else if (a.name !== undefined && b.name === undefined) {
      name = -1;
    } else if (a.name === undefined && b.name !== undefined) {
      name = 1;
    } else {
      name = a.name.localeCompare(b.name, 'en', {sensitivity: 'base'});
    }
    return isImported || ontologyId || name;
  }

  /**
   *
   * @param searchForm Helper Function to get
   * @param limit ControlRecordSearchI
   * @returns ControlRecordSearchI
   */
  getControlRecordSearch(searchForm: any, limit: number): ControlRecordSearchI {
    const controlRecordSearch: ControlRecordSearchI = {};

    if (searchForm !== undefined) {
      controlRecordSearch.name = searchForm.searchText;
      if (searchForm.importOption === 'imported') {
        controlRecordSearch.isImported = true;
      } else if (searchForm.importOption === 'local') {
        controlRecordSearch.isImported = false;
      }
    } else {
      controlRecordSearch.name = '';
    }
    if (limit > 0) {
      controlRecordSearch.limit = limit;
    }
    return controlRecordSearch;
  }

  /**
   * Used to emit controlRecords to subscribers of controlRecordSubject$
   * Currently the SideBar component uses controlRecordSubject
   * @param controlRecordSearch Used for searching records
   */
  emitGraphData(graphState: GraphState, controlRecordSearch: ControlRecordSearchI): void {
    this.emitSidebarData(controlRecordSearch, graphState).subscribe((controlRecordSearchResult: ControlRecordSearchGroupedI) => {
      graphState.controlRecordSubject$.next(controlRecordSearchResult);
    });
  }

  emitSidebarData(controlRecordSearch: ControlRecordSearchI, graphState: GraphState): Observable<ControlRecordSearchGroupedI> {
    const allGraphNodes = graphState.allGraphNodes;
    const ontologyColorMap = graphState.ontologyColorMap;
    // For records to be ordered it assumes that allGraphNodes was store using the RecordComparer,
    // Optimization so that records don't have to sorted everytime
    const graphNodeControlRecordObservable: Observable<ControlRecordSearchResultI> = from(allGraphNodes).pipe(
      filter((controlRecord: ControlRecordI) => {
        const matches: boolean[] = [];

        if (controlRecord.name === undefined) {
          return false;
        }

        if (controlRecordSearch.name !== undefined && controlRecordSearch.name?.length > 0) {
          matches.push(controlRecord.name.toLowerCase().includes(controlRecordSearch.name.toLowerCase()));
        }

        if (controlRecordSearch.isImported !== undefined) {
          matches.push(controlRecord.isImported === controlRecordSearch.isImported);
        }

        return matches.length === 0 || matches.every(Boolean) === true;
      }),
      map((controlRecord: ControlRecordI) => {
        controlRecord.ontologyColor = ontologyColorMap.has(controlRecord.ontologyId) ? ontologyColorMap.get(controlRecord.ontologyId) : 'gray';
        return controlRecord;
      }),
      toArray(),
      map((controlRecords: ControlRecordI[]) => {
        if (controlRecordSearch.limit) {
          const controlRecordSearchResultI: ControlRecordSearchResultI = {
            records: controlRecords.slice(0, controlRecordSearch.limit),
            recordsOverLimit: controlRecords.slice(controlRecordSearch.limit),
            limit: controlRecordSearch.limit,
            count: controlRecords.length
          };
          return controlRecordSearchResultI;
        } else {
          const controlRecordSearchResultI: ControlRecordSearchResultI = {
            records: controlRecords,
            recordsOverLimit: [],
            limit: controlRecords.length,
            count: controlRecords.length
          };
          return controlRecordSearchResultI;
        }
      })
    );
    const importedOntologies = graphState.importedOntologies;
    const ontologies: CombinedOntologyI[] = [{
      id: graphState.ontologyId,
      isImported: false,
      isChecked: true
    }, ...importedOntologies];
    return graphNodeControlRecordObservable.pipe(
      map((controlRecordSearchResultI: ControlRecordSearchResultI): ControlRecordSearchGroupedI => {
        const limit = controlRecordSearchResultI.limit;
        const controlRecords = controlRecordSearchResultI.records;
        const importedIrs = new Set(importedOntologies.map(item => item.id));
        const recordsOntologyMap: { [key: string]: ControlRecordI[] } = this.mapByOntologyId(controlRecords);

        // group ontology Classes by OntologyId
        const groupedOnto = ontologies.reduce((previousValue, currentValue) => {
          let groupedRecord: ControlGroupRecordI;
          const ontologyClasses = currentValue.id in recordsOntologyMap ? recordsOntologyMap[currentValue.id] : [];
          const allOntologyClasses = allGraphNodes.filter(r => r.ontologyId === currentValue.id);

          if (ontologyClasses.length > 0) {
            const allClassesChecked = allOntologyClasses.every(record => record.isChecked);
            const someClassesChecked = allClassesChecked === false && allOntologyClasses.some(record => record.isChecked);
            groupedRecord = new GroupedRecord({
              ontologyId: currentValue.id,
              classes: ontologyClasses,
              allClasses: allOntologyClasses,
              ontologyColor: ontologyColorMap.get(currentValue.id),
              name: graphState?.getName(currentValue.id),
              isImported: importedIrs.has(currentValue.id),
              allClassesChecked: allClassesChecked,
              someClassesChecked: someClassesChecked
            });
            previousValue.push(groupedRecord);
          }
          return previousValue;
        }, []);

        const controlRecordSearchResult: ControlRecordSearchGroupedI = {
          records: groupedOnto,
          limit: limit,
          allClassesAllOntologies: allGraphNodes, // All classes for all ontologies
          count: controlRecordSearchResultI.count
        };
        return controlRecordSearchResult;
      })
    );
  }

  /**
   * Map controlRecords by OntologyId
   * @param controlRecords
   * @returns Map of OntologyId to controlRecords
   */
  mapByOntologyId(controlRecords: ControlRecordI[]): { [key: string]: ControlRecordI[] } {
    return controlRecords.reduce((previousValue: any, currentValue: ControlRecordI) => {
      const ontologyId = currentValue.ontologyId;
      if (!ontologyId) {
        return previousValue;
      }
      if (ontologyId in previousValue) {
        previousValue[ontologyId].push(currentValue);
      } else {
        previousValue[ontologyId] = [currentValue];
      }
      return previousValue;
    }, {});
  }

}

export interface CombinedOntologyI extends ImportedOntology {
  isImported?: boolean;
  isChecked?: boolean;
}

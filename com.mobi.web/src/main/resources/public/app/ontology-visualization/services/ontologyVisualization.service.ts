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
import { Injectable, } from '@angular/core';

import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, shareReplay, switchMap, tap } from 'rxjs/operators';

import { buildColorScale } from '../helpers/graphSettings';
import { ControlRecordUtilsService } from './controlRecordUtils.service';
import { getBeautifulIRI } from '../../shared/utility';
import { GraphState, SidebarState } from '../classes';
import { inProgressCommitI } from '../interfaces/visualization.interfaces';
import { OntologyAction } from '../../shared/models/ontologyAction';
import { OntologyListItem } from '../../shared/models/ontologyListItem.class';
import { OntologyRecordActionI } from '../../shared/services/ontologyRecordAction.interface';
import { OntologyStateService } from '../../shared/services/ontologyState.service';
import { OntologyVisualizationDataService } from './ontologyVisualizationData.service';
import { SidePanelAction, SidePanelPayloadI } from '../classes/sidebarState';

/**
 * @class OntologyVisualizationService
 *
 * A service that communicates with various rest endpoints
 * and defines/holds the data needed for the visualization to render the network diagrams.
 */
@Injectable()
export class OntologyVisualizationService {
  private _graphStateCache = new Map<string, GraphState>(); // Used to store the graph state for a specific commitId
  private _sidebarCache = new Map<string, SidebarState>();
  private _sidePanelActionSubject = new BehaviorSubject<SidePanelPayloadI>({action: SidePanelAction.RECORD_SELECT}); // Used for controlling graph outside OntologyVisualization component
  private _ontologyClassSelectedSubject = new BehaviorSubject<string>('');
  sidePanelActionAction$ = this._sidePanelActionSubject.asObservable();
  ontologyClassSelectedAction$ = this._ontologyClassSelectedSubject.asObservable().pipe(shareReplay(1));

  readonly ERROR_MESSAGE: string = 'Something went wrong. Please try again later.';
  readonly IN_PROGRESS_COMMIT_MESSAGE: string = 'Uncommitted changes will not appear in the graph';
  readonly spinnerId = 'ontology-visualization';
  readonly DEFAULT_NODE_LIMIT = 500; // GLOBAL Node Limit for graph, each graphState will has it own

  constructor(
    private ds: OntologyVisualizationDataService,
    private os: OntologyStateService,
    private controlRecordUtils: ControlRecordUtilsService) {
    if (this.os.ontologyRecordAction$) {
      this.os.ontologyRecordAction$.subscribe((record: OntologyRecordActionI) => this.removeOntologyCache(record));
    }
  }

  /**
   * Used to get GraphState cache which is used to store the graph state for a specific commitId
   */
  public get graphStateCache(): Map<string, GraphState> {
    return this._graphStateCache;
  }

  /**
   * Emit SelectAction
   * @param action
   */
  public emitSelectAction(action: any): void {
    this._ontologyClassSelectedSubject.next(action);
  }

  /**
   * Emit SidePanel events or actions
   * @param action
   */
  public emitSidePanelAction(action: SidePanelPayloadI): void {
    this._sidePanelActionSubject.next(action);
  }

  public getSidePanelActionActionObserver(): Observable<SidePanelPayloadI> {
    return this.sidePanelActionAction$;
  }

  /**
   * @name init
   *
   * @param commitId commitId
   * @param inProgressCommit If there are any inProgressCommits
   * @returns { Observable } A Observable that resolves to a Map (data structure) that contains the graph state.
   */
  init(commitId: string, inProgressCommit: inProgressCommitI): Observable<GraphState> {
    const self = this;
    const ontologyListItem = new OntologyListItem();
    if (inProgressCommit) {
      ontologyListItem.inProgressCommit.additions = inProgressCommit?.additions;
      ontologyListItem.inProgressCommit.deletions = inProgressCommit?.deletions;
    }
    const hasInProgressCommit: boolean = !!inProgressCommit && !!inProgressCommit?.additions.length && !!inProgressCommit?.deletions.length;
    return of(commitId).pipe(
      tap((commitId: string): void => {
        if (this.os.listItem.hasPendingRefresh) {
          this.os.listItem.hasPendingRefresh = false;
          this.graphStateCache.delete(commitId);
        }
      }),
      map((commitId: string): GraphState => {
        if (self.graphStateCache.has(commitId)) {
          return this.graphStateCache.get(commitId);
        } else {
          const commitGraphState: GraphState = new GraphState({
            commitId: commitId,
            ontologyId: this.os.listItem.ontologyId,
            recordId: this.os.listItem.versionedRdfRecord.recordId,
            importedOntologies: this.os.listItem.importedOntologies || [], // * This is object reference
            positioned: false,
            isOverLimit: false,
            nodeLimit: self.DEFAULT_NODE_LIMIT,
            allGraphNodes: [],
            allGraphEdges: [],
            selectedNodes: false,
            getName: (iri) => getBeautifulIRI(iri),
            allGraphNodesComparer: this.controlRecordUtils.comparer
          });
          this.graphStateCache.set(commitId, commitGraphState);
          return commitGraphState;
        }
      }),
      switchMap((commitGraphState: GraphState): Observable<GraphState> =>
        this.ds.buildGraphData(commitGraphState, hasInProgressCommit)
      ),
      tap((commitGraphState: GraphState): void => {
        const styleObject = buildColorScale(commitGraphState.importedOntologies, commitGraphState.ontologyId);
        commitGraphState.style = styleObject.style;
        commitGraphState.ontologyColorMap = new Map(Object.entries(styleObject.ontologyColorMap));

        const ontologiesClassMap = new Map();
        commitGraphState.importedOntologies?.forEach((item, index: number) => {
          ontologiesClassMap.set(item.id, `Ontology-${index}`);
        });
        commitGraphState.ontologiesClassMap = ontologiesClassMap;

        commitGraphState.isOverLimit = commitGraphState.allGraphNodes?.length > commitGraphState.nodeLimit;
        const controlRecordSearch = this.controlRecordUtils.getControlRecordSearch(commitGraphState.searchForm, commitGraphState.nodeLimit);
        this.controlRecordUtils.emitGraphData(commitGraphState, controlRecordSearch);
      })
    );
  }

  /**
   * Get Sidebar State
   * @param commitId
   * @returns SidebarState
   */
  public getSidebarState(commitId: string): SidebarState {
    let state: SidebarState;
    if (this._sidebarCache.has(commitId)) {
      state = this._sidebarCache.get(commitId);
    } else {
      state = new SidebarState({commitId, recordId: this.os.listItem.versionedRdfRecord.recordId});
      this._sidebarCache.set(commitId, state);
    }
    return state;
  }

  /**
   * Returns Commit Graph State.
   * @returns { GraphState } An GraphStateI Object
   */
  getGraphState(commitId: string, error = true): GraphState {
    if (this.graphStateCache.has(commitId)) {
      return this.graphStateCache.get(commitId);
    }
    if (error) {
      throw new Error(`Graph State does not exist for commit: ${commitId}`);
    }
  }

  /**
   * Remove OntologyRecord from cache
   * @param recordInfo OntologyRecordActionI
   */
  public removeOntologyCache(recordInfo: OntologyRecordActionI): void {
    if (recordInfo?.action !== undefined && recordInfo.action.valueOf() === OntologyAction.ONTOLOGY_CLOSE.valueOf()) {
      this._graphStateCache.forEach(item => {
        if (item.recordId === recordInfo.recordId) {
          this._graphStateCache.delete(item.commitId);
        }
      });
    }
  }
}

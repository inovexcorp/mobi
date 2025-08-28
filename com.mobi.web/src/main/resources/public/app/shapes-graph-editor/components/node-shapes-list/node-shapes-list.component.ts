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
import {
  AfterViewInit,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';

import { Subject, Subscription } from 'rxjs';
import { delayWhen, distinctUntilChanged, filter, map, takeUntil } from 'rxjs/operators';

import { getBeautifulIRI } from '../../../shared/utility';
import { NodeShapeSelection } from '../../../shared/models/shapesGraphListItem.class';
import { NodeShapeSummary } from '../../models/node-shape-summary.interface';
import { RESTError } from '../../../shared/models/RESTError.interface';
import { ShapesGraphManagerService } from '../../../shared/services/shapesGraphManager.service';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { ToastService } from '../../../shared/services/toast.service';
import { VersionedRdfListItem } from '../../../shared/models/versionedRdfListItem.class';
import { VersionedRdfRecord } from '../../../shared/models/versionedRdfRecord.interface';

/**
 * @class NodeShapesListComponent
 * @requires ShapesGraphStateService
 * @requires ShapesGraphManagerService
 * @requires ToastService

 * Component displays a scrollable list of SHACL Node Shapes for a given record.
 * Supports filtering by search text and highlights the currently selected shape.
 * Displays a message if no matching shapes are found.
 * 
 * @param {VersionedRdfRecord} versionedRdfRecord The record containing node shape VersionedRdfRecord data.
 * @param {string} viewedRecord The IRI of the currently selected or viewed node shape.
 * @param {VersionedRdfListItem} listItem - The state management object for this specific list item instance.
 */
@Component({
  selector: 'app-node-shapes-list',
  templateUrl: './node-shapes-list.component.html',
  styleUrls: ['./node-shapes-list.component.scss']
})
export class NodeShapesListComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() versionedRdfRecord: VersionedRdfRecord;
  @Input() viewedRecord: string;
  @Input() listItem: VersionedRdfListItem;

  @ViewChild('virtualScroll') viewport: CdkVirtualScrollViewport;

  private _destroySub$ = new Subject<void>();
  private _viewReady$ = new Subject<void>();
  private _selectionSubscription: Subscription;

  searchText = '';

  constructor(
    private _sgm: ShapesGraphManagerService,
    public sgs: ShapesGraphStateService,
    private _toast: ToastService
  ) { }

  ngAfterViewInit(): void {
    this._viewReady$.next();
    this._viewReady$.complete();
  }

  /**
   * Called whenever Angular detects changes to the input properties of the component.
   * This lifecycle hook is triggered before Angular's view or content projection is updated.
   *
   * @return {void} This method does not return any value.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (!changes.viewedRecord?.firstChange) {
      this.searchText = '';
    }
    let shouldRetrieveList = false;
    if (changes.versionedRdfRecord && !changes.versionedRdfRecord.firstChange) {
      this.searchText = '';
      shouldRetrieveList = true;
    }
    if (changes.listItem) {
      this._selectionSubscription?.unsubscribe();
      this._subscribeToSelectionChanges();
      shouldRetrieveList = true;
    }
    if (shouldRetrieveList && this.versionedRdfRecord && this.listItem) {
      this._retrieveList();
    }
  }

  /**
   * Angular lifecycle hook called when the component is destroyed.
   */
  ngOnDestroy(): void {
    this._destroySub$.next();
    this._destroySub$.complete();
    this._selectionSubscription?.unsubscribe();
  }

  private _subscribeToSelectionChanges(): void {
    let isFirstEmission = true; // Use to restore scroll location
    this._selectionSubscription = this.sgs.listItem.selectedNodeShapeIri$
      .pipe(
        takeUntil(this._destroySub$),
        distinctUntilChanged(),
        filter((nodeShapeSelection: NodeShapeSelection) => {
          return nodeShapeSelection && !!nodeShapeSelection.iri;
        }),
        map((nodeShapeSelection: NodeShapeSelection) => {
          if (isFirstEmission) {
            isFirstEmission = false;
            return {
              ...nodeShapeSelection,
              shouldScroll: true
            };
          }
          return nodeShapeSelection;
        }),
        delayWhen(() => this._viewReady$) // Switch to delay when RXjs version is > 8
      ).subscribe((nodeShapeSelection: NodeShapeSelection) => {
        if (nodeShapeSelection.shouldScroll) {
          this._scrollToIri(nodeShapeSelection.iri);
        }
      });
  }

  get nodeShapes(): NodeShapeSummary[] {
    return this.sgs.listItem?.editorTabStates?.nodeShapes?.nodes || [];
  }

  private _scrollToIri(iri: string): void {
    if (!this.viewport) {
      return; // Viewport is not ready yet
    }
    const nodes = this.sgs.listItem.editorTabStates.nodeShapes.nodes;
    const index = nodes.findIndex(node => node.iri === iri);
    if (index > -1) {
      // setTimeout waits for Angular's change detection to finish rendering
      // the items in the virtual scroll list
      setTimeout(() => {
        this.viewport.scrollToIndex(index);
      });
    }
  }

  /**
   * Initiates a search operation by retrieving a list of node shapes.
   *
   * @return {void} Does not return any value.
   */
  search(): void {
    this._retrieveList();
  }

  /**
   * Handles selection of a NodeShape item from the list.
   *
   * @param selectedNodeShapeInfo - The selected node shape information to emit.
   */
  onItemSelection(selectedNodeShapeInfo: NodeShapeSummary): void {
    const { iri, sourceOntologyIRI } = selectedNodeShapeInfo;
    this.sgs.listItem.setSelectedNodeShapeIri(iri);
    this.sgs.listItem.editorTabStates.nodeShapes.sourceIRI = sourceOntologyIRI;
    this.sgs.setSelected(selectedNodeShapeInfo.iri, this.sgs.listItem).subscribe();
  }

  /**
   * Retrieves a list of Node Shapes for the given RDF record and search text.
   * Updates the component state and displays user-friendly labels for target types and values.
   * Handles errors by showing a toast message.
   */
  private _retrieveList(): void {
    if (!this.versionedRdfRecord || !this.listItem) {
      return;
    }
    this._sgm.getNodeShapes(
      this.versionedRdfRecord.recordId,
      this.versionedRdfRecord.branchId,
      this.versionedRdfRecord.commitId,
      true,
      this.searchText
    ).pipe(
      takeUntil(this._destroySub$)
    ).subscribe((nodes: NodeShapeSummary[]) => {
      nodes.forEach(nodeShape => {
        nodeShape.targetTypeLabel = getBeautifulIRI(nodeShape.targetType);
        nodeShape.targetValueLabel = this.sgs.getEntityName(nodeShape.targetValue);
      });
      this.sgs.listItem.editorTabStates.nodeShapes.nodes = nodes; // Provide reference for updating
    }, (error: RESTError) => {
      this._toast.createErrorToast(error.errorMessage);
    });
  }
}

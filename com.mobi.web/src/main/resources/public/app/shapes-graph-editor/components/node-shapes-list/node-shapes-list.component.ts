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
//Angular imports
import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';

// 3rd party imports
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

//Mobi imports
import { getBeautifulIRI } from '../../../shared/utility';
import { NodeShapeSummary } from '../../models/node-shape-summary.interface';
import { ShapesGraphManagerService } from '../../../shared/services/shapesGraphManager.service';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { ToastService } from '../../../shared/services/toast.service';
import { VersionedRdfRecord } from '../../../shared/models/versionedRdfRecord.interface';
import { RESTError } from '../../../shared/models/RESTError.interface';

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
 */
@Component({
  selector: 'app-node-shapes-list',
  templateUrl: './node-shapes-list.component.html',
  styleUrls: ['./node-shapes-list.component.scss']
})
export class NodeShapesListComponent implements OnChanges, OnDestroy {
  @Input() versionedRdfRecord: VersionedRdfRecord;
  @Input() viewedRecord: string;

  private _destroySub$ = new Subject<void>();

  searchText = '';

  constructor(
    private _sgm: ShapesGraphManagerService,
    public sgs: ShapesGraphStateService,
    private _toast: ToastService
  ) {}

  /**
   * Called whenever Angular detects changes to the input properties of the component.
   * This lifecycle hook is triggered before Angular's view or content projection is updated.
   *
   * Executes the `retrieveList` method to perform necessary actions upon changes in input bindings.
   *
   * @return {void} This method does not return any value.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (!changes.viewedRecord?.firstChange) {
      this.searchText = '';
    }
    this._retrieveList();
  }
  
  /**
   * Angular lifecycle hook called when the component is destroyed.
   * 
   * Emits a signal to complete all active subscriptions bound with `takeUntil(this._destroySub$)`,
   * ensuring proper cleanup and preventing memory leaks.
   */
  ngOnDestroy(): void {
    this._destroySub$.next();
    this._destroySub$.complete();
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
    this.sgs.listItem.editorTabStates.nodeShapes = {
      ...this.sgs.listItem.editorTabStates.nodeShapes,
      entityIRI: selectedNodeShapeInfo.iri,
      sourceIRI: selectedNodeShapeInfo.sourceOntologyIRI,
    };
    this.sgs.setSelected(selectedNodeShapeInfo.iri, this.sgs.listItem).subscribe();
  }

  /**
   * Retrieves a list of Node Shapes for the given RDF record and search text.
   * Updates the component state and displays user-friendly labels for target types and values.
   * Handles errors by showing a toast message.
   */
  private _retrieveList(): void {
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

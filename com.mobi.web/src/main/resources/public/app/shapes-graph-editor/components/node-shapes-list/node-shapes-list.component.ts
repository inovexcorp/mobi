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
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

//Mobi imports
import { NodeShapeInfo } from '../../models/nodeShapeInfo.interface';
import { ShapesGraphManagerService } from '../../../shared/services/shapesGraphManager.service';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-node-shapes-list',
  templateUrl: './node-shapes-list.component.html',
  styleUrls: ['./node-shapes-list.component.scss']
})
export class NodeShapesListComponent implements OnChanges {
  @Input() viewedRecord: string;
  nodeShapes: NodeShapeInfo[] = [];
  searchText = '';

  constructor(public sgm: ShapesGraphManagerService, public sgs: ShapesGraphStateService, public toast: ToastService) {}

  /**
   * Called whenever Angular detects changes to the input properties of the component.
   * This lifecycle hook is triggered before Angular's view or content projection is updated.
   *
   * Executes the `retrieveList` method to perform necessary actions upon changes in input bindings.
   *
   * @return {void} This method does not return any value.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (!changes.viewedRecord.firstChange) {
      this.searchText = '';
    }
    this.retrieveList();
  }

  /**
   * Initiates a search operation by retrieving a list of node shapes.
   *
   * @return {void} Does not return any value.
   */
  search(): void {
    this.retrieveList();
  }

  private retrieveList(): void {
    this.sgm.getNodeShapes(this.sgs.listItem.versionedRdfRecord.recordId, this.sgs.listItem.versionedRdfRecord.branchId,
      this.sgs.listItem.versionedRdfRecord.commitId, true, this.searchText).subscribe(nodes => {
      this.nodeShapes = nodes;
    }, (error) => {
      this.toast.createErrorToast(error);
    });
  }
}

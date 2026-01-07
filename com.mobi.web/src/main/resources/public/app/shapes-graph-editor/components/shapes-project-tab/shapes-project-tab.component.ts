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
import { Component, Input } from '@angular/core';

import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { ONTOLOGYEDITOR, SHAPESGRAPHEDITOR } from '../../../prefixes';
import { ShapesGraphListItem } from '../../../shared/models/shapesGraphListItem.class';
import { ShapesGraphManagerService } from '../../../shared/services/shapesGraphManager.service';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';

/**
 * @class ShapesProjectTabComponent
 * @requires ShapesGraphManagerService
 * @requires ShapesGraphStateService
 *
 * A component that creates a page containing information about the current shapes graph
 *
 * @param {ShapesGraphListItem} listItem - The selected item containing node shape data to display.
 * @param {boolean} canModify Indicates whether the user has permission to modify the listItem.
 */
@Component({
  selector: 'app-shapes-project-tab',
  templateUrl: './shapes-project-tab.component.html'
})
export class ShapesProjectTabComponent {
  @Input() listItem: ShapesGraphListItem;
  @Input() canModify: boolean;

  targetRecordTypes = [`${ONTOLOGYEDITOR}OntologyRecord`, `${SHAPESGRAPHEDITOR}ShapesGraphRecord`];
  noImportMessage = 'This shapes graph does not have any imports.';
  annotationIRIs = [];

  constructor(
    private _sgm: ShapesGraphManagerService,
    public state: ShapesGraphStateService
  ) {}

  keys(object: JSONLDObject): Array<string> {
    return Object.keys(object);
  }

  /**
   * Updates the preview format and fetches the corresponding Shapes Graph content.
   * @param {string} format The format of the content (e.g., "text/turtle", "application/ld+json")
   */
  updateContentType(format: string): void {
    const recordInfo = this.state.listItem.versionedRdfRecord;
    this.state.listItem.previewFormat = format;
    this._sgm
      .getShapesGraphContent(
        recordInfo.recordId,
        recordInfo.branchId,
        recordInfo.commitId,
        format,
        true
      )
      .subscribe(
        (content: string | JSONLDObject[]) => {
          this.state.listItem.content =
            typeof content !== 'string' ? JSON.stringify(content, null, 2) : content;
        },
        (error) => (this.state.listItem.content = error)
      );
  }
}

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
import { Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { VersionedRdfListItem } from '../../../shared/models/versionedRdfListItem.class';
import { UploadItem } from '../../models/upload-item.interface';
import { UploadErrorsModalComponent } from '../upload-errors-modal/upload-errors-modal.component';
import { VersionedRdfState } from '../../../shared/services/versionedRdfState.service';
import { stateServiceToken } from '../../../shared/injection-token';

/**
 * @class versioned-rdf-record-editor.UploadRecordLogComponent
 * 
 * A component that creates an icon button with a mat-menu that displays information about the recently submitted
 * VersionedRDFRecord uploads of the current editor. The button has a badge that indicates how many submitted uploads
 * failed. The menu lists all the uploaded records, including ones in progress. Failed uploads with error details
 * provide a link to open the {@link versioned-rdf-record-editor.UploadErrorsModalComponent} for more information.
 */
@Component({
  selector: 'app-upload-record-log',
  templateUrl: './upload-record-log.component.html',
  styleUrls: ['./upload-record-log.component.scss']
})
export class UploadRecordLogComponent<TData extends VersionedRdfListItem> {

  @ViewChild('uploadLogTrigger', { static: true, read: ElementRef }) uploadLogTrigger: ElementRef;

  constructor(@Inject(stateServiceToken) public state: VersionedRdfState<TData>, private dialog: MatDialog) { }

  menuClosed(event: void | 'click' | 'keydown'): void {
    if (event !== 'keydown') { // void is clicking on the backdrop
      window.setTimeout(() => {
        this.uploadLogTrigger.nativeElement.blur();
      }, 0);
    }
  }
  showUploadErrorsOverlay(item: UploadItem): void {
    this.dialog.open(UploadErrorsModalComponent, { data: { item } });
  }
  getNumErrors(): number {
    return this.state.uploadList.filter(item => !!item.error).length;
  }
}

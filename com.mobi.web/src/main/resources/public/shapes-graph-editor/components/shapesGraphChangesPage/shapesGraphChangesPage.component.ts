/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2021 iNovex Information Systems, Inc.
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
import { Inject, Component } from '@angular/core';
import { get } from 'lodash';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';

import './shapesGraphChangesPage.component.scss';

 /**
 * @class shapes-graph-editor.ShapesGraphChangesPageComponent
 * 
 * A component that creates a page that displays all the current users's saved changes
 * (aka inProgressCommit) of the current ShapesGraphRecord. The changes are grouped by
 * subject. The display will include a button to remove all the saved changes if there are any. If there are
 * no changes, an {@link shared.component:infoMessage} is shown stating as such. If the current branch is
 * not up to date and there are changes, an {@link shared.component:errorDisplay} is shown. If there are
 * no changes and the current branch is not up to date, an `errorDisplay` is shown with a link to pull in the
 * latest changes. If there are no changes and the user is on a UserBranch then an `errorDisplay` is shown with
 * a link to "pull changes" which will perform a merge of the UserBranch into the parent branch. If there are
 * no changes, the user is on a UserBranch, and the parent branch no longer exists, an `errorDisplay` is shown
 * with a link to restore the parent branch with the UserBranch.
 */
@Component({
    selector: 'shapes-graph-changes-page',
    templateUrl: './shapesGraphChangesPage.component.html'
})
export class ShapesGraphChangesPageComponent {

    catalogId: string = get(this.cm.localCatalog, '@id', '');
    
    constructor(public state: ShapesGraphStateService, @Inject('catalogManagerService') private cm, @Inject('utilService') private util) {}

    removeChanges(): void {
        this.cm.deleteInProgressCommit(this.state.listItem.versionedRdfRecord.recordId, this.catalogId)
            .then(() => {
                this.state.clearInProgressCommit();
                this.util.createSuccessToast('In Progress Commit removed successfully.');
            }, errorMessage => this.util.createErrorToast(`Error removing In Progress Commit: ${errorMessage}`));
    }
}

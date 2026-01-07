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
import { find } from 'lodash';
import { switchMap } from 'rxjs/operators';
import { Component } from '@angular/core';

import { DiscoverStateService } from '../../../../shared/services/discoverState.service';
import { ExploreService } from '../../../services/explore.service';
import { ExploreUtilsService } from '../../services/exploreUtils.service';
import { CATALOG } from '../../../../prefixes';
import { PolicyEnforcementService } from '../../../../shared/services/policyEnforcement.service';

import { ToastService } from '../../../../shared/services/toast.service';

/**
 * @class explore.InstanceEditorComponent
 *
 * A component that displays {@link shared.BreadCrumbsComponent} to the class of the instance being edited.
 * It also provides an {@link explore.InstanceFormComponent} to show the complete list of properties
 * available for the new instance in an editable format along with save and cancel buttons for the editing.
 */

@Component({
    selector: 'instance-editor',
    templateUrl: 'instanceEditor.component.html',
    styleUrls: ['./instanceEditor.component.scss']
})
export class InstanceEditorComponent {
    isValid = true;

    constructor(public ds: DiscoverStateService, private es: ExploreService, private eu: ExploreUtilsService,
                private toast: ToastService, private pep: PolicyEnforcementService) {
    }

    save(): void {
        const pepRequest = {
            resourceId: this.ds.explore.recordId,
            actionId: `${CATALOG}Modify`
        };
        this.pep.evaluateRequest(pepRequest)
            .subscribe(response => {
                const canModify = response !== this.pep.deny;
                
                if (canModify) {
                    this.ds.explore.instance.entity = this.eu.removeEmptyPropertiesFromArray(this.ds.explore.instance.entity);
                    const instance = this.ds.getInstance();

                    this.es.updateInstance(this.ds.explore.recordId, this.ds.explore.instance.metadata.instanceIRI, this.ds.explore.instance.entity)
                        .pipe(switchMap(() => {
                            return this.es.getClassInstanceDetails(this.ds.explore.recordId, this.ds.explore.classId, {offset: this.ds.explore.instanceDetails.currentPage * this.ds.explore.instanceDetails.limit, limit: this.ds.explore.instanceDetails.limit});
                        }))
                        .subscribe((response) => {
                            this.ds.explore.instanceDetails.data = response.body;
                            this.ds.explore.instance.metadata = find(response.body, {instanceIRI: instance['@id']});
                            this.ds.explore.breadcrumbs[this.ds.explore.breadcrumbs.length - 1] = this.ds.explore.instance.metadata.title;
                            this.ds.explore.editing = false;
                        }, (error) => this.toast.createErrorToast(error));
                } else {
                    this.toast.createErrorToast('You don\'t have permission to modify dataset');
                    this.cancel();
                }
            }, () => {
                this.toast.createWarningToast('Could not retrieve record permissions');
            });
    }
    cancel(): void {
        this.ds.explore.instance.entity = this.ds.explore.instance.original;
        this.ds.explore.editing = false;
    }
    checkValidation(event: {value: boolean}): void {
        this.isValid = event.value;
    }
}

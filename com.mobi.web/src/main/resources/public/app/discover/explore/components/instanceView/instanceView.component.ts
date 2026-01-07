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
import { cloneDeep, omit } from 'lodash';
import { Component, Input, OnChanges, OnInit } from '@angular/core';

import { DiscoverStateService } from '../../../../shared/services/discoverState.service';
import { CATALOG } from '../../../../prefixes';
import { PolicyEnforcementService } from '../../../../shared/services/policyEnforcement.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { getBeautifulIRI } from '../../../../shared/utility';
import { JSONLDId } from '../../../../shared/models/JSONLDId.interface';
import { JSONLDValue } from '../../../../shared/models/JSONLDValue.interface';
import { JSONLDObject } from '../../../../shared/models/JSONLDObject.interface';

/**
 * @class explore.InstanceViewComponent
 *
 * A component that displays {@link shared.BreadCrumbsComponent} to the class of the instance being viewed. It shows the
 * complete list of properties associated with the selected instance. If a property value is reified, a toggleable
 * dropdown display is included.
 *
 * @param {Object} entity The instance entity to view
 */
@Component({
    selector: 'instance-view',
    templateUrl: './instanceView.component.html',
    styleUrls: ['./instanceView.component.scss']
})

export class InstanceViewComponent implements OnInit, OnChanges {
    @Input() entityArr: JSONLDObject[] = []; // Only used to keep the view up to date

    propertyValues: {property: string, display: string, more: boolean, values: (JSONLDId|JSONLDValue)[]}[] = [];

    constructor(public ds: DiscoverStateService, private pep: PolicyEnforcementService,
        private toast: ToastService) {}

    ngOnInit(): void {
        this._setPropertyValues();
    }
    ngOnChanges(): void {
        this._setPropertyValues();
    }
    edit(): void {
        const pepRequest = {
            resourceId: this.ds.explore.recordId,
            actionId: `${CATALOG}Modify`
        };
        this.pep.evaluateRequest(pepRequest)
            .subscribe(response => {
                const canModify = response !== this.pep.deny;
                if (canModify) {
                    this.ds.explore.editing = true;
                    this.ds.explore.instance.original = cloneDeep(this.ds.explore.instance.entity);
                } else {
                    this.toast.createErrorToast('You don\'t have permission to modify dataset');
                }
            }, () => {
                this.toast.createWarningToast('Could not retrieve record permissions');
            });
    }

    private _setPropertyValues(): void {
        const entity: {[key: string]: (JSONLDId|JSONLDValue)[]} = omit(this.ds.getInstance(), ['@id', '@type']);
        this.propertyValues = [];
        Object.keys(entity).forEach(property => {
            this.propertyValues.push({
                property,
                more: false,
                display: getBeautifulIRI(property),
                values: entity[property]
            });
        });
    }
}

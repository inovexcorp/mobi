/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import * as angular from 'angular';
import { omit } from 'lodash';
import { DiscoverStateService } from '../../../../shared/services/discoverState.service';

import './instanceView.component.scss';
import { Component, Inject, Input, OnChanges, OnInit } from '@angular/core';
import { ExploreUtilsService } from '../../services/exploreUtils.service';
import { CATALOG } from '../../../../prefixes';

import policyEnforcementService from '../../../../shared/services/policyEnforcement.service';

/**
 * @ngdoc component
 * @name explore.component:instanceView
 * @requires shared.service:discoverStateService
 * @requires shared.service:utilService
 * @requires explore.service:exploreUtilsService
 * @requires shared.service:prefixes
 * @requires shared.service:policyEnforcementService
 *
 * @description
 * `instanceView` is a component that displays {@link shared.component:breadCrumbs} to the class of the instance
 * being viewed. It shows the complete list of properties associated with the selected instance. If a property value
 * is reified, a toggleable dropdown display is included.
 *
 * @param {Object} entity The instance entity to view
 */
@Component({
    selector: 'instance-view',
    templateUrl: './instanceView.component.html'
})

export class InstanceViewComponent implements OnInit, OnChanges {
    @Input() entity: any = {};

    constructor(public ds: DiscoverStateService, private eu: ExploreUtilsService,
                @Inject('policyEnforcementService') private pep, @Inject('utilService') private util) {
    }

    ngOnInit(): void {
        this.entity = this.getEntity();
    }
    ngOnChanges() {
        this.entity = this.getEntity();
    }
    getLimit = function(array, limit) {
        let len = array.length;
        return len === limit ? 1 : len;
    }
    edit() {
        const pepRequest = {
            resourceId: this.ds.explore.recordId,
            actionId: CATALOG + 'Modify'
        };
        this.pep.evaluateRequest(pepRequest)
            .then(response => {
                const canModify = response !== this.pep.deny;
                if (canModify) {
                    this.ds.explore.editing = true;
                    this.ds.explore.instance.original = angular.copy(this.ds.explore.instance.entity);
                } else {
                    this.util.createErrorToast('You don\'t have permission to modify dataset');
                }
            }, () => {
                this.util.createWarningToast('Could not retrieve record permissions');
            });
    }

    private getEntity() {
        return omit(this.ds.getInstance(), ['@id', '@type']);
    }
}


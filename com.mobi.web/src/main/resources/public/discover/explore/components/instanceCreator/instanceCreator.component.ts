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
import { initial, find, get } from 'lodash';
import { DiscoverStateService } from '../../../../shared/services/discoverState.service';

import './instanceCreator.component.scss';
import { Component, Inject } from '@angular/core';
import { ExploreService } from '../../../services/explore.service';
import { ExploreUtilsService } from '../../services/exploreUtils.service';
import { DCTERMS, OWL, RDFS, RDF, CATALOG } from '../../../../prefixes';
import { HttpResponse } from '@angular/common/http';
import { InstanceDetails } from '../../../models/instanceDetails.interface';
import { switchMap } from 'rxjs/operators';

/**
 * @ngdoc component
 * @name explore.component:instanceCreator
 * @requires $q
 * @requires shared.service:discoverStateService
 * @requires shared.service:utilService
 * @requires discover.service:exploreService
 * @requires explore.service:exploreUtilsService
 * @requires shared.service:prefixes
 *
 * @description
 * `instanceCreator` is a component that displays {@link shared.component:breadCrumbs} to the class of the instance being created.
 * It also provides an {@link explore.component:instanceForm} to show the complete list of properties
 * available for the new instance in an editable format along with save and cancel buttons for the editing.
 */

@Component({
    selector: 'instance-creator',
    templateUrl: './instanceCreator.component.html'
})

export class InstanceCreatorComponent {
    isValid = true;

    constructor(private es: ExploreService, private eu: ExploreUtilsService, public ds: DiscoverStateService,
                @Inject('utilService') private util, @Inject('policyEnforcementService') private pep) {
    }

    save() {
        const pepRequest = {
            resourceId: this.ds.explore.recordId,
            actionId: CATALOG + 'Modify'
        };
        this.pep.evaluateRequest(pepRequest)
            .then(response => {
                const canModify = response !== this.pep.deny;
                if (canModify) {
                    this.ds.explore.instance.entity = this.eu.removeEmptyPropertiesFromArray(this.ds.explore.instance.entity);
                    const instance = this.ds.getInstance();
                    this.es.createInstance(this.ds.explore.recordId, this.ds.explore.instance.entity)
                        .pipe(switchMap(() => {
                            this.ds.explore.instanceDetails.total++;
                            const offset = (this.ds.explore.instanceDetails.currentPage - 1) * this.ds.explore.instanceDetails.limit;
                            return this.es.getClassInstanceDetails(this.ds.explore.recordId, this.ds.explore.classId, {offset, limit: this.ds.explore.instanceDetails.limit});
                        }), switchMap(response => {
                            const resultsObject = this.es.createPagedResultsObject(response as HttpResponse<InstanceDetails[]>);
                            this.ds.explore.instanceDetails.data = resultsObject.data;
                            let metadata: any = {instanceIRI: instance['@id']};
                            metadata.title = this.getPreferredValue(instance, [DCTERMS + 'title', RDFS + 'label'], this.util.getBeautifulIRI(instance['@id']));
                            metadata.description = this.getPreferredValue(instance, [DCTERMS + 'description', RDFS + 'comment'], '');
                            this.ds.explore.instance.metadata = metadata;
                            this.ds.explore.breadcrumbs[this.ds.explore.breadcrumbs.length - 1] = this.ds.explore.instance.metadata.title;
                            this.ds.explore.creating = false;
                            return this.es.getClassDetails(this.ds.explore.recordId);
                        }))
                        .subscribe((response) => {
                            this.ds.explore.classDetails = response;
                        }, (error) => this.util.createErrorToast(error));
                } else {
                    this.util.createErrorToast('You don\'t have permission to modify dataset');
                    this.cancel();
                }
            }, () => {
                this.util.createWarningToast('Could not retrieve record permissions');
            });
    }
    cancel() {
        this.ds.explore.instance.entity = [];
        this.ds.explore.creating = false;
        this.ds.explore.breadcrumbs = initial(this.ds.explore.breadcrumbs);
    }
    checkValidation(event): void {
        this.isValid = event.value;
    }

    private getPreferredValue(entity, props, defaultValue) {
        const prop = find(props, prop => entity[prop]);
        return prop ? get(find(entity[prop], obj => !obj['@lang'] || obj['@lang'] === 'en'), '@value') : defaultValue;
    }
}

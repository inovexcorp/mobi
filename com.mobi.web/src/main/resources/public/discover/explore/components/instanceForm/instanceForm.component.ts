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
import { MatDialog } from '@angular/material/dialog';
import { filter, some, forEach, concat, includes, uniq, map, join, find, get, flatten, remove } from 'lodash';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { forkJoin } from 'rxjs';
import { MatChipInputEvent } from '@angular/material/chips';

import { NewInstancePropertyOverlayComponent } from '../newInstancePropertyOverlay/newInstancePropertyOverlay.component';
import { EditIriOverlayComponent } from '../../../../shared/components/editIriOverlay/editIriOverlay.component';
import { DiscoverStateService } from '../../../../shared/services/discoverState.service';
import { ExploreService } from '../../../services/explore.service';
import { ExploreUtilsService } from '../../services/exploreUtils.service';
import { DCTERMS, OWL, RDFS } from '../../../../prefixes';
import { ConfirmModalComponent } from '../../../../shared/components/confirmModal/confirmModal.component';
import { JSONLDObject } from '../../../../shared/models/JSONLDObject.interface';
import { SplitIRIPipe } from '../../../../shared/pipes/splitIRI.pipe';
import { SplitIRI } from '../../../../shared/models/splitIRI.interface';
import { PropertyDetails } from '../../../models/propertyDetails.interface';
import { UtilService } from '../../../../shared/services/util.service';

/**
 * @class explore.InstanceFormComponent
 *
 * A component that creates a form with the complete list of properties associated with the
 * {@link shared.DiscoverStateService selected instance} in an editable format. Also provides a way to
 * {@link shared.EditIriOverlayComponent edit the instance IRI} after acknowledging the danger. If there are required
 * properties not set on the instance, the provided `isValid` variable is set to false.
 *
 * @param {string} header The configurable header for the form
 * @param {boolean} isValid Whether all the required properties for the instance are set
 * @param {Function} changeEvent A function to be called when the value of isValid changes. Expects an argument
 * called `value` and should update the value of `isValid`.
 */
@Component({
    selector: 'instance-form',
    templateUrl: './instanceForm.component.html'
})
export class InstanceFormComponent implements OnInit {
    @Input() header;
    @Input() isValid;
    @Output() changeEvent = new EventEmitter<any>();
    isInstancePropertyDisabled : boolean;

    constructor(private es: ExploreService, public eu: ExploreUtilsService, private ds: DiscoverStateService,
                private dialog: MatDialog, private util: UtilService, private splitIRI: SplitIRIPipe) {
    }

    properties: PropertyDetails[] = [{
        propertyIRI: DCTERMS + 'description',
        type: 'Data',
        range: [],
        restrictions: [{
            cardinality: 0,
            cardinalityType: ''
        }]
    }, {
        propertyIRI: DCTERMS + 'title',
        type: 'Data',
        range: [],
        restrictions: [{
            cardinality: 0,
            cardinalityType: ''
        }]
    }, {
        propertyIRI: RDFS + 'comment',
        type: 'Data',
        range: [],
        restrictions: [{
            cardinality: 0,
            cardinalityType: ''
        }]
    }, {
        propertyIRI: RDFS + 'label',
        type: 'Data',
        range: [],
        restrictions: [{
            cardinality: 0,
            cardinalityType: ''
        }]
    }];
    searchText = {};
    showOverlay = false;
    showPropertyValueOverlay = false;
    changed = [];
    missingProperties: string[] = [];
    instance: JSONLDObject = {'@id': ''};
    options = [];

    ngOnInit(): void {
        this.instance = this.ds.getInstance();
        this.getProperties();
        this.getOptions(this.instance['@id']);
        const newProperties = this.eu.getNewProperties(this.properties, this.instance, '');
        this.isInstancePropertyDisabled = newProperties ? !newProperties.length : false ;
    }
    newInstanceProperty(): void {
        this.dialog.open(NewInstancePropertyOverlayComponent, {
            data: {
                properties: this.properties,
                instance: this.instance
            }
        }).afterClosed().subscribe((result: {propertyIRI: string, range: [], restrictions: [], type: string}) => {
            if (result) {
                this.addToChanged(result.propertyIRI);
            }
        });
    }
    showIriConfirm(): void {
        this.dialog.open(ConfirmModalComponent, {
            data: {
                content: '<p>Changing this IRI might break relationships within the dataset. Are you sure you want to continue?</p>'
            }
        }).afterClosed().subscribe((result: boolean) => {
            if (result) {
                this.showIriOverlay();
            }
        });
    }
    showIriOverlay(): void {
        const split: SplitIRI = this.splitIRI.transform(this.instance['@id']);
        this.dialog.open(EditIriOverlayComponent, {
            data: { iriBegin: split.begin, iriThen: split.then, iriEnd: split.end }
        }).afterClosed().subscribe((result) => {
            if (result) {
                this.setIRI(result);
            }
        });
    }
    getOptions(propertyIRI: string): void {
        const range = this.eu.getRange(propertyIRI, this.properties);
        if (range) {
            this.es.getClassInstanceDetails(this.ds.explore.recordId, range, {offset: 0, infer: true}, true)
                .subscribe(response => {
                    const options = filter(response.body, item => !some(this.instance[propertyIRI], {'@id': item.instanceIRI}));
                    if (this.searchText[propertyIRI]) {
                        this.options = filter(options, item => this.eu.contains(item.title, this.searchText[propertyIRI]) || this.eu.contains(item.instanceIRI, this.searchText[propertyIRI]));
                    }
                    this.options = options;
                }, errorMessage => {
                    this.util.createErrorToast(errorMessage);
                    this.options = [];
                });
        }
        this.options = [];
    }
    addToChanged(propertyIRI: string): void {
        this.changed = uniq(concat(this.changed, [propertyIRI]));
        this.missingProperties = this.getMissingProperties();
    }
    isChanged(propertyIRI: string): boolean {
        return includes(this.changed, propertyIRI);
    }
    setIRI(iriObj): void {
        this.instance['@id'] = iriObj.value.iriBegin + iriObj.value.iriThen + iriObj.value.iriEnd;
    }
    getMissingProperties(): string[] {
        const missing = [];
        forEach(this.properties, property => {
            forEach(get(property, 'restrictions', []), restriction => {
                const length = get(this.instance, property.propertyIRI, []).length;
                if (restriction.cardinalityType === OWL + 'cardinality' && length !== restriction.cardinality) {
                    missing.push('Must have exactly ' + restriction.cardinality + ' value(s) for ' + this.util.getBeautifulIRI(property.propertyIRI));
                } else if (restriction.cardinalityType === OWL + 'minCardinality' && length < restriction.cardinality) {
                    missing.push('Must have at least ' + restriction.cardinality + ' value(s) for ' + this.util.getBeautifulIRI(property.propertyIRI));
                } else if (restriction.cardinalityType === OWL + 'maxCardinality' && length > restriction.cardinality) {
                    missing.push('Must have at most ' + restriction.cardinality + ' value(s) for ' + this.util.getBeautifulIRI(property.propertyIRI));
                }
            });
        });
        this.isValid = !missing.length;
        this.changeEvent.emit({value: this.isValid});
        return missing;
    }
    getRestrictionText(propertyIRI: string): string {
        const details: PropertyDetails = find(this.properties, {propertyIRI});
        const results = [];
        forEach(get(details, 'restrictions', []), restriction => {
            if (restriction.cardinalityType === OWL + 'cardinality') {
                results.push('exactly ' + restriction.cardinality);
            } else if (restriction.cardinalityType === OWL + 'minCardinality') {
                results.push('at least ' + restriction.cardinality);
            } else if (restriction.cardinalityType === OWL + 'maxCardinality') {
                results.push('at most ' + restriction.cardinality);
            }
        });
        return results.length ? ('[' + join(results, ', ') + ']') : '';
    }
    private getProperties() {
        forkJoin(map(this.instance['@type'], type => this.es.getClassPropertyDetails(this.ds.explore.recordId, type)))
            .subscribe(responses => {
                this.properties = concat(this.properties, uniq(flatten(responses)));
                this.missingProperties = this.getMissingProperties();
            }, () => this.util.createErrorToast('An error occurred retrieving the instance properties.'));
    }

    private addDataProperty(event: MatChipInputEvent, propertyIRI: string) {
        if (event.value) {
            this.instance[propertyIRI].push(this.eu.createValueObj(event.value, propertyIRI, this.properties));
            event.input.value = '';
        }
    }
    private addObjectProperty(item, propertyIRI: string) {
        this.ds.explore.instance.objectMap[item.instanceIRI] = item.title;
        this.instance[propertyIRI].push(this.eu.createIdObj(item.instanceIRI));
    }
    private removeDataProperty(item, propertyIRI: string) {
        remove(this.instance[propertyIRI], item);
    }
    private removeObjectProperty(item, propertyIRI: string) {
        remove(this.instance[propertyIRI], item);

        if (!includes(this.instance, item['@id'])) {
            delete this.ds.explore.instance.objectMap[item.instanceIRI]
        }
    }
    private handleCheckBoxClick(checked: boolean, propertyIRI: string) {
        if (checked) {
             this.instance[propertyIRI][0] = (this.eu.createValueObj('true', propertyIRI, this.properties));
        } else {
             this.instance[propertyIRI][0] = (this.eu.createValueObj('false', propertyIRI, this.properties));
        }
    }
    private checkValue(value: string) {
       return value === 'true' ? true : false;
    }
}

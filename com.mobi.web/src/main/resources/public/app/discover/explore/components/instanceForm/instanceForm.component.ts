/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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
import { filter, some, forEach, concat, includes, uniq, map, join, get, flatten, remove } from 'lodash';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { forkJoin } from 'rxjs';

import { NewInstancePropertyOverlayComponent } from '../newInstancePropertyOverlay/newInstancePropertyOverlay.component';
import { EditIriOverlayComponent } from '../../../../shared/components/editIriOverlay/editIriOverlay.component';
import { DiscoverStateService } from '../../../../shared/services/discoverState.service';
import { ExploreService } from '../../../services/explore.service';
import { ExploreUtilsService } from '../../services/exploreUtils.service';
import { DCTERMS, OWL, RDFS } from '../../../../prefixes';
import { ConfirmModalComponent } from '../../../../shared/components/confirmModal/confirmModal.component';
import { JSONLDObject } from '../../../../shared/models/JSONLDObject.interface';
import { splitIRI } from '../../../../shared/pipes/splitIRI.pipe';
import { SplitIRI } from '../../../../shared/models/splitIRI.interface';
import { PropertyDetails } from '../../../models/propertyDetails.interface';
import { ToastService } from '../../../../shared/services/toast.service';
import { OnEditEventI } from '../../../../shared/models/onEditEvent.interface';
import { getBeautifulIRI } from '../../../../shared/utility';
import { FormBuilder, ValidatorFn, Validators } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';

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
    templateUrl: './instanceForm.component.html',
    styleUrls: ['./instanceForm.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class InstanceFormComponent implements OnInit {
    @Input() header;
    @Input() isValid;
    @Output() changeEvent = new EventEmitter<{value: boolean}>();
    isInstancePropertyDisabled: boolean;
    form = this._fb.group({});

    constructor(private es: ExploreService, public eu: ExploreUtilsService, private ds: DiscoverStateService,
                private dialog: MatDialog, private toast: ToastService, private _fb: FormBuilder) {
    }

    propertyDetailsMap: {[key: string]: PropertyDetails} = {
        [`${DCTERMS}description`]: {
            propertyIRI: `${DCTERMS}description`,
            display: 'Description',
            type: 'Data',
            range: [],
            restrictions: [{
                cardinality: 0,
                cardinalityType: ''
            }]
        },
        [`${DCTERMS}title`]: {
            propertyIRI: `${DCTERMS}title`,
            display: 'Title',
            type: 'Data',
            range: [],
            restrictions: [{
                cardinality: 0,
                cardinalityType: ''
            }]
        },
        [`${RDFS}comment`]: {
            propertyIRI: `${RDFS}comment`,
            display: 'Comment',
            type: 'Data',
            range: [],
            restrictions: [{
                cardinality: 0,
                cardinalityType: ''
            }]
        },
        [`${RDFS}label`]: {
            propertyIRI: `${RDFS}label`,
            display: 'Label',
            type: 'Data',
            range: [],
            restrictions: [{
                cardinality: 0,
                cardinalityType: ''
            }]
        }
    };
    searchText = {};
    showOverlay = false;
    showPropertyValueOverlay = false;
    changed = [];
    missingProperties: string[] = [];
    properties: PropertyDetails[] = [];
    instance: JSONLDObject = {'@id': ''};
    options = [];

    ngOnInit(): void {
        this.instance = this.ds.getInstance();
        this.getProperties();
        this.getOptions(this.instance['@id']);
        const newProperties = this.eu.getNewProperties(Object.values(this.propertyDetailsMap), this.instance, '');
        this.isInstancePropertyDisabled = newProperties ? !newProperties.length : false ;
    }
    updateForm(): void {
        this.form = this._fb.group({});
        Object.keys(this.instance).forEach(key => {
            if (key !== '@id' && key !== '@type') {
                if (this.eu.isBoolean(key, this.properties) && !this.instance[key].length) {
                    this.instance[key][0] = (this.eu.createValueObj('false', key, Object.values(this.propertyDetailsMap)));
                    this.form.addControl(key, this._fb.control(this.instance[key][0]));
                } else {
                    this.form.addControl(key, this._fb.control('', [this.getValidator(key)]));
                }
            }
        });
    }
    getValidator(instanceProperty: string): ValidatorFn {
        if (this.eu.isPropertyOfType(instanceProperty, 'Data', this.properties) && !this.eu.isBoolean(instanceProperty, this.properties)) {
            return Validators.pattern(this.eu.getPattern(instanceProperty, this.properties));
        } else {
            return Validators.required;
        }
    }
    addChip(event: MatChipInputEvent, property: string): void {
        if (this.form.get([property]).valid) {
            this.addDataProperty(event, property); 
            this.addToChanged(property);
            this.form.get([property]).reset();
        } else {
            this.form.get([property]).markAsTouched();
        }
    }
    getPropertyDisplay(propertyIRI: string): string {
        const details = this.propertyDetailsMap[propertyIRI];
        return details ? details.display : getBeautifulIRI(propertyIRI);
    }
    newInstanceProperty(): void {
        this.dialog.open(NewInstancePropertyOverlayComponent, {
            data: {
                properties: Object.values(this.propertyDetailsMap),
                instance: this.instance
            }
        }).afterClosed().subscribe((result: {propertyIRI: string, range: [], restrictions: [], type: string}) => {
            if (result) {
                this.addToChanged(result.propertyIRI);
                this.updateForm();
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
        const split: SplitIRI = splitIRI(this.instance['@id']);
        this.dialog.open(EditIriOverlayComponent, {
            data: { iriBegin: split.begin, iriThen: split.then, iriEnd: split.end }
        }).afterClosed().subscribe((result) => {
            if (result) {
                this.setIRI(result);
            }
        });
    }
    getOptions(propertyIRI: string): void {
        const range = this.eu.getRange(propertyIRI, Object.values(this.propertyDetailsMap));
        if (range) {
            this.es.getClassInstanceDetails(this.ds.explore.recordId, range, {offset: 0, infer: true}, true)
                .subscribe(response => {
                    const options = filter(response.body, item => !some(this.instance[propertyIRI], {'@id': item.instanceIRI}));
                    if (this.searchText[propertyIRI]) {
                        this.options = filter(options, item => this.eu.contains(item.title, this.searchText[propertyIRI]) || this.eu.contains(item.instanceIRI, this.searchText[propertyIRI]));
                    }
                    this.options = options;
                }, errorMessage => {
                    this.toast.createErrorToast(errorMessage);
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
    setIRI(iriObj: OnEditEventI): void {
        this.instance['@id'] = iriObj.value.iriBegin + iriObj.value.iriThen + iriObj.value.iriEnd;
    }
    getMissingProperties(): string[] {
        const missing = [];
        forEach(Object.values(this.propertyDetailsMap), property => {
            forEach(get(property, 'restrictions', []), restriction => {
                const length = get(this.instance, property.propertyIRI, []).length;
                if (restriction.cardinalityType === `${OWL}cardinality` && length !== restriction.cardinality) {
                    missing.push(`Must have exactly ${restriction.cardinality} value(s) for ${getBeautifulIRI(property.propertyIRI)}`);
                } else if (restriction.cardinalityType === `${OWL}minCardinality` && length < restriction.cardinality) {
                    missing.push(`Must have at least ${restriction.cardinality} value(s) for ${getBeautifulIRI(property.propertyIRI)}`);
                } else if (restriction.cardinalityType === `${OWL}maxCardinality` && length > restriction.cardinality) {
                    missing.push(`Must have at most ${restriction.cardinality} value(s) for ${getBeautifulIRI(property.propertyIRI)}`);
                }
            });
        });
        this.isValid = !missing.length;
        this.changeEvent.emit({value: this.isValid});
        return missing;
    }
    getRestrictionText(propertyIRI: string): string {
        const details: PropertyDetails = this.propertyDetailsMap[propertyIRI];
        const results = [];
        forEach(get(details, 'restrictions', []), restriction => {
            if (restriction.cardinalityType === `${OWL}cardinality`) {
                results.push(`exactly ${restriction.cardinality}`);
            } else if (restriction.cardinalityType === `${OWL}minCardinality`) {
                results.push(`at least ${restriction.cardinality}`);
            } else if (restriction.cardinalityType === `${OWL}maxCardinality`) {
                results.push(`at most ${restriction.cardinality}`);
            }
        });
        return results.length ? (`[${join(results, ', ')}]`) : '';
    }
    private getProperties() {
        forkJoin(map(this.instance['@type'], type => this.es.getClassPropertyDetails(this.ds.explore.recordId, type)))
            .subscribe(responses => {
                uniq(flatten(responses)).forEach(details => {
                    this.propertyDetailsMap[details.propertyIRI] = details;
                });
                this.missingProperties = this.getMissingProperties();
                this.properties = Object.values(this.propertyDetailsMap);
                this.updateForm();
            }, () => this.toast.createErrorToast('An error occurred retrieving the instance properties.'));
    }

    private addDataProperty(event: MatChipInputEvent, propertyIRI: string) {
        if (event.value) {
            this.instance[propertyIRI].push(this.eu.createValueObj(event.value, propertyIRI, Object.values(this.propertyDetailsMap)));
        }
    }
    private addObjectProperty(item, propertyIRI: string) {
        this.ds.explore.instance.objectMap[item.instanceIRI] = item.title;
        this.instance[propertyIRI].push(this.eu.createIdObj(item.instanceIRI));
    }
    private removeDataProperty(item, propertyIRI: string) {
        remove(this.instance[propertyIRI], item);
    }
    private removeBooleanProperty(item, propertyIRI: string) {
        delete this.instance[propertyIRI];
    }
    private removeObjectProperty(item, propertyIRI: string) {
        remove(this.instance[propertyIRI], item);

        if (!includes(this.instance, item['@id'])) {
            delete this.ds.explore.instance.objectMap[item.instanceIRI];
        }
    }
    private handleCheckBoxClick(checked: boolean, propertyIRI: string) {
        if (checked) {
             this.instance[propertyIRI][0] = (this.eu.createValueObj('true', propertyIRI, Object.values(this.propertyDetailsMap)));
        } else {
             this.instance[propertyIRI][0] = (this.eu.createValueObj('false', propertyIRI, Object.values(this.propertyDetailsMap)));
        }
    }
    private checkValue(value: string) {
        if (value.length > 0) {
            return value[0]['@value'];
        } else {
            return false;
        }
    }
}

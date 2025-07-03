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
import { Component, Input, OnChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { union, sortBy, has, get } from 'lodash';
import { RDF } from '../../../prefixes';

import { ConfirmModalComponent } from '../confirmModal/confirmModal.component';
import { JSONLDObject } from '../../models/JSONLDObject.interface';
import { PropertyManagerService } from '../../services/propertyManager.service';
import { PropertyOverlayComponent } from '../propertyOverlay/propertyOverlay.component';
import { VersionedRdfState } from '../../services/versionedRdfState.service';
import { VersionedRdfListItem } from '../../models/versionedRdfListItem.class';

/**
 * @class shared.PropertiesBlockComponent
 *
 * A component that creates a section that displays the properties on the provided VersionedRDFRecord
 * using {@link shared.PropertyValuesComponent}. The section header contains a button for adding a property.
 * The component houses the methods for opening the modal for
 * {@link shared.PropertyOverlayComponent editing, adding}, and removing owl:Ontology properties.
 * 
 * @param {JSONLDObject} ontology A JSON-LD object representing an ontology 
 */
@Component({
  selector: 'properties-block',
  templateUrl: './propertiesBlock.component.html'
})
export class PropertiesBlockComponent implements OnChanges {
  @Input() stateService: VersionedRdfState<VersionedRdfListItem>;
  @Input() ontology: JSONLDObject; // TODO since this was moved to shared, ontology should be called entity
  @Input() canModify: boolean;
  @Input() annotationIRIs: string[];

  properties = [];
  propertiesFiltered = [];

  constructor(
    private dialog: MatDialog,
    private pm: PropertyManagerService
  ) { }

  ngOnChanges(): void {
    this.updatePropertiesFiltered();
  }
  updatePropertiesFiltered(): void {
    this.properties = union(this.pm.ontologyProperties, this.pm.defaultAnnotations, this.pm.owlAnnotations, this.annotationIRIs);
    this.propertiesFiltered = sortBy(this.properties.filter(prop => has(this.ontology, prop)), iri => this.stateService.getEntityName(iri));
  }
  openAddOverlay(): void {
    this.dialog.open(PropertyOverlayComponent, {
      data: {
        stateService: this.stateService,
        entity: this.ontology,
        annotationIRIs: this.annotationIRIs,
        editing: false
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.updatePropertiesFiltered();
      }
    });
  }
  openRemoveOverlay(input: { iri: string, index: number }): void {
    this.dialog.open(ConfirmModalComponent, {
      data: { content: this.stateService.getRemovePropOverlayMessage(input.iri, input.index) }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.stateService.removeProperty(input.iri, input.index).subscribe();
        this.updatePropertiesFiltered();
      }
    });
  }
  editClicked(input: { property: string, index: number }): void {
    const propertyObj = this.ontology[input.property][input.index];
    const propertyType = get(propertyObj, '@type');
    const propertyLanguage = get(propertyObj, '@language');
    this.dialog.open(PropertyOverlayComponent, {
      data: {
        stateService: this.stateService,
        entity: this.ontology,
        annotationIRIs: this.annotationIRIs,
        editing: true,
        property: input.property,
        value: propertyObj['@value'] || propertyObj['@id'],
        type: propertyType ? propertyType : (propertyLanguage ? `${RDF}langString` : ''),
        index: input.index,
        language: propertyLanguage,
        isIRIProperty: !propertyObj['@value'] && propertyObj['@id'] ? true : false
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.updatePropertiesFiltered();
      }
    });
  }
}

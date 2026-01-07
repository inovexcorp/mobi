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
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { DELIM } from '../../../prefixes';
import { getEntityName } from '../../../shared/utility';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { Mapping } from '../../../shared/models/mapping.class';

@Component({
  selector: 'app-mapping-warning-modal',
  templateUrl: './incompatible-warning-modal.component.html'
})
export class IncompatibleWarningModalComponent {
  idIRI = `${DELIM}mapsTo`;
  propIRI = `${DELIM}hasProperty`;
  propertyIRI = `${DELIM}dataProperty`;
  infoMessage = 'The source ontology for the mapping and/or its imported ontologies have been changed' +
      ' and are no longer compatible. Incompatible mappings will be removed upon continuing.';

  constructor(private dialog: MatDialogRef<IncompatibleWarningModalComponent>,
              @Inject(MAT_DIALOG_DATA) public data: { 'mappingRecord': JSONLDObject[], 'incompatibleMappings': Mapping[]}) {}

  confirm(): void {
    this.dialog.close('edit');
  }

  cancel(): void {
    this.dialog.close('closed');
  }

  /**
   * Retrieves the name associated with the provided mapping.
   *
   * @param {Mapping} mapping - The {@link Mapping} object from which the title is derived.
   * @return {string} The name extracted from the mapping entity.
   */
  getName(mapping: Mapping): string {
    return getEntityName(mapping.getJsonld()[0]);
  }

  /**
   * Retrieves the IRI value from a given Mapping object based on the specified IRI key.
   *
   * @param {Mapping} mapping - The {@link Mapping} object containing the JSON-LD data.
   * @param {string} iri - The key to look up in the Mapping object to retrieve the associated IRI value.
   * @return {string} The IRI value associated with the specified key from the Mapping object.
   */
  getMappingIRI(mapping: Mapping, iri: string): string {
    return mapping.getJsonld()[0][iri][0]['@id'];
  }
}

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
import { has, map, sortBy } from 'lodash';
import { first } from 'rxjs/operators';
import { Component, Inject, OnChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { RDFS } from '../../../prefixes';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { JSONLDId } from '../../../shared/models/JSONLDId.interface';

/**
 * @class ontology-editor.DatatypePropertyAxiomsComponent
 *
 * A component that creates a list of {@link ontology-editor.PropertyValuesComponent} of the axioms on the
 * {@link shared.OntologyStateService#listItem selected data property}. The component houses the methods for opening the
 * modal for removing property axioms. 
 */

@Component({
    selector: 'datatype-property-axioms',
    templateUrl: './datatypePropertyAxioms.component.html'
})
export class DatatypePropertyAxiomsComponent implements OnChanges {
    key = '';
    axioms = [];

    constructor(private om: OntologyManagerService, private os: OntologyStateService, private dialog: MatDialog,
                @Inject('propertyManagerService') private pm) {}

    ngOnChanges(): void {
        const axioms = map(this.pm.datatypeAxiomList, 'iri');
        this.axioms = sortBy(axioms.filter(prop => has(this.os.listItem.selected, prop)), iri => this.os.getEntityNameByListItem(iri));
    }
    openRemoveOverlay(event: {iri: string, index: number}): void {
        this.key = event.iri;
        this.dialog.open(ConfirmModalComponent, {
            data: { content: this.os.getRemovePropOverlayMessage(event.iri, event.index) }
        }).afterClosed().subscribe(result => {
            if (result) {
                this.os.removeProperty(event.iri, event.index)
                    .pipe(first())
                    .subscribe((res) => {
                        this.removeFromHierarchy(res as JSONLDId);
                    });
            }
        });
    }
    removeFromHierarchy(axiomObject: JSONLDId): void {
        if (RDFS + 'subPropertyOf' === this.key && !this.om.isBlankNodeId(axiomObject['@id'])) {
            this.os.deleteEntityFromParentInHierarchy(this.os.listItem.dataProperties, this.os.listItem.selected['@id'], axiomObject['@id']);
            this.os.listItem.dataProperties.flat = this.os.flattenHierarchy(this.os.listItem.dataProperties);
        }
    }
}


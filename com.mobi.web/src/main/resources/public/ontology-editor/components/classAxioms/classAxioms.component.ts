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
import { Component, OnChanges, Input} from '@angular/core';
import { has, map, sortBy } from 'lodash';
import { first } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';

import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { RDFS } from '../../../prefixes';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { PropertyManagerService } from '../../../shared/services/propertyManager.service';
import { JSONLDId } from '../../../shared/models/JSONLDId.interface';

/**
 * @class ontology-editor.ClassAxiomsComponent
 *
 * A component that creates a list of {@link ontology-editor.PropertyValuesComponent} of the axioms on the
 * {@link shared.OntologyStateService#listItem selected class}. The component houses the methods for opening the modal
 * for removing class axioms.
 */

@Component({
    selector: 'class-axioms',
    templateUrl: './classAxioms.component.html'
})
export class ClassAxiomsComponent implements OnChanges {
    @Input() selected: JSONLDObject; // Here to trigger on changes
    
    axioms: string[] = []

    constructor(private om: OntologyManagerService, private os: OntologyStateService, private dialog: MatDialog,
                private pm: PropertyManagerService) {}

    ngOnChanges(): void {
        this.updateAxioms();
    }
    updateAxioms(): void {
        const axioms =  map(this.pm.classAxiomList, 'iri');
        this.axioms = sortBy(axioms.filter(prop => has(this.os.listItem.selected, prop)), iri => this.os.getEntityNameByListItem(iri));
    }
    openRemoveOverlay(event: {iri: string, index: number}): void {
        this.dialog.open(ConfirmModalComponent, {
            data: { content: this.os.getRemovePropOverlayMessage(event.iri, event.index) }
        }).afterClosed().subscribe(result => {
            if (result) {
                this.os.removeProperty(event.iri, event.index)
                    .pipe(first())
                    .subscribe( (res) => {
                        this.updateAxioms();
                        this.removeFromHierarchy(event.iri, res as JSONLDId);
                    });
            }
        });
    }
    removeFromHierarchy(axiom: string, axiomObject: JSONLDId): void {
        if (RDFS + 'subClassOf' === axiom && !this.om.isBlankNodeId(axiomObject['@id'])) {
            this.os.deleteEntityFromParentInHierarchy(this.os.listItem.classes, this.os.listItem.selected['@id'], axiomObject['@id']);
            this.os.listItem.classes.flat = this.os.flattenHierarchy(this.os.listItem.classes);
            this.os.listItem.individualsParentPath = this.os.getIndividualsParentPath(this.os.listItem);
            this.os.listItem.individuals.flat = this.os.createFlatIndividualTree(this.os.listItem);
            this.os.setVocabularyStuff();
        }
    }
}

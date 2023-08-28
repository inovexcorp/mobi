/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { DelimitedManagerService } from '../../../shared/services/delimitedManager.service';
import { MapperStateService } from '../../../shared/services/mapperState.service';
import { ClassMappingOverlayComponent } from '../classMappingOverlay/classMappingOverlay.component';
import { MappingConfigOverlayComponent } from '../mappingConfigOverlay/mappingConfigOverlay.component';
import { RunMappingDatasetOverlayComponent } from '../runMappingDatasetOverlay/runMappingDatasetOverlay.component';
import { RunMappingDownloadOverlayComponent } from '../runMappingDownloadOverlay/runMappingDownloadOverlay.component';
import { RunMappingOntologyOverlayComponent } from '../runMappingOntologyOverlay/runMappingOntologyOverlay.component';
import { getDctermsValue } from '../../../shared/utility';

/**
 * @class mapper.EditMappingTabComponent
 *
 * A component that creates a Bootstrap `row` with two columns to view and edit the current
 * {@link shared.MapperStateService#selected mapping}. The left column has a form to set the mapping ontology, a section
 * to {@link mapper.ClassMappingSelectComponent select a class mapping} and delete the selected class mapping, a button
 * to {@link mapper.ClassMappingOverlayComponent add a new class mapping}, and
 * {@link mapper.ClassMappingDetailsComponent class mapping details}. The right column contains a
 * {@link mapper.PreviewDataGridComponent} of the loaded delimited data.
 */
@Component({
    selector: 'edit-mapping-tab',
    templateUrl: './editMappingTab.component.html',
    styleUrls: ['./editMappingTab.component.scss']
})
export class EditMappingTabComponent implements OnInit, OnDestroy {
    errorMessage = '';
    classMappings = [];
    ontologyTitle = '';

    constructor(private dialog: MatDialog, public state: MapperStateService, public dm: DelimitedManagerService) {}
        
    ngOnInit(): void {
        this.setOntologyTitle();
        this.setClassMappings();
        if (this.state.startWithConfigModal) {
          this.openMappingConfig();
        }
    }
    ngOnDestroy(): void {
        this.state.selectedPropMappingId = '';
        this.state.highlightIndexes = [];
    }
    openClassMappingOverlay(): void {
        this.dialog.open(ClassMappingOverlayComponent).afterClosed()
            .subscribe((newClassMapping: JSONLDObject) => {
                if (newClassMapping) {
                    this.setClassMappings();
                    this.state.selectedClassMappingId = newClassMapping['@id'];
                }
            });
    }
    openMappingConfig(): void {
        this.dialog.open(MappingConfigOverlayComponent).afterClosed().subscribe(() => {
            this.setOntologyTitle();
            this.setClassMappings();
            this.state.startWithConfigModal = false;
        });
    }
    deleteClass(classMapping: JSONLDObject): void {
        this.state.deleteClass(classMapping['@id']);
        if (classMapping['@id']  === this.state.selectedClassMappingId) {
            this.state.resetEdit();
            this.state.selectedClassMappingId = '';
        }
        this.setClassMappings();
    }
    setOntologyTitle(): void {
      this.ontologyTitle = getDctermsValue(this.state.selected.ontology, 'title') || '(None Specified)';
    }
    setClassMappings(): void {
        this.classMappings = this.state.selected.mapping.getAllClassMappings();
    }
    openRunMappingDownload(): void {
        this.dialog.open(RunMappingDownloadOverlayComponent);
    }
    openRunMappingDataset(): void {
        this.dialog.open(RunMappingDatasetOverlayComponent);
    }
    openRunMappingOntology(): void {
        this.dialog.open(RunMappingOntologyOverlayComponent);
    }
    isSaveable(): boolean {
        return this.state.invalidProps.length === 0 && !!this.classMappings.length;
    }
    save(): void {
        if (this.state.isMappingChanged()) {
            this.state.saveMapping().subscribe(() => this._success(), error => this._onError(error));
        } else {
            this._success();
        }
    }
    cancel(): void {
        if (this.state.isMappingChanged()) {
            this.dialog.open(ConfirmModalComponent, {
                data: {
                    content: '<p>Are you sure you want to cancel? Any current progress will be lost.</p>'
                }
            }).afterClosed().subscribe((result: boolean) => {
                if (result) {
                    this._success();
                }
            });
        } else {
            this._success();
        }
    }

    private _onError(errorMessage) {
        this.errorMessage = errorMessage;
    }
    private _success() {
        this.errorMessage = '';
        this.state.step = this.state.selectMappingStep;
        this.state.initialize();
        this.state.resetEdit();
        this.dm.reset();
    }
}

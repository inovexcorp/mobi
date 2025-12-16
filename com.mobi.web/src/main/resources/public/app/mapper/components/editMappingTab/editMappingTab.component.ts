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
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { find } from 'lodash';

import { ClassMappingOverlayComponent } from '../classMappingOverlay/classMappingOverlay.component';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { DelimitedManagerService } from '../../../shared/services/delimitedManager.service';
import { getEntityName } from '../../../shared/utility';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { MapperStateService } from '../../../shared/services/mapperState.service';
import { MappingConfigOverlayComponent } from '../mappingConfigOverlay/mappingConfigOverlay.component';
import { MappingManagerService } from '../../../shared/services/mappingManager.service';
import { RunMappingDatasetOverlayComponent } from '../runMappingDatasetOverlay/runMappingDatasetOverlay.component';
import { RunMappingDownloadOverlayComponent } from '../runMappingDownloadOverlay/runMappingDownloadOverlay.component';
import { RunMappingOntologyOverlayComponent } from '../runMappingOntologyOverlay/runMappingOntologyOverlay.component';
import { ToastService } from '../../../shared/services/toast.service';

/**
 * @class EditMappingTabComponent
 *
 * A component that creates a Bootstrap `row` with two columns to view and edit the current
 * {@link MapperStateService#selected} mapping. The left column has a form to set the mapping ontology, a section
 * to {@link ClassMappingSelectComponent} select a class mapping and delete the selected class mapping, a button
 * to {@link ClassMappingOverlayComponent} add a new class mapping, and
 * {@link ClassMappingDetailsComponent} class mapping details. The right column contains a
 * {@link PreviewDataGridComponent} of the loaded delimited data.
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

  constructor(private dialog: MatDialog, public state: MapperStateService, public dm: DelimitedManagerService,
              private mm: MappingManagerService, private toast: ToastService) {
  }

  ngOnInit(): void {
    this.setOntologyTitle();
    this.checkIncompatibleMappings();
    if (this.state.startWithConfigModal) {
      this.openMappingConfig();
    }
  }

  ngOnDestroy(): void {
    this.state.selectedPropMappingId = '';
    this.state.highlightIndexes = [];
  }

  /**
   * Opens the Class Mapping Overlay dialog. Once the dialog is closed, it checks the returned data
   * to update class mappings and set the selected class mapping ID if a new class mapping is provided.
   *
   */
  openClassMappingOverlay(): void {
    this.dialog.open(ClassMappingOverlayComponent).afterClosed()
      .subscribe((newClassMapping: JSONLDObject) => {
        if (newClassMapping) {
          this.setClassMappings();
          this.state.selectedClassMappingId = newClassMapping['@id'];
        }
      });
  }

  /**
   * Opens the Mapping Configuration dialog and performs the necessary operations after the dialog is closed.
   * The method opens the {@link MappingConfigOverlayComponent} dialog, updates the ontology title,
   * sets class mappings, and modifies the state to indicate that the configuration modal
   * should not reopen automatically.
   *
   */
  openMappingConfig(): void {
    this.dialog.open(MappingConfigOverlayComponent).afterClosed().subscribe(() => {
      this.setOntologyTitle();
      this.setClassMappings();
      this.state.startWithConfigModal = false;
    });
  }

  /**
   * Deletes a class mapping based on the provided JSON-LD object and updates the state accordingly.
   *
   * @param {JSONLDObject} classMapping - The JSON-LD object representing the class mapping to delete.
   */
  deleteClass(classMapping: JSONLDObject): void {
    this.state.deleteClass(classMapping['@id']);
    if (classMapping['@id'] === this.state.selectedClassMappingId) {
      this.state.resetEdit();
      this.state.selectedClassMappingId = '';
    }
    this.setClassMappings();
  }

  /**
   * Updates the ontology title based on the currently selected ontology in the state.
   * If the ontology has a title specified, it sets the ontology title to that value.
   * If no ontology is selected or no title is specified, it defaults to '(None Specified)'.
   */
  setOntologyTitle(): void {
    if (this.state.selected?.ontology) {
      this.ontologyTitle = getEntityName(this.state.selected.ontology) || '(None Specified)';
    } else {
      this.ontologyTitle = '(None Specified)';
    }
  }

  setClassMappings(): void {
    if (this.state.selected?.mapping) {
      this.classMappings = this.state.selected.mapping.getAllClassMappings();
    } else {
      this.classMappings = [];
    }
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

  /**
   * Saves the current state if there are changes in the mapping. If changes exist, it triggers the save operation
   * and handles success or error responses. If no changes are detected, it directly executes the success logic.
   */
  save(): void {
    if (this.state.isMappingChanged()) {
      this.state.saveMapping().subscribe(() => this._success(), error => this._onError(error));
    } else {
      this._success();
    }
  }

  /**
   * Cancels the current operation. If there are unsaved changes,
   * it prompts the user with a confirmation modal to confirm cancellation.
   * Executes the success callback upon confirmation or if there are no changes.
   */
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

  /**
   * Checks for incompatible mappings in the current state and removes them if necessary.
   * This method evaluates both property mappings and class mappings for incompatibility
   * and removes them while notifying the user via warning messages.
   */
  checkIncompatibleMappings(): void {
    this.state.findIncompatibleMappings(this.state.selected.mapping).subscribe(incompatibleMappings => {
      const jsonld = this.state.selected.mapping.getJsonld();
      incompatibleMappings.forEach(entity => {
        if (find(jsonld, {'@id': entity['@id']})) {
          const title = getEntityName(entity);
          if (this.mm.isPropertyMapping(entity)) {
            const parentClassMapping = this.mm.isDataMapping(entity) ?
              this.state.selected.mapping.findClassWithDataMapping(entity['@id']) :
              this.state.selected.mapping.findClassWithObjectMapping(entity['@id']);
            if (parentClassMapping) {
              this.toast.createWarningToast(`Removing incompatible Property Mapping ${title}`,
                {timeOut: 8000});
              this.state.deleteProp(entity['@id'], parentClassMapping['@id']);
            }
          } else if (this.mm.isClassMapping(entity)) {
            this.toast.createWarningToast(`Removing incompatible Class Mapping ${title}`,
              {timeOut: 8000});
            this.state.deleteClass(entity['@id']);
          }
        }
      });
    });
    this.state.resetEdit();
    this.state.setIriMap().subscribe(
      () => {
        this.setClassMappings();
      }
    );
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

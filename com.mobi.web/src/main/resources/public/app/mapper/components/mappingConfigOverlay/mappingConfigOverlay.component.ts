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
import { HttpResponse } from '@angular/common/http';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatSelectionListChange } from '@angular/material/list';
import { MatDialogRef } from '@angular/material/dialog';
import { get, find, isEqual, has, uniq, map, set } from 'lodash';
import { finalize, switchMap } from 'rxjs/operators';

import { CATALOG, DCTERMS, DELIM, ONTOLOGYEDITOR } from '../../../prefixes';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { Mapping } from '../../../shared/models/mapping.class';
import { MappingClass } from '../../../shared/models/mappingClass.interface';
import { MappingOntology } from '../../../shared/models/mappingOntology.interface';
import { OntologyDocument } from '../../../shared/models/ontologyDocument.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { MapperStateService } from '../../../shared/services/mapperState.service';
import { MappingManagerService } from '../../../shared/services/mappingManager.service';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { getDate, getDctermsValue, getPropertyId } from '../../../shared/utility';

interface SelectedOntology {
    jsonld: JSONLDObject,
    recordId: string,
    ontologyIRI: string,
    title: string,
    description: string,
    modified: string,
    selected: boolean
}

interface StateObject {
    recordId: string,
    branchId?: string,
    latest?: VersionObject,
    saved?: VersionObject
}

interface VersionObject {
    commitId?: string,
    classes?: MappingClass[],
    ontologies?: MappingOntology[]
}

/**
 * @class mapper.MappingConfigOverlayComponent
 *
 * A component that creates content for a modal with functionality to edit the configuration of the current
 * {@link shared.MapperStateService#selected mapping}. The configuration consists of the source ontology record, the
 * ontology record version, and the base type class. If editing a mapping that already has those data points set, a new
 * mapping will be created with the new settings and will remove any invalid entity mappings within the mapping. The
 * list of ontologies is searchable and selectable. Only 100 will be shown at a time. Meant to be used in conjunction
 * with the `MatDialog` service.
 */
@Component({
    selector: 'mapping-config-overlay',
    templateUrl: './mappingConfigOverlay.component.html',
    styleUrls: ['./mappingConfigOverlay.component.scss']
})
export class MappingConfigOverlayComponent implements OnInit {
    catalogId = '';
    errorMessage = '';
    recordsErrorMessage = '';
    ontologyStates: StateObject[] = [];
    recordsConfig = {
        pageIndex: 0,
        sortOption: find(this.cm.sortOptions, {field: `${DCTERMS}title`, asc: true}),
        type: `${ONTOLOGYEDITOR}OntologyRecord`,
        limit: 100,
        searchText: ''
    };
    ontologies: SelectedOntology[] = [];
    selectedOntology: SelectedOntology = undefined;
    selectedVersion = 'latest';
    selectedOntologyState = undefined;
    classes: MappingClass[] = [];

    @ViewChild('ontologyListBox', { static: true }) ontologyListBox: ElementRef;

    constructor(private dialog: MatDialogRef<MappingConfigOverlayComponent>, private spinnerSvc: ProgressSpinnerService,
        public state: MapperStateService, private mm: MappingManagerService, private cm: CatalogManagerService, 
        private om: OntologyManagerService) {}

    ngOnInit(): void {
        this.catalogId = get(this.cm.localCatalog, '@id');
        if (this.state.selected.ontology) {
            const ontologyJsonld: JSONLDObject = Object.assign({}, this.state.selected.ontology);
            this.selectedOntology = {
                jsonld: ontologyJsonld,
                recordId: ontologyJsonld['@id'],
                ontologyIRI: this.getOntologyIRI(ontologyJsonld),
                title: getDctermsValue(ontologyJsonld, 'title'),
                description: getDctermsValue(ontologyJsonld, 'description'),
                modified: getDate(getDctermsValue(ontologyJsonld, 'modified'), 'short'),
                selected: true
            };
            const stateObj: StateObject = {
                recordId: this.selectedOntology.recordId
            };
            const versionObj: VersionObject = {};
            this.cm.getRecordMasterBranch(this.selectedOntology.recordId, this.catalogId).subscribe(branch => {
                stateObj.branchId = branch['@id'];
                versionObj.ontologies = this.state.sourceOntologies;
                this._setClasses(versionObj);
                const latestCommitId = getPropertyId(branch, `${CATALOG}head`);
                const savedCommitId = get(this.state.selected.mapping.getSourceOntologyInfo(), 'commitId');
                if (savedCommitId === latestCommitId) {
                    stateObj.latest = set(versionObj, 'commitId', latestCommitId);
                } else {
                    stateObj.saved = set(versionObj, 'commitId', savedCommitId);
                    this.selectedVersion = 'saved';
                }
                this.ontologyStates.push(stateObj);
                this.selectedOntologyState = stateObj;
            }, () => this._onError());
        }
        this.setOntologies();
    }
    getOntologyIRI(record: JSONLDObject): string {
        return getPropertyId(record, `${ONTOLOGYEDITOR}ontologyIRI`);
    }
    ontologyChange(event: MatSelectionListChange): void {
        this.toggleOntology(event.options[0].value);
    }
    setOntologies(): void {
        this.spinnerSvc.startLoadingForComponent(this.ontologyListBox);
        this.cm.getRecords(this.catalogId, this.recordsConfig, true)
            .pipe(finalize(() => this.spinnerSvc.finishLoadingForComponent(this.ontologyListBox)))
            .subscribe(response => this._parseRecordResults(response), () => this._onRecordsError());
    }
    toggleOntology(ontology: SelectedOntology): void {
        ontology.selected = !ontology.selected;
        if (ontology.selected) {
            this.ontologies.forEach(record => {
                if (record.recordId !== ontology.recordId) {
                    record.selected = false;
                }
            });
            this.selectOntology(ontology);
        } else {
            if (get(this.selectedOntology, 'recordId') === ontology.recordId) {
                this.selectedOntology = undefined;
                this.selectedVersion = 'latest';
                this.selectedOntologyState = undefined;
                this.classes = [];
            }
        }
    }
    selectOntology(ontology: SelectedOntology): void {
        this.selectedOntology = ontology;
        let ontologyState = find(this.ontologyStates, {recordId: this.selectedOntology.recordId});
        if (ontologyState && !isEqual(ontologyState, this.selectedOntologyState)) {
            this.selectedOntologyState = ontologyState;
            this.selectedVersion = has(this.selectedOntologyState, 'latest') ? 'latest' : 'saved';
            this.classes = this.selectedOntologyState[this.selectedVersion].classes;
            this.errorMessage = '';
        } else if (!ontologyState) {
            ontologyState = {
                recordId: this.selectedOntology.recordId
            };
            const versionObj: VersionObject = {};
            this.cm.getRecordMasterBranch(this.selectedOntology.recordId, this.catalogId)
                .pipe(
                    switchMap(branch => {
                        ontologyState.branchId = branch['@id'];
                        versionObj.commitId = getPropertyId(branch, `${CATALOG}head`);
                        const ontologyInfo = {
                            recordId: this.selectedOntology.recordId,
                            branchId: ontologyState.branchId,
                            commitId: versionObj.commitId
                        };
                        return this.mm.getOntology(ontologyInfo);
                    }),
                    switchMap(ontology => {
                        versionObj.ontologies = [ontology];
                        return this.om.getImportedOntologies(ontologyState.recordId, ontologyState.branchId, versionObj.commitId);
                    })
                ).subscribe((imported: OntologyDocument[]) => {
                    this._setVersionOntologies(versionObj, imported);
                    this._setClasses(versionObj);
                    ontologyState.latest = versionObj;
                    this.selectedVersion = 'latest';
                    this.ontologyStates.push(ontologyState);
                    this.selectedOntologyState = ontologyState;
                    this.errorMessage = '';
                }, () => this._onError());
        }
    }
    selectVersion(): void {
        if (this.selectedOntologyState) {
            if (has(this.selectedOntologyState, this.selectedVersion)) {
                this.classes = this.selectedOntologyState[this.selectedVersion].classes;
                this.errorMessage = '';
            } else {
                const versionObj: VersionObject = {};
                if (this.selectedVersion === 'latest') {
                    this.cm.getRecordBranch(this.selectedOntologyState.branchId, this.selectedOntologyState.recordId, this.catalogId)
                        .pipe(
                            switchMap(branch => {
                                versionObj.commitId = getPropertyId(branch, `${CATALOG}head`);
                                const ontologyInfo = {
                                    recordId: this.selectedOntologyState.recordId,
                                    branchId: this.selectedOntologyState.branchId,
                                    commitId: versionObj.commitId
                                };
                                return this.mm.getOntology(ontologyInfo);
                            }),
                            switchMap(ontology => {
                                versionObj.ontologies = [ontology];
                                return this.om.getImportedOntologies(this.selectedOntologyState.recordId, this.selectedOntologyState.branchId, versionObj.commitId);
                            })
                        ).subscribe((imported: OntologyDocument[]) => {
                            this._setVersionOntologies(versionObj, imported);
                            this._setClasses(versionObj);
                            this.selectedOntologyState.latest = versionObj;
                            this.errorMessage = '';
                        }, () => this._onError());
                } else {
                    const ontologyInfo = this.state.selected.mapping.getSourceOntologyInfo();
                    versionObj.commitId = ontologyInfo.commitId;
                    this.mm.getOntology(ontologyInfo)
                        .pipe(
                            switchMap(ontology => {
                                versionObj.ontologies = [ontology];
                                return this.om.getImportedOntologies(ontologyInfo.recordId, ontologyInfo.branchId, ontologyInfo.commitId);
                            })
                        ).subscribe((imported: OntologyDocument[]) => {
                            this._setVersionOntologies(versionObj, imported);
                            this._setClasses(versionObj);
                            this.selectedOntologyState.saved = versionObj;
                            this.errorMessage = '';
                        }, () => this._onError());
                }
            }
        }
    }
    set(): void {
        const selectedOntologyInfo = {
            recordId: this.selectedOntologyState.recordId,
            branchId: this.selectedOntologyState.branchId,
            commitId: this.selectedOntologyState[this.selectedVersion].commitId
        };
        const originalOntologyInfo = this.state.selected.mapping.getSourceOntologyInfo();
        if (!isEqual(originalOntologyInfo, selectedOntologyInfo)) {
            this.state.sourceOntologies = this.selectedOntologyState[this.selectedVersion].ontologies;
            const incompatibleEntities = this.mm.findIncompatibleMappings(this.state.selected.mapping, this.state.sourceOntologies);
            const jsonld = this.state.selected.mapping.getJsonld();
            incompatibleEntities.forEach(entity => {
                if (find(jsonld, {'@id': entity['@id']})) {
                    if (this.mm.isPropertyMapping(entity)) {
                        const parentClassMapping = this.mm.isDataMapping(entity) ? 
                            this.state.selected.mapping.findClassWithDataMapping(entity['@id']) :
                            this.state.selected.mapping.findClassWithObjectMapping(entity['@id']);
                        this.state.deleteProp(entity['@id'], parentClassMapping['@id']);
                    } else if (this.mm.isClassMapping(entity)) {
                        this.state.deleteClass(entity['@id']);
                    }
                }
            });
            this.state.selected.mapping.setSourceOntologyInfo(selectedOntologyInfo);
            const mappingId = this.state.selected.mapping.getMappingEntity()['@id'];
            this.state.changeProp(mappingId, `${DELIM}sourceRecord`, selectedOntologyInfo.recordId, originalOntologyInfo.recordId, true);
            this.state.changeProp(mappingId, `${DELIM}sourceBranch`, selectedOntologyInfo.branchId, originalOntologyInfo.branchId, true);
            this.state.changeProp(mappingId, `${DELIM}sourceCommit`, selectedOntologyInfo.commitId, originalOntologyInfo.commitId, true);
            this.state.selected.ontology = this.selectedOntology.jsonld;
            this.state.resetEdit();
            const classMappings = this.state.selected.mapping.getAllClassMappings();
            uniq(classMappings.map(classMapping => Mapping.getClassIdByMapping(classMapping))).forEach(id => {
                this.state.setProps(id);
            });
            this.state.availableClasses = this.classes;
        }
        this.dialog.close();
    }

    private _parseRecordResults(response: HttpResponse<JSONLDObject[]>) {
        this.ontologies = map(response.body, record => ({
            recordId: record['@id'],
            ontologyIRI: this.getOntologyIRI(record),
            title: getDctermsValue(record, 'title'),
            description: getDctermsValue(record, 'description'),
            modified: getDate(getDctermsValue(record, 'modified'), 'short'),
            selected: false,
            jsonld: record
        }));
        set(find(this.ontologies, {recordId: get(this.selectedOntology, 'recordId')}), 'selected', true);
        this.recordsErrorMessage = '';
    }
    private _onError() {
        this.errorMessage = 'Error retrieving ontology';
        this.selectedOntology = undefined;
        this.selectedOntologyState = undefined;
        this.classes = [];
    }
    private _onRecordsError() {
        this.recordsErrorMessage = 'Error retrieving ontologies';
    }
    private _setClasses(versionObj: VersionObject): void {
        versionObj.classes = this.state.getClasses(versionObj.ontologies);
        this.classes = versionObj.classes;
    }
    private _setVersionOntologies(versionObject: VersionObject, imported: OntologyDocument[]) {
        imported.forEach(obj => {
            const ontology = {id: obj.id, entities: obj.ontology as JSONLDObject[]};
            versionObject.ontologies.push(ontology);
        });
    }
}

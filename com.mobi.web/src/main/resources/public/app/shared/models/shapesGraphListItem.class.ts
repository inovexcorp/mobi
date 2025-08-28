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
import { BehaviorSubject } from 'rxjs';

import { JSONLDObject } from './JSONLDObject.interface';
import { NodeShapeSummary } from '../../shapes-graph-editor/models/node-shape-summary.interface';
import { VersionedRdfListItem } from './versionedRdfListItem.class';
import { MatSnackBarRef, SimpleSnackBar } from '@angular/material/snack-bar';

export interface ShapeGraphEditorTabStates {
  project: {
    entityIRI: string;
  },
  nodeShapes: {
    sourceIRI: string;
    nodes: NodeShapeSummary[];
  }
}

/** 
 * @ngdoc interface
 * @name NodeShapeSelection
 * 
 * Represents the currently selected Node Shape in a Shapes Graph.
 * This object is used to track which Node Shape IRI is active and whether the UI
 * should scroll to it when selection changes.
 *
 * @property {string} iri The IRI of the selected Node Shape.
 * @property {boolean} shouldScroll Flag indicating whether the UI should scroll to the selected Node Shape.
 */
export interface NodeShapeSelection {
  iri: string;
  shouldScroll: boolean;
}

/** 
 * @ngdoc interface
 * @name SubjectImportMap
 * 
 * A mapping of entityIRIs to their corresponding import status.
 * Each key represents an entity's IRI, and the value describes whether it was imported,
 * whether it also exists locally, and the ontologies it originated from.
 */
export interface SubjectImportMap {
  [entityId: string]: EntityImportStatus;
}

/** 
 * @ngdoc interface
 * @name EntityImportStatus
 * 
 * Represents the import status of a single entity within an ontology.
 *
 * @property {boolean} imported Indicates whether the entity was imported.
 * @property {boolean} alsoLocal Optional. True if the entity also exists locally in addition to being imported.
 * @property {string[]} ontologyIds Optional. A list of ontology IRIs the entity was imported from.
 */
export interface EntityImportStatus {
  imported: boolean;
  alsoLocal?: boolean;
  ontologyIds?: string[];
}

export class ShapesGraphListItem extends VersionedRdfListItem {
  //The variable keeping track of what format the preview is in is normally kept in editorTabStates in
  //OntologyListItem but keeping it high-level here as we may be re-working how tab state is stored.
  previewFormat: string;
  shapesGraphId: string;
  changesPageOpen: boolean;
  currentVersionTitle: string;
  metadata: JSONLDObject;
  content: string;
  editorTabStates: ShapeGraphEditorTabStates;
  openSnackbar: MatSnackBarRef<SimpleSnackBar>;
  subjectImportMap: SubjectImportMap;

  static PROJECT_TAB = 'project';
  static PROJECT_TAB_IDX = 0;
  static NODE_SHAPES_TAB = 'nodeShapes';
  static NODE_SHAPES_TAB_IDX = 1;

  constructor() {
    super();
    this.shapesGraphId = '';
    this.changesPageOpen = false;
    this.currentVersionTitle = '';
    this.metadata = undefined;
    this.content = '';
    this.previewFormat = 'turtle';
    this.tabIndex = ShapesGraphListItem.PROJECT_TAB_IDX;
    this.editorTabStates = {
      project: {
        entityIRI: ''
      },
      nodeShapes: {
        sourceIRI: '',
        nodes: []
      }
    };
    this.subjectImportMap = {};
  }

  // Manage the selected NodeShap IRI
  private readonly _selectedNodeShapeIri = new BehaviorSubject<NodeShapeSelection | null>(null);
  public readonly selectedNodeShapeIri$ = this._selectedNodeShapeIri.asObservable();

  /**
   * Synchronous getter for the current IRI value.
   *
   * @returns {string} The currently selected IRI
   */
  public get selectedNodeShapeIri(): string {
    return this._selectedNodeShapeIri.getValue()?.iri || '';
  }

  /**
   * Updates the selected IRI, emitting the new value to all subscribers.
   * @param {string} iri The new IRI to set.
   * @param {boolean} [shouldScroll=false] Whether the UI should scroll to the item.
   */
  public setSelectedNodeShapeIri(iri: string, shouldScroll = false): void {
    this._selectedNodeShapeIri.next({ iri, shouldScroll });
  }
}

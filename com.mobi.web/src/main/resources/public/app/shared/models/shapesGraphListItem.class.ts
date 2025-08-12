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
import { JSONLDObject } from './JSONLDObject.interface';
import { NodeShapeSummary } from '../../shapes-graph-editor/models/node-shape-summary.interface';
import { VersionedRdfListItem } from './versionedRdfListItem.class';

export interface ShapeGraphEditorTabStates {
  project: {
    entityIRI: string;
  },
  nodeShapes: {
    entityIRI: string;
    sourceIRI: string;
    nodes: NodeShapeSummary[];
  }
}

/** 
 * @ngdoc interface
 * @name shared.models:SubjectImportMap
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
 * @name shared.models:EntityImportStatus
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
  previewFormat: string
  shapesGraphId: string;
  changesPageOpen: boolean;
  currentVersionTitle: string;
  metadata: JSONLDObject;
  content: string;
  editorTabStates: ShapeGraphEditorTabStates;

  subjectImportMap: SubjectImportMap;

  static PROJECT_TAB = 0;
  static NODE_SHAPES_TAB = 1;

  constructor() {
    super();
    this.shapesGraphId = '';
    this.changesPageOpen = false;
    this.currentVersionTitle = '';
    this.metadata = undefined;
    this.content = '';
    this.previewFormat = 'turtle';
    this.tabIndex = ShapesGraphListItem.PROJECT_TAB;
    this.editorTabStates = {
      project: {
        entityIRI: ''
      }, 
      nodeShapes: {
        entityIRI: '',
        sourceIRI: '',
        nodes: []
      }
    };
    this.subjectImportMap = {};
  }
}
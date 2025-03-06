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
import { JSONLDObject } from '../../shared/models/JSONLDObject.interface';
import { FormValues } from '../../shacl-forms/models/form-values.interface';
import { SHACLFormFieldConfig } from '../../shacl-forms/models/shacl-form-field-config';
import { EntityTypesI } from './workflow-shacl-definitions.interface';
import { EntityType } from './workflow-display.interface';

/**
 * The different modes for the {@link workflows.WorkflowAddConfigurationComponent}
 */
export enum ModalType {
  ADD = 'ADD',
  EDIT = 'EDIT'
}

/**
 * @interface ModalConfig
 * 
 * Interface representing the data to be provided to the {@link workflows.WorkflowAddConfigurationComponent}
 */
interface ModalConfig {
  /**
   * The IRI (Internationalized Resource Identifier) of the Workflow Record.
   *
   * @type {string}
   */
  recordIRI: string;
  /**
   * The parent Workflow IRI
   * 
   * @type {string}
   */
  workflowIRI: string;
  /**
   * Represents each of the available types of workflow entities and their SHACL definitions.
   */
  shaclDefinitions: EntityTypesI;
  /**
   * Represents the type of entity to be added or edited.
   *
   * @type {string}
   */
  entityType: EntityType;
  /**
   * Represents the mode for a particular .
   *
   * @type {string}
   */
  mode: ModalType;
  // Mode.ADD only properties
  /**
   * The IRI of the entity that should be the "parent" of the entity being created, i.e. the subject of the triple pointing to the new entity
   * 
   * @type {string}
   */
  parentIRI?: string
  /**
   * The IRI of the property to use on the parent entity to refer to the entity being created.
   *
   * @type {string}
   */
  parentProp?: string;
  // Mode.EDIT only properties
  /**
   * The selected configuration that is being edited.
   *
   * @type {string}
   */
  selectedConfigIRI?: string;
  /**
   * Represents a workflow entity definition (Trigger/Action) being edited with all its referenced objects.
   *
   * @type {JSONLDObject} The JSON-LD representation of the workflow entity and its referenced objects.
   */
  workflowEntity?: JSONLDObject[];
}
/**
 * @interface EntityTypeConfig
 * 
 * Interface for the configuration of a workflow entity type.
 */
interface EntityTypeConfig {
  /**
   * Entity Type string value, which should be the IRI of the entity type.
   *
   * @type {string}
   */
  value: string;
  /**
   * Entity Type Label
   *
   * @type {string}
   */
  label: string;
  /**
   * Represents the shape of a node.
   * 
   * @type {JSONLDObject} The JSON-LD object representing the NodeShape of a type of entity.
   */
  nodeShape: JSONLDObject;
  /**
   * Represents the configuration objects for form fields.
   */
  formFieldConfigs: SHACLFormFieldConfig[];
  /**
   * Represents the values entered in a form.
   */
  formValues: FormValues;
}

export type { EntityTypeConfig, ModalConfig };

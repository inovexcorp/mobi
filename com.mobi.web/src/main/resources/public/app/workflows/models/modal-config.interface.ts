/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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
import { JSONLDId } from '../../shared/models/JSONLDId.interface';
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
  workflowIRI: string
  /**
   * Represents each of the available types of workflow entities and their SHACL definitions.
   */
  shaclDefinitions: EntityTypesI;
  /**
   * A list of the current identifiers of triggers/actions for the workflow in question
   */
  hasProperties: JSONLDId[];
  /**
   * The IRI of the property to set on the workflow for this entity type (either hasTrigger or hasAction)
   *
   * @type {string}
   */
  hasPropertyIRI: string;
  /**
   * The selected configuration.
   *
   * @type {string}
   */
  selectedConfigIRI?: string;
  /**
   * Represents the type of entity to be added or edited.
   *
   * @type {string}
   */
  entityType: EntityType;
  /**
   * Represents a workflow entity definition (Trigger/Action) with all its referenced objects.
   *
   * @type {JSONLDObject} The JSON-LD representation of the workflow entity and its referenced objects.
   */
  workflowEntity?: JSONLDObject[];
  /**
   * Represents the mode for a particular .
   *
   * @type {string}
   */
  mode: ModalType;
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

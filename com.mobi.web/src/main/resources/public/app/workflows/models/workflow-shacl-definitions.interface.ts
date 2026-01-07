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
import { JSONLDObject } from '../../shared/models/JSONLDObject.interface';

/**
 * @interface EntityTypesI
 * 
 * A map of entity type IRI to the JSON-LD array of the SHACL definition for the type.
 */
export interface EntityTypesI {
  [key: string]: JSONLDObject[];
}

/**
 * @interface WorkflowSHACLDefinitions
 * 
 * The response object from the /workflows/shacl-definitions endpoint. Each key in the triggers and actions objects is
 * an IRI of a Trigger or Action subclass and each value is the JSON-LD array of the RDF for the SHACL definitions.
 */
export interface WorkflowSHACLDefinitions {
  actions: EntityTypesI,
  triggers: EntityTypesI
}

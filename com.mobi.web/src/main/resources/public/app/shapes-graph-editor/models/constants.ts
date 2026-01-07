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
import { OWL, RDFS, SH } from '../../prefixes';
// Reference: https://www.w3.org/TR/shacl/#targets
export const TARGET_NODE = `${SH}targetNode`; // https://www.w3.org/TR/shacl/#targetNode
export const TARGET_CLASS = `${SH}targetClass`; // https://www.w3.org/TR/shacl/#targetClass
export const TARGET_OBJECTS_OF = `${SH}targetObjectsOf`; // https://www.w3.org/TR/shacl/#targetSubjectsOf
export const TARGET_SUBJECTS_OF = `${SH}targetSubjectsOf`; // https://www.w3.org/TR/shacl/#targetObjectsOf
export const IMPLICIT_REFERENCE = 'urn:implicitTarget'; // implicitTarget
export const EXPLICIT_TARGETS = [TARGET_NODE, TARGET_CLASS, TARGET_OBJECTS_OF, TARGET_SUBJECTS_OF];
export const IMPLICIT_TYPES = [`${OWL}Class`, `${RDFS}Class`];

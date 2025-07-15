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
import { ValueOption } from './value-option.interface';

export interface BaseTargetTypeData {
  multiSelect: boolean;
  targetType: string;
}

export interface MultiTargetTypeData extends BaseTargetTypeData {
  multiSelect: true;
  values: ValueOption[]
}

export interface SingleTargetTypeData extends BaseTargetTypeData {
  multiSelect: false;
  value: string;
}
/**
 * Represents a SHACL target type mapping, such as `sh:targetNode` or `sh:targetClass`,
 * along with its corresponding IRI or literal value.
 */
export type TargetTypeData = MultiTargetTypeData | SingleTargetTypeData;

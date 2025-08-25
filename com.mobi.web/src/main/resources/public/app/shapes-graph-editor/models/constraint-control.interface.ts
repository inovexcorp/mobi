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
import { FormControl } from '@angular/forms';

import { ValueOption } from './value-option.interface';
import { PropertyType } from '../../shared/services/shapesGraphState.service';

// The types of Constraint Controls we support. translate to HTML input types
type ConstraintControlType = 'text' | 'number' | 'select' | 'autocomplete' | 'chips';

/**
 * The base interface for all ConstraintControl options
 */
interface BaseConstraintControl {
  control: FormControl;
  label: string;
  name: string;
  type: ConstraintControlType;
  datatype?: 'IRI'|string,
  prop: string;
  errorMessage?: string;
  tooltip?: string;
}

export interface TextConstraintControl extends BaseConstraintControl {
  type: 'text';
  multiple: false;
}

export interface ChipsConstraintControl extends BaseConstraintControl {
  type: 'chips';
  multiple: true;
}

export interface NumberConstraintControl extends BaseConstraintControl {
  type: 'number';
  datatype?: string;
  min?: number;
  step?: number;
  multiple: false;
}

export interface SelectConstraintControl extends BaseConstraintControl {
  type: 'select';
  options: ValueOption[];
  multiple: boolean;
}

export interface AutocompleteConstraintControl extends BaseConstraintControl {
  type: 'autocomplete';
  multiple: boolean;
  pullClasses: boolean;
  propertyTypes?: PropertyType[];
}

/**
 * Union type for all the supported types of Constraint Controls
 */
export type ConstraintControl = 
  TextConstraintControl | 
  NumberConstraintControl | 
  SelectConstraintControl | 
  AutocompleteConstraintControl | 
  ChipsConstraintControl;

/**
 * A collection of ConstraintControls grouped into a single Option for use in the dropdown of the
 * {@link AddPropertyShapeModelComponent}.
 */
export interface ConstraintOption {
  label: string;
  controls: ConstraintControl[];
}
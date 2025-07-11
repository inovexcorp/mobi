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
import { ValidatorFn, Validators } from '@angular/forms';

import { RDF, SHACL_FORM, SH, XSD } from '../../prefixes';
import { JSONLDObject } from '../../shared/models/JSONLDObject.interface';
import {
  getPropertyId,
  getPropertyValue,
  getPropertyIds,
  getBeautifulIRI,
  rdfListToValueArray
} from '../../shared/utility';
import { Option } from './option.class';

export enum FieldType {
  TEXT = 'text',
  TOGGLE = 'toggle',
  RADIO = 'radio',
  CHECKBOX = 'checkbox',
  DROPDOWN = 'dropdown',
  AUTOCOMPLETE = 'autocomplete',
  TEXTAREA = 'textarea',
  HIDDEN_TEXT = 'hidden-text',
  NO_INPUT = 'no-input'
}

export class SHACLFormFieldConfig {
  private _isValid: boolean;
  private _errorMessage = '';
  private _nodeShape: JSONLDObject;
  private _propertyShape: JSONLDObject;
  private _values: Option[];
  private _fieldType: FieldType;
  private _property: string;
  private _label: string;
  private _jsonld: JSONLDObject[];
  private _subFields: SHACLFormFieldConfig[];
  
  constructor(nodeShape: JSONLDObject, propertyShapeId: string, fullJsonld: JSONLDObject[]) {
    this._nodeShape = nodeShape;
    this._jsonld = fullJsonld;
    try {
      this._propertyShape = fullJsonld.find(obj => obj['@id'] === propertyShapeId);
      if (!this._propertyShape) {
        throw new Error('Could not find specified PropertyShape in provided JSON-LD');
      }
      this._property = getPropertyId(this._propertyShape, `${SH}path`);
      this._label = getPropertyValue(this._propertyShape, `${SH}name`) || getBeautifulIRI(this._property)
        .replace('Has ', '');

      if (!this._property) {
        throw new Error('Property path not configured');
      }

      if (this._propertyShape[`${SH}node`]) { // If a complex PropertyShape (i.e. with sh:node)
        const subNodeShapeId = getPropertyId(this._propertyShape, `${SH}node`);
        const subNodeShape = fullJsonld.find(obj => obj['@id'] === subNodeShapeId);
        this._subFields = [];
        getPropertyIds(subNodeShape, `${SH}property`).forEach(subFieldId => {
          this._subFields.push(new SHACLFormFieldConfig(subNodeShape, subFieldId, fullJsonld));
        });
      } else { // Assumption of simple PropertyShapes (i.e. without sh:node)
        switch (getPropertyId(this._propertyShape, `${SHACL_FORM}usesFormField`)) {
          // All supported FormField types are defined in `com.mobi.shacl.form.api/src/main/resources/shaclForm.ttl`
          case `${SHACL_FORM}TextInput`:
            this._fieldType = FieldType.TEXT;
            break;
          case `${SHACL_FORM}ToggleInput`:
            this._fieldType = FieldType.TOGGLE;
            break;
          case `${SHACL_FORM}RadioInput`:
            this._fieldType = FieldType.RADIO;
            break;
          case `${SHACL_FORM}CheckboxInput`:
            this._fieldType = FieldType.CHECKBOX;
            break;
          case `${SHACL_FORM}DropdownInput`:
            this._fieldType = FieldType.DROPDOWN;
            break;
          case `${SHACL_FORM}AutocompleteInput`:
            this._fieldType = FieldType.AUTOCOMPLETE;
            break;
          case `${SHACL_FORM}TextareaInput`:
            this._fieldType = FieldType.TEXTAREA;
            break;
          case `${SHACL_FORM}HiddenTextInput`:
            this._fieldType = FieldType.HIDDEN_TEXT;
            break;
          case `${SHACL_FORM}NoInput`:
            this._fieldType = FieldType.NO_INPUT;
            break;
          case '':
            throw new Error('Form field type not configured');
          default:
            throw new Error('Form field type not supported');
        }
  
        const valueArray = this._propertyShape[`${SH}in`] ? 
          rdfListToValueArray(fullJsonld, getPropertyId(this._propertyShape, `${SH}in`)) :
          [];
      
        this._values = valueArray.map(value => new Option(value, value));
      }
      this._isValid = true;
    } catch (e) { // If anything goes wrong in the initialization, catch the error message and mark config as invalid
      this._isValid = false;
      if (typeof e === 'string') {
        this._errorMessage = e;
      } else if (e instanceof Error) {
        this._errorMessage = e.message;
      }
    }
  }

  public get isValid(): boolean {
    return this._isValid;
  }

  public get errorMessage(): string {
    return this._errorMessage;
  }

  public get nodeShape(): JSONLDObject {
      return this._nodeShape;
  }

  public get propertyShape(): JSONLDObject {
    return this._propertyShape;
  }

  public get fieldType(): FieldType {
    return this._fieldType;
  }

  public get label(): string {
    return this._label;
  }

  public get property(): string {
    return this._property;
  }

  public get values(): Option[] {
      return this._values;
  }

  public get jsonld(): JSONLDObject[] {
      return this._jsonld;
  }

  /**
   * sh:node value's form field configurations
   */
  public get subFields(): SHACLFormFieldConfig[]|undefined {
    return this._subFields;
  }

  // sh:minCount
  public get minCount(): number|undefined {
    const temp = getPropertyValue(this.propertyShape, `${SH}minCount`);
    return temp ? (Number.isNaN(parseInt(temp, 10)) ? undefined : parseInt(temp, 10)) : undefined;
  }

  // sh:maxCount
  public get maxCount(): number|undefined {
    const temp = getPropertyValue(this.propertyShape, `${SH}maxCount`);
    return temp ? (Number.isNaN(parseInt(temp, 10)) ? undefined : parseInt(temp, 10)) : undefined;
  }

  // sh:regex & sh:flags
  public get regex(): RegExp|undefined {
    const temp = getPropertyValue(this.propertyShape, `${SH}pattern`);
    const flags = getPropertyValue(this._propertyShape, `${SH}flags`);
    return temp ? (flags ? new RegExp(temp, flags) : new RegExp(temp)) : undefined;
  }

  // sh:datatype
  public get datatype(): string|undefined {
    const temp = getPropertyId(this.propertyShape, `${SH}datatype`);
    return temp || undefined;
  }

  // sh:defaultValue
  public get defaultValue(): string|undefined {
    const tempValue = getPropertyValue(this.propertyShape, `${SH}defaultValue`);
    const tempId = getPropertyId(this.propertyShape, `${SH}defaultValue`);
    return tempValue || tempId || undefined;
  }

  // All the form validators for the field
  public get validators(): ValidatorFn[] {
    const validators = [];
    const regex = this.regex;
    if (regex) {
      validators.push(Validators.pattern(regex));
    }
    const datatype = this.datatype;
    if (datatype === `${XSD}integer` || datatype === `${XSD}int`) {
      validators.push(Validators.pattern('^[0-9]+$'));
    }
    const minCount = this.minCount;
    if (minCount > 0) {
      validators.push(Validators.required);
    }
    return validators;
  }

  /**
   * Creates a JSON-LD array of the field's PropertyShape and all the referenced blank nodes from within the stored 
   * JSON-LD.
   * 
   * @returns {JSONLDObject[]} An array with the PropertyShape and all referenced blank nodes
   */
  public collectAllReferencedNodes(): JSONLDObject[] {
    // Collect all blank node identifiers referenced in the propertyShape
    const blankNodeIdentifiers = new Set<string>();
    Object.keys(this.propertyShape).forEach(key => {
      const propertyIds: Set<string> = getPropertyIds(this.propertyShape, key);
      if (propertyIds.size) {
        propertyIds.forEach(propertyId => {
          blankNodeIdentifiers.add(propertyId);
        });
      }
    });

    // Find and collect all JSON-LD objects that match the blank node identifiers
    const referencedBlankNodes = this.jsonld.filter(obj => 
        obj['@id'] && blankNodeIdentifiers.has(obj['@id'])
    );

    // Return the array consisting of the propertyShape and any found blank node objects
    return [this.propertyShape, ...referencedBlankNodes];
  }
}

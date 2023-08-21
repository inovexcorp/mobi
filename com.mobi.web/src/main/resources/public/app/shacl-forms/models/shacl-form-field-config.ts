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
import { ValidatorFn, Validators } from '@angular/forms';

import { RDF, SHACL_FORM, SHACL, XSD } from '../../prefixes';
import { JSONLDObject } from '../../shared/models/JSONLDObject.interface';
import { getPropertyId, getPropertyValue } from '../../shared/utility';

export class SHACLFormFieldConfig {
  private _isValid: boolean;
  private _errorMessage = '';
  private _nodeShape: JSONLDObject;
  private _propertyShape: JSONLDObject;
  private _values: string[];
  private _fieldType: string;
  private _property: string;
  private _label: string;
  
  constructor(nodeShape: JSONLDObject, propertyShapeId: string, fullJsonld: JSONLDObject[]) {
    this._nodeShape = nodeShape;
    try {
      this._propertyShape = fullJsonld.find(obj => obj['@id'] === propertyShapeId);
      if (!this._propertyShape) {
        throw new Error('Could not find specified PropertyShape in provided JSON-LD');
      }
      this._label = getPropertyValue(this._propertyShape, `${SHACL}name`);
      this._property = getPropertyId(this._propertyShape, `${SHACL}path`);
      if (!this._property) {
        throw new Error('Property path not configured');
      }
      // Assumption of simple PropertyShapes (i.e. without sh:node)
      // If sh:node, could have internal list of SHACLFormFieldConfig whose NodeShape is the sh:node linked NodeShape
      switch (getPropertyId(this._propertyShape, `${SHACL_FORM}usesFormField`)) {
        // All supported FormField types are defined in `com.mobi.shacl.form.api/src/main/resources/shaclForm.ttl`
        case `${SHACL_FORM}TextInput`:
          this._fieldType = 'text';
          break;
        case `${SHACL_FORM}ToggleInput`:
          this._fieldType = 'toggle';
          break;
        case `${SHACL_FORM}RadioInput`:
          this._fieldType = 'radio';
          break;
        case `${SHACL_FORM}CheckboxInput`:
          this._fieldType = 'checkbox';
          break;
        case '':
          throw new Error('Form field type not configured');
        default:
          throw new Error('Form field type not supported');
      }

      this._values = this._propertyShape[`${SHACL}in`] ? 
        this._rdfListToValueArray(fullJsonld, getPropertyId(this._propertyShape, `${SHACL}in`)) :
        [];
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

  public get fieldType(): string {
    return this._fieldType;
  }

  public get label(): string {
    return this._label;
  }

  public get property(): string {
    return this._property;
  }

  public get values(): string[] {
      return this._values;
  }

  // sh:minCount
  public get minCount(): number|undefined {
    const temp = getPropertyValue(this.propertyShape, `${SHACL}minCount`);
    return temp ? (Number.isNaN(parseInt(temp, 10)) ? undefined : parseInt(temp, 10)) : undefined;
  }

  // sh:maxCount
  public get maxCount(): number|undefined {
    const temp = getPropertyValue(this.propertyShape, `${SHACL}maxCount`);
    return temp ? (Number.isNaN(parseInt(temp, 10)) ? undefined : parseInt(temp, 10)) : undefined;
  }

  // sh:regex & sh:flags
  public get regex(): RegExp|undefined {
    const temp = getPropertyValue(this.propertyShape, `${SHACL}pattern`);
    const flags = getPropertyValue(this._propertyShape, `${SHACL}flags`);
    return temp ? (flags ? new RegExp(temp, flags) : new RegExp(temp)) : undefined;
  }

  // sh:datatype
  public get datatype(): string|undefined {
    const temp = getPropertyId(this.propertyShape, `${SHACL}datatype`);
    return temp || undefined;
  }

  // sh:defaultValue
  public get defaultValue(): string|undefined {
    const tempValue = getPropertyValue(this.propertyShape, `${SHACL}defaultValue`);
    const tempId = getPropertyId(this.propertyShape, `${SHACL}defaultValue`);
    return tempValue || tempId || undefined;
  }

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

  private _rdfListToValueArray(fullJsonld: JSONLDObject[], firstElementID: string, sortedList: string[] = []): string[] {
    const currentElement: JSONLDObject|undefined = fullJsonld.find(jsonLDObject => jsonLDObject['@id'] === firstElementID);
    if (!currentElement) {
      console.error(`Could not find element ID ${firstElementID} in provided JSON-LD`);
      return sortedList;
    }  else if (currentElement[`${RDF}first`] === undefined) {
      console.error(`No rdf:first predicate found in element with ID ${firstElementID}`);
      return sortedList;
    } else if (currentElement[`${RDF}rest`] === undefined) {
      sortedList.push(getPropertyValue(currentElement, `${RDF}first`));
      console.error(`No rdf:rest predicate found in element with ID ${firstElementID}`);
      return sortedList;
    } else if (getPropertyId(currentElement, `${RDF}rest`) === `${RDF}nil`) {
      sortedList.push(getPropertyValue(currentElement, `${RDF}first`));
      return sortedList;
    } else {
      sortedList.push(getPropertyValue(currentElement, `${RDF}first`));
      return this._rdfListToValueArray(fullJsonld, getPropertyId(currentElement, `${RDF}rest`), sortedList);
    }
  }
}

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
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, UntypedFormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { get, isArray } from 'lodash';

import { Constraint, ValueModel } from '../../models/constraint.interface';
import { ConstraintControl } from '../../models/constraint-control.interface';
import { getBeautifulIRI, getEntityName, getEntityNames, getSkolemizedIRI, isInteger, lowercaseFirstLetter } from '../../../shared/utility';
import { JSONLDId } from '../../../shared/models/JSONLDId.interface';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { JSONLDValue } from '../../../shared/models/JSONLDValue.interface';
import { PathNode, PropertyShape } from '../../models/property-shape.interface';
import { PropertyManagerService } from '../../../shared/services/propertyManager.service';
import { regexValidator } from '../../../shared/validators/regex.validator';
import { RDF, SH, XSD } from '../../../prefixes';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { splitIRI } from '../../../shared/pipes/splitIRI.pipe';
import { SplitIRI } from '../../../shared/models/splitIRI.interface';
import { ValueOption } from '../../models/value-option.interface';

export interface ConstraintOption {
  label: string;
  controls: ConstraintControl[];
}

/**
 * @class NodeShapesDisplayComponent
 * @requires ShapesGraphStateService
 * @requires PropertyManagerService
 * @requires FormBuilder
 * 
 * A component that creates content for a modal that allows the user to generate a new Property Shape including its
 * path and constraints. The path is displayed and edited with a {@link PropertyShapePathComponent}
 * and the constraint types are selected, populating {@link ConstraintTypeFormComponent} instances.
 * On submit, the modal will create the {@link PropertyShape} object, generate all applicable blank
 * nodes, and update the user's InProgressCommit. Meant to be used in conjunction with the `MatDialog` service.
 */
@Component({
  selector: 'app-add-property-shape-modal',
  templateUrl: './add-property-shape-modal.component.html',
  styleUrls: ['./add-property-shape-modal.component.scss']
})
export class AddPropertyShapeModalComponent implements OnInit, OnDestroy {
  path: PathNode;
  constraintTypes: ConstraintOption[] = [];
  selectedConstraintTypes: ConstraintOption[] = [];
  errorMessage = '';

  constraintForm = this._fb.group({
    name: '',
    message: '',
    constraintType: [{value: [], disabled: true}, Validators.required]
  });
  private _destroySub$ = new Subject<void>();

  constructor(private _sgs: ShapesGraphStateService, private _pm: PropertyManagerService, 
    private _fb: UntypedFormBuilder, private _dialogRef: MatDialogRef<AddPropertyShapeModalComponent>) {}
  
  ngOnInit(): void {
    this._setConstraintTypes();

    // Setup the logic to dynamically update the form with the selected constraint controls
    this.constraintForm.controls['constraintType'].valueChanges.pipe(
      takeUntil(this._destroySub$),
    ).subscribe((val: ConstraintOption[]) => {
      this.handleConstraintChange(val);
    });
  }

  /**
   * Cleans up all subscriptions to avoid memory leaks.
   */
  ngOnDestroy(): void {
    this._destroySub$.next();
    this._destroySub$.complete();
  }

  /**
   * Takes the currently selected Constraint Options from the form input and properly updates the dynamic form controls
   * based on what was added or removed, making sure there are no duplicates. Sets the value of
   * `selectedConstraintTypes`.
   * 
   * @param {ConstraintOption[]} constraintOptions The selected constraint options on the constraint select in the form
   */
  handleConstraintChange(constraintOptions: ConstraintOption[]): void {
    const newOptions: ConstraintOption[] = constraintOptions.filter(newType => 
      !this.selectedConstraintTypes.includes(newType));
    const removedOptions: ConstraintOption[] = this.selectedConstraintTypes.filter(selectedType => 
      !constraintOptions.includes(selectedType));
    newOptions.forEach(type => {
      type.controls.forEach(controlObj => {
        this.constraintForm.addControl(controlObj.name, controlObj.control);
      });
    });
    removedOptions.forEach(type => {
      type.controls.forEach(controlObj => {
        controlObj.control.reset();
        this.constraintForm.removeControl(controlObj.name);
      });
    });
    this.selectedConstraintTypes = constraintOptions;
  }

  /**
   * Enables the Constraint Option select. Used when the path changes (mostly when a node is first added).
   */
  enableConstraints(): void {
    this.constraintForm.controls['constraintType'].enable();
  }

  /**
   * Display With function for the Constraint Option select.
   * 
   * @param {ConstraintOption} constraint The Constraint option to get the display for
   * @returns {string} The label of the constraint if available
   */
  getTypeText(constraint: ConstraintOption): string {
    return constraint && constraint.label ? constraint.label : '';
  }

  /**
   * Creates the configured Property Shape with its path and constraints and updates the In Progress Commit. If
   * successful returns the new Property Shape in the modal close.
   */
  create(): void {
    // Create JSON-LD
    const split: SplitIRI = splitIRI(this._sgs.listItem.selected['@id']);
    const namespace = split.begin + split.then;
    const propertyShapeObj: JSONLDObject = {
      '@id': `${namespace}${uuidv4()}`,
      '@type': [`${SH}PropertyShape`]
    };
    // Add sh:name and sh:message if set
    if (this.constraintForm.controls['name'].value) {
      propertyShapeObj[`${SH}name`] = [{ '@value': this.constraintForm.controls['name'].value }];
    }
    if (this.constraintForm.controls['message'].value) {
      propertyShapeObj[`${SH}message`] = [{ '@value': this.constraintForm.controls['message'].value }];
    }
    // Create PropertyShape Object
    const propertyShape: PropertyShape = {
      id: propertyShapeObj['@id'],
      label: getEntityName(propertyShapeObj),
      message: this.constraintForm.controls['message'].value || undefined,
      jsonld: propertyShapeObj,
      constraints: [],
      path: undefined,
      pathString: '',
      pathHtmlString: '',
      referencedNodeIds: new Set<string>()
    };
    // Start the additions array
    const additions: JSONLDObject[] = [propertyShape.jsonld];
    // Process the path
    propertyShape.path = this.path;
    propertyShapeObj[`${SH}path`] = [{ '@id': this.addPathToShape(propertyShape, this.path, additions) }];
    // Process constraints
    this.addConstraintsToShape(propertyShape, additions);

    // Add to List Item entityInfo
    get(this._sgs.listItem, 'entityInfo', {})[propertyShapeObj['@id']] = {
      label: getEntityName(propertyShapeObj),
      names: getEntityNames(propertyShapeObj),
    };
    // Add sh:property triple on selected NodeShape to in progress commit
    this._sgs.addToAdditions(this._sgs.listItem.versionedRdfRecord.recordId, {
      '@id': this._sgs.listItem.selected['@id'],
      [`${SH}property`]: [{ '@id': propertyShapeObj['@id'] }]
    });
    // Update in progress commit
    additions.forEach(obj => {
      this._sgs.addToAdditions(this._sgs.listItem.versionedRdfRecord.recordId, obj);
    });
    // Save in progress commit
    this._sgs.saveCurrentChanges().subscribe(() => {
      this.errorMessage = '';
      if (!this._sgs.listItem.selected[`${SH}property`]) {
        this._sgs.listItem.selected[`${SH}property`] = [];
      }
      this._sgs.listItem.selected[`${SH}property`].push({ '@id': propertyShapeObj['@id'] });
      this._sgs.listItem.selectedBlankNodes = this._sgs.listItem.selectedBlankNodes.concat(additions);
      this._dialogRef.close(propertyShape);
    }, error => {
      this.errorMessage = error;
    });
  }

  /**
   * A recursive function that parses a Path Node and builds up the JSON-LD, referenced blank node ids, and path
   * strings as it goes. For the initial call, the provided PathNode is intended to be the starting node that is
   * already set on the PropertyShape.path.
   * 
   * @param {PropertyShape} propertyShape The PropertyShape the path is for
   * @param {PathNode} node The node in the path that is currently being processed
   * @param {JSONLDObject[]} additions A running array of all the generated JSON-LD that makes up the definition of the
   *    PropertyShape, its path, and its constraints.
   * @returns {string} The IRI of the most recently generated blank node, or in the case of a simple IRI path, the IRI
   *    of the selected property itself 
   */
  addPathToShape(propertyShape: PropertyShape, node: PathNode, additions: JSONLDObject[]): string {
    if (node.type === 'IRI') {
      const name = this._sgs.getEntityName(node.iri);
      propertyShape.pathString += name;
      propertyShape.pathHtmlString += `<span title="${node.iri}">${name}</span>`;
      return node.iri;
    } else if (node.type === 'Inverse' || node.type === 'OneOrMore' || node.type === 'ZeroOrMore' || node.type === 'ZeroOrOne') {
      this._prefixPathString(propertyShape, node);
      const prop = `${SH}${lowercaseFirstLetter(node.type)}Path`;
      const bnode: JSONLDObject = {
        '@id': this._getBnode(),
        [prop]: [{ '@id': this.addPathToShape(propertyShape, node.path, additions)}]
      };
      additions.push(bnode);
      propertyShape.referencedNodeIds.add(bnode['@id']);
      this._suffixPathString(propertyShape, node);
      return bnode['@id'];
    } else if (node.type === 'Alternative') {
      const firstListBnode = this._createRdfList(node.items, propertyShape, additions, ' | ');
      const bnode: JSONLDObject = {
        '@id': this._getBnode(),
        [`${SH}alternativePath`]: [{ '@id': firstListBnode['@id'] }]
      };
      additions.push(bnode);
      propertyShape.referencedNodeIds.add(bnode['@id']);
      return bnode['@id'];
    } else { // Only other option is a Sequence
      const firstListBnode = this._createRdfList(node.items, propertyShape, additions, ' / ');
      return firstListBnode['@id'];
    }
  }

  /**
   * Processes the selected Constraint Types and adds all relevant data to the provided PropertyShape and additions
   * JSON-LD array. Will only process controls that have actual values set.
   * 
   * @param {PropertyShape} propertyShape The PropertyShape to set the constraint data on
   * @param {JSONLDObject[]} additions A running array of all the generated JSON-LD that makes up the definition of the
   *    PropertyShape, its path, and its constraints.
   */
  addConstraintsToShape(propertyShape: PropertyShape, additions: JSONLDObject[]): void {
    this.selectedConstraintTypes.forEach(constraintOption => {
      constraintOption.controls.filter(controlObj => this._controlHasValue(controlObj.control)).forEach(controlObj => {
        this.processConstraintControl(controlObj, propertyShape, additions);
      });
    });
  }

  /**
   * Converts a single ConstraintControl and its associated FormControl into a Constraint on the provided PropertyShape,
   * updating the referenced blank node ids and the provided additions JSON-LD array as applicable.
   * 
   * @param {ConstraintControl} constraintControl The individual Constraint Control providing the selected value of a
   *    single SHACL constraint
   * @param {PropertyShape} propertyShape The PropertyShape to add the Constraint to
   * @param {JSONLDObject[]} additions A running array of all the generated JSON-LD that makes up the definition of the
   *    PropertyShape, its path, and its constraints.
   */
  processConstraintControl(constraintControl: ConstraintControl, propertyShape: PropertyShape, 
      additions: JSONLDObject[]): void {
    // Create the Constraint object to start based on the SHACL property
    const constraint: Constraint = {
      constraintProp: constraintControl.prop,
      constraintLabel: getBeautifulIRI(constraintControl.prop),
      value: []
    };
    // Determine what datatype the values should be. Fallback to string if not set
    let datatype: string = constraintControl.datatype || `${XSD}string`;
    if (datatype !== 'IRI' && constraintControl.type === 'number') {
      // If the input type is a number and there's no datatype set, try to identify whether it is an integer or double
      datatype = constraintControl.datatype || 
        (isInteger(constraintControl.control.value) ? `${XSD}int` : `${XSD}double`);
    }
    if (constraintControl.multiple) {
      this._processMultipleConstraintControl(constraintControl, datatype, propertyShape, constraint, additions);
    } else { // If the control supports only a single value
      this._processSingleConstraintControl(constraintControl, datatype, propertyShape, constraint);
    }
    // Update list of constraints on property shape
    propertyShape.constraints.push(constraint);
  }

  /**
   * Creates a blank node skolemized IRI. Wrapped for ease of unit testing.
   * @returns {string} A new skolemized IRI for a blank node
   */
  private _getBnode(): string {
    return getSkolemizedIRI();
  }

  /**
   * Determines whether the provided FormControl has a value set or not. Expects values to be of type object, string,
   * array of strings, or number.
   * 
   * @param {FormControl} control The control to check
   * @returns {boolean} True is a value has been set for the control; false otherwise
   */
  private _controlHasValue(control: FormControl): boolean {
    if (control.value === undefined || control.value === null) {
      return false;
    }
    if (isArray(control.value) || typeof control.value === 'string') {
      return control.value.length > 0;
    }
    // If values are objects or numbers, if they were unset would have gotten caught by first if
    return true;
  }

  /**
   * Processes a ConstraintControl that supports multiple values. Updates the provided PropertyShape's JSON-LD, the
   * provided Constraint's value array, and the provided additions JSON-LD array in the event more than one value was
   * entered (creating an RDF list). Determines how to represent the control's value based off the provided datatype.
   * 
   * @param {ConstraintControl} constraintControl The control that is expected to support multiple values
   * @param {'IRI'|string} datatype The type of values that the control provides. Either IRIs or an XSD datatype
   * @param {PropertyShape} propertyShape The PropertyShape the control is assigning a constraint to
   * @param {Constraint} constraint The Constraint whose values are being set 
   * @param {JSONLDObject[]} additions A running array of all the generated JSON-LD that makes up the definition of the
   *    PropertyShape, its path, and its constraints.
   */
  private _processMultipleConstraintControl(constraintControl: ConstraintControl, datatype: 'IRI'|string, 
      propertyShape: PropertyShape, constraint: Constraint, additions: JSONLDObject[]): void {
    const rawValues: (string | ValueOption)[] = constraintControl.control.value;
    if (!rawValues.length) {
      return;
    }
    // Create arrays of JSON-LD and string representations of the values depending on whether they are IRIs
    const jsonldValues: (JSONLDId | JSONLDValue)[] = [];
    const values: ValueModel[] = [];
    if (typeof rawValues[0] === 'object') {
      rawValues.forEach((valueOption: ValueOption) => {
        jsonldValues.push({ '@id': valueOption.value });
        values.push({
          chosenValue: valueOption.value,
          label: valueOption.label
        });
      });
    } else {
      rawValues.forEach((value: string) => {
        jsonldValues.push({ '@value': value, '@type': datatype });
        values.push(this._createValueModel(value, datatype));
      });
    }
    // If the control supports multiple values, but only one is set, set the JSON-LD value and add the single value
    if (values.length === 1) {
      propertyShape.jsonld[constraintControl.prop] = [jsonldValues[0]];
      constraint.value.push(values[0]);
    } else {
      // If there's more than one value, create an RDF List, making value models, updating the referenced blank node
      // ids, and the additions JSON-LD array
      let startingBnode: JSONLDObject;
      for (let i = values.length - 1; i >= 0; i--) {
        const bnode: JSONLDObject = {
          '@id': this._getBnode(),
          [`${RDF}first`]: [jsonldValues[i]]
        };
        if (i === values.length - 1) {
          bnode[`${RDF}rest`] = [{ '@id': `${RDF}nil` }];
        } else {
          bnode[`${RDF}rest`] = [{ '@id': startingBnode['@id'] }];
        }
        additions.push(bnode);
        propertyShape.referencedNodeIds.add(bnode['@id']);
        startingBnode = bnode;
        constraint.value.push(values[i]);
      }
      constraint.value.reverse(); // Since we iterated backwards, set it in the right order
      // Update the PropertyShape JSON-LD
      propertyShape.jsonld[constraintControl.prop] = [{ '@id': startingBnode['@id'] }];
    }
  }

  /**
   * Processes a ConstraintControl that supports a single value. Updates the provided PropertyShape's JSON-LD and the
   * provided Constraint's value array. Determines how to represent the control's value based off the provided datatype.
   * 
   * @param {ConstraintControl} constraintControl The control that is expected to only have a single value
   * @param {'IRI'|string} datatype The type of values that the control provides. Either IRIs or an XSD datatype
   * @param {PropertyShape} propertyShape The PropertyShape the control is assigning a constraint to
   * @param {Constraint} constraint The Constraint whose value is being set
   */
  private _processSingleConstraintControl(constraintControl: ConstraintControl, datatype: 'IRI'|string, 
      propertyShape: PropertyShape, constraint: Constraint): void {
    // If the control value is an object, it's from an autocomplete and will be a ValueOption
    let value: string;
    let valueModel: ValueModel;
    if (typeof constraintControl.control.value !== 'object') {
      value = constraintControl.control.value;
      valueModel = this._createValueModel(value, datatype);
    } else {
      value = constraintControl.control.value.value;
      valueModel = {
        chosenValue: constraintControl.control.value.value,
        label: constraintControl.control.value.label
      };
    }
    // Create the correct JSON-LD value and set it
    const valObj: JSONLDId|JSONLDValue = datatype === 'IRI' 
      ? { '@id': value }
      : { '@value': value, '@type': datatype };
    propertyShape.jsonld[constraintControl.prop] = [valObj];
    // Add the constraint value
    constraint.value = [valueModel];
  }

  /**
   * Updates the provided PropertyShape's path strings given the provided PathNode's type. It is expected that the node
   * will only be of type Inverse, ZeroOrMore, OneOrMore, or ZeroOrOne. Intended to be called before the sub node(s) is
   * processed.
   * 
   * @param {PropertyShape} propertyShape The PropertyShape whose paths need updating
   * @param {Path} node The Inverse, ZeroOrMore, OneOrMore, or ZeroOrOne node to process
   */
  private _prefixPathString(propertyShape: PropertyShape, node: PathNode): void {
    switch (node.type) {
      case 'Inverse':
        propertyShape.pathString += '^( ';
        propertyShape.pathHtmlString += '^( ';
        break;
      default:
        propertyShape.pathString += '( ';
        propertyShape.pathHtmlString += '( ';
    }
  }

  /**
   * Updates the provided PropertyShape's path strings given the provided PathNode's type. It is expected that the node
   * will only be of type Inverse, ZeroOrMore, OneOrMore, or ZeroOrOne. Intended to be called after the sub node(s) is
   * processed.
   * 
   * @param {PropertyShape} propertyShape The PropertyShape whose paths need updating
   * @param {Path} node The Inverse, ZeroOrMore, OneOrMore, or ZeroOrOne node to process
   */
  private _suffixPathString(propertyShape: PropertyShape, node: PathNode): void {
    propertyShape.pathString += ' )';
    propertyShape.pathHtmlString += ' )';
    switch (node.type) {
      case 'ZeroOrMore': 
        propertyShape.pathString += '*';
        propertyShape.pathHtmlString += '*';
        break;
      case 'OneOrMore': 
        propertyShape.pathString += '+';
        propertyShape.pathHtmlString += '+';
        break;
      case 'ZeroOrOne': 
        propertyShape.pathString += '?';
        propertyShape.pathHtmlString += '?';
        break;
    }
  }

  /**
   * Creates a ValueModel object based on the provided string value and datatype. If the datatype is IRI instead of an
   * XSD datatype, pulls the entity name from the current listItem.
   * 
   * @param {string} value The string value to represent
   * @param {'IRI'|string} datatype The datatype to associate with the value
   * @returns {ValueModel} A ValueModel that represents the provided information
   */
  private _createValueModel(value: string, datatype: 'IRI'|string): ValueModel {
    return {
      chosenValue: value,
      label: datatype === 'IRI' ? this._sgs.getEntityName(value) : value
    };
  }

  /**
   * Creates an RDF linked list representing the provided array of PathNode objects, updating the provided
   * PropertyShape's referenced blank node ids and path strings as well as the provided additions JSON-LD array as it
   * goes. Uses the provided separator string in the path strings between the individual node representations. Returns
   * the first generated blank node for refer to the list in downstream logic. Expected to be used for Sequences or
   * Alternatives.
   * 
   * @param {PathNode[]} items The list nodes to represent as a RDF list
   * @param {PropertyShape} propertyShape The PropertyShape the list belongs to
   * @param {JSONLDObject[]} additions A running array of all the generated JSON-LD that makes up the definition of the
   *    PropertyShape, its path, and its constraints.
   * @param {string} separator The string to insert between nodes in the path strings. Expected to be either ' / ' or
   *    ' | '
   * @returns {JSONLDObject} The first blank node in the generated RDF list
   */
  private _createRdfList(items: PathNode[], propertyShape: PropertyShape, additions: JSONLDObject[], separator: ' / '|' | '): JSONLDObject {
    const bnodeIds = Array.from({ length: items.length }, () => this._getBnode());
    let rtnBnode: JSONLDObject;
    items.forEach((node, idx) => {
      const bnode: JSONLDObject = {
        '@id': bnodeIds[idx],
        [`${RDF}first`]: [{ '@id': this.addPathToShape(propertyShape, node, additions) }]
      };
      if (idx === items.length - 1) {
        bnode[`${RDF}rest`] = [{ '@id': `${RDF}nil` }];
      } else {
        propertyShape.pathString += separator;
        propertyShape.pathHtmlString += separator;
        bnode[`${RDF}rest`] = [{ '@id': bnodeIds[idx + 1] }];
      }
      additions.push(bnode);
      propertyShape.referencedNodeIds.add(bnode['@id']);
      if (idx === 0) {
        rtnBnode = bnode;
      }
    });
    return rtnBnode;
  }

  /**
   * Initializes the {@link ConstraintOption}s for the modal's form. Done here instead of statically somewhere because
   * we need to create the form controls. Could have put it with the variable definition, but would have made the first
   * part of the component definition very verbose...
   */
  private _setConstraintTypes(): void {
    this.constraintTypes = [
      {
        label: 'Class',
        controls: [
          {
            prop: `${SH}class`,
            type: 'autocomplete',
            label: 'Class',
            name: 'class',
            datatype: 'IRI',
            multiple: false,
            pullClasses: true,
            control: this._fb.control('', Validators.required)
          }
        ]
      },
      {
        label: 'Datatype',
        controls: [
          {
            prop: `${SH}datatype`,
            type: 'select',
            label: 'Datatype',
            multiple: false,
            name: 'datatype',
            datatype: 'IRI',
            options: Object.keys(this._sgs.listItem.dataPropertyRange).map(datatype => ({
              value: datatype,
              label: this._sgs.getEntityName(datatype)
            })),
            control: this._fb.control('', Validators.required)
          }
        ]
      },
      {
        label: 'Node Kind', // https://www.w3.org/TR/shacl/#NodeKindConstraintComponent
        controls: [
          {
            prop: `${SH}nodeKind`,
            type: 'select',
            label: 'Node Kind',
            multiple: false,
            name: 'nodeKind',
            datatype: 'IRI',
            options: [
              { value: `${SH}BlankNode`, label: 'Blank Node' },
              { value: `${SH}IRI`, label: 'IRI' },
              { value: `${SH}Literal`, label: 'Literal' },
              { value: `${SH}BlankNodeOrIRI`, label: 'Blank Node or IRI' },
              { value: `${SH}BlankNodeOrLiteral`, label: 'Blank Node or Literal' },
              { value: `${SH}IRIOrLiteral`, label: 'IRI or Literal' }
            ],
            control: this._fb.control('', Validators.required)
          }
        ]
      },
      {
        label: 'Value Range',
        controls: [
          {
            prop: `${SH}minExclusive`,
            type: 'number',
            label: 'Min (Exclusive)',
            name: 'minExclusive',
            multiple: false,
            control: this._fb.control('')
          },
          {
            prop: `${SH}minInclusive`,
            type: 'number',
            label: 'Min (Inclusive)',
            name: 'minInclusive',
            multiple: false,
            control: this._fb.control('')
          },
          {
            prop: `${SH}maxExclusive`,
            type: 'number',
            label: 'Max (Exclusive)',
            name: 'maxExclusive',
            multiple: false,
            control: this._fb.control('')
          },
          {
            prop: `${SH}maxInclusive`,
            type: 'number',
            label: 'Max (Inclusive)',
            name: 'maxInclusive',
            multiple: false,
            control: this._fb.control('')
          }
        ]
      },
      {
        label: 'Count Range',
        controls: [
          {
            prop: `${SH}minCount`,
            type: 'number',
            label: 'Min Count',
            name: 'minCount',
            datatype: `${XSD}integer`,
            min: 0,
            step: 1,
            multiple: false,
            control: this._fb.control('', Validators.pattern('^[-0-9]*$'))
          },
          {
            prop: `${SH}maxCount`,
            type: 'number',
            label: 'Max Count',
            name: 'maxCount',
            datatype: `${XSD}integer`,
            min: 0,
            step: 1,
            multiple: false,
            control: this._fb.control('', Validators.pattern('^[-0-9]*$'))
          }
        ]
      },
      {
        label: 'Pattern',
        controls: [
          {
            prop: `${SH}pattern`,
            type: 'text',
            label: 'Pattern',
            name: 'pattern',
            datatype: `${XSD}string`,
            multiple: false,
            control: this._fb.control('', [Validators.required, regexValidator()])
          },
          {
            prop: `${SH}flags`,
            type: 'select',
            multiple: true,
            label: 'Flags',
            name: 'flags',
            datatype: `${XSD}string`,
            options: [
              {
                value: 'i',
                label: 'i'
              },
              {
                value: 'g',
                label: 'g'
              },
              {
                value: 'm',
                label: 'm'
              },
              {
                value: 's',
                label: 's'
              },
              {
                value: 'u',
                label: 'u'
              },
              {
                value: 'y',
                label: 'y'
              }
            ],
            control: this._fb.control('')
          }
        ]
      },
      {
        label: 'String Length Range',
        controls: [
          {
            prop: `${SH}minLength`,
            type: 'number',
            label: 'Min Length',
            name: 'minLength',
            datatype: `${XSD}integer`,
            min: 0,
            step: 1,
            multiple: false,
            control: this._fb.control('', Validators.pattern('^[-0-9]*$'))
          },
          {
            prop: `${SH}maxLength`,
            type: 'number',
            label: 'Max Length',
            name: 'maxLength',
            datatype: `${XSD}integer`,
            min: 0,
            step: 1,
            multiple: false,
            control: this._fb.control('', Validators.pattern('^[-0-9]*$'))
          }
        ]
      },
      {
        label: 'Language In',
        controls: [
          {
            prop: `${SH}languageIn`,
            type: 'select',
            multiple: true,
            label: 'Language(s)',
            name: 'language',
            datatype: `${XSD}string`,
            options: this._pm.languageList.map(lang => ({
              label: `${lang.label} ${lang.value}`,
              value: lang.value
            })),
            control: this._fb.control('', Validators.required)
          }
        ]
      },
      {
        label: 'Unique Language',
        controls: [
          {
            prop: `${SH}uniqueLang`,
            type: 'select',
            label: 'Unique Language',
            multiple: false,
            name: 'uniqueLang',
            datatype: `${XSD}boolean`,
            options: [
              { value: 'true', label: 'True' },
              { value: 'false', label: 'False' },
            ],
            control: this._fb.control('', Validators.required)
          }
        ]
      },
      {
        label: 'Equals',
        controls: [
          {
            prop: `${SH}equals`,
            type: 'autocomplete',
            label: 'Equals',
            name: 'equals',
            datatype: 'IRI',
            pullClasses: false,
            multiple: true,
            control: this._fb.control('', Validators.required)
          }
        ]
      },
      {
        label: 'Disjoint',
        controls: [
          {
            prop: `${SH}disjoint`,
            type: 'autocomplete',
            label: 'Disjoint',
            name: 'disjoint',
            datatype: 'IRI',
            pullClasses: false,
            multiple: true,
            control: this._fb.control('', Validators.required)
          }
        ]
      },
      {
        label: 'Less Than',
        controls: [
          {
            prop: `${SH}lessThan`,
            type: 'autocomplete',
            label: 'Less Than',
            name: 'lessThan',
            datatype: 'IRI',
            pullClasses: false,
            propertyTypes: ['DatatypeProperty', 'AnnotationProperty'],
            multiple: false,
            control: this._fb.control('', Validators.required)
          }
        ]
      },
      {
        label: 'Less Than or Equals',
        controls: [
          {
            prop: `${SH}lessThanOrEquals`,
            type: 'autocomplete',
            label: 'Less Than or Equals',
            name: 'less than or equals',
            datatype: 'IRI',
            pullClasses: false,
            propertyTypes: ['DatatypeProperty', 'AnnotationProperty'],
            multiple: false,
            control: this._fb.control('', Validators.required)
          }
        ]
      },
      // TODO: At some point, figure out datatype specification for these two (IRI or ints or double, or boolean)
      {
        label: 'Has Value',
        controls: [
          {
            prop: `${SH}hasValue`,
            type: 'text',
            label: 'Value',
            name: 'hasValue',
            multiple: false,
            control: this._fb.control('', Validators.required)
          }
        ]
      },
      {
        label: 'In',
        controls: [
          {
            prop: `${SH}in`,
            type: 'chips',
            label: 'In',
            name: 'in',
            multiple: true,
            control: this._fb.control([], [Validators.required, Validators.minLength(1)])
          }
        ]
      }
    ];
  }
}

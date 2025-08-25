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
import { Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { GroupedSuggestion } from '../../models/grouped-suggestion';
import { OWL } from '../../../prefixes';
import { PathNode } from '../../models/property-shape.interface';
import { ValueOption } from '../../models/value-option.interface';

type Cardinality = 'ZeroOrMore' | 'OneOrMore' | 'ZeroOrOne';

interface CardinalityOption {
  label: string;
  value: Cardinality | 'None'
}

/**
 * @class AddPathNodeModalComponent
 * @requires FormBuilder
 * 
 * A component that creates content for a modal that has a form for creating a new IRI, Inverse, ZeroOrMore, OneOrMore,
 * or ZeroOrOne {@link PathNode} in the provided parent Sequence or Alternative {@link PathNode}. Contains a
 * {@link ShaclSingleSuggestionInputComponent} for selecting the property for the path, a checkbox for Inverse, and
 * cardinality selector for ZeroOrMore, OneOrMore, or ZeroOrOne. The modal will close with either the node generated,
 * if no parent is provided, or the updated parent node. The Inverse checkbox is only displayed for selected object
 * properties. The cardinality options available are also dependant on whether the property is an object property.
 * Meant to be used in conjunction with the `MatDialog` service.
 * 
 * @param {PathNode} parentNode The optional parent Alternative or Sequence PathNode for the new node to be added to
 */
@Component({
  selector: 'app-add-path-node-modal',
  templateUrl: './add-path-node-modal.component.html'
})
export class AddPathNodeModalComponent implements OnInit, OnDestroy {
  private readonly _noneCardinalityOption: CardinalityOption = { label: 'None', value: 'None' };
  private readonly _zeroOrNoneCardinalityOption: CardinalityOption = { label: 'Zero or One', value: 'ZeroOrOne' };
  private readonly _cardinalityOptions: Array<CardinalityOption> = [
    { label: 'Zero or More', value: 'ZeroOrMore' },
    { label: 'One or More', value: 'OneOrMore' },
    this._zeroOrNoneCardinalityOption,
    this._noneCardinalityOption
  ];

  readonly OWL_OBJECT_PROPERTY = `${OWL}ObjectProperty`;

  @ViewChild('autocompleteSpinner', { static: true }) autocompleteSpinner: ElementRef;

  filteredCardinalityOptions: Array<CardinalityOption> = [];

  addPropertyForm: FormGroup = this._fb.group({
    property: ['', [Validators.required]],
    inverse: [false],
    cardinality: ['None']
  });

  propertyOptions$: Observable<GroupedSuggestion[]>;
  selectedProperty: ValueOption;
  private _destroySub$ = new Subject<void>();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { parentNode: PathNode },
    private _dialogRef: MatDialogRef<AddPathNodeModalComponent>,
    private _fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.addPropertyForm.controls['property'].valueChanges.pipe(
      takeUntil(this._destroySub$),
    ).subscribe(value => {
      if (value) {
        this.selectProperty(value);
      }
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
   * Handles when a property is selected in the autocomplete, setting the appropriate cardinality options. Object
   * properties can use all cardinality options, but datatype and annotation properties can only use ZeroOrOne and None.
   * 
   * @param {MatAutocompleteSelectedEvent} event The event from selecting an autocomplete option from the property field
   */
  selectProperty(option: ValueOption): void {
    this.selectedProperty = option;
    if (this.selectedProperty.type !== this.OWL_OBJECT_PROPERTY) {
      this.addPropertyForm.controls['inverse'].setValue(false);
      this.filteredCardinalityOptions = [this._zeroOrNoneCardinalityOption, this._noneCardinalityOption];
      const selectedCardinality: Cardinality | 'None' = this.addPropertyForm.controls['cardinality'].value;
      if (selectedCardinality !== 'ZeroOrOne' && selectedCardinality !== 'None') {
        this.addPropertyForm.controls['cardinality'].setValue('None');
      }
    } else {
      this.filteredCardinalityOptions = this._cardinalityOptions;
    }
  }

  /**
   * Generated a {@link PathNode} from the modal form selections and adds to the parent Sequence or Alternative node if
   * provided. Will generate the necessary hierarchy in cases where the Inverse checkbox or a cardinality option is
   * selected.
   */
  addPathNode(): void {
    const iri: string = this.selectedProperty.value;
    const label: string = this.selectedProperty.label;
    const cardinality: Cardinality | 'None' = this.addPropertyForm.controls['cardinality'].value;
    let pathNode: PathNode = { type: 'IRI', iri, label };
    if (this.addPropertyForm.controls['inverse'].value) {
      pathNode = { type: 'Inverse', path: pathNode };
    }
    switch (cardinality) {
      case 'ZeroOrMore':
        pathNode = { type: 'ZeroOrMore', path: pathNode };
        break;
      case 'OneOrMore':
        pathNode = { type: 'OneOrMore', path: pathNode };
        break;
      case 'ZeroOrOne':
        pathNode = { type: 'ZeroOrOne', path: pathNode };
        break;
    }
    let returnNode: PathNode = pathNode;
    if (this.data.parentNode) {
      if (this.data.parentNode.type === 'Sequence') {
        this.data.parentNode.items.push(pathNode);
        returnNode = this.data.parentNode;
      } else if (this.data.parentNode.type === 'Alternative') {
        this.data.parentNode.items.push(pathNode);
        returnNode = this.data.parentNode;
      }
    }
    this._dialogRef.close(returnNode);
  }
}

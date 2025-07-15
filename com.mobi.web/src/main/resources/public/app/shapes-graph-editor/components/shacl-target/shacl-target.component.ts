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
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatRadioChange } from '@angular/material/radio';
import { MatOptionSelectionChange } from '@angular/material/core';

import { Observable, of, Subject, Subscription } from 'rxjs';
import {
  catchError,
  debounceTime,
  map,
  pairwise,
  startWith,
  switchMap,
  takeUntil,
  tap,
  withLatestFrom
} from 'rxjs/operators';

import { getPropertyId, getPropertyIds, getPropertyValue } from '../../../shared/utility';
import { GroupedSuggestion } from '../../models/grouped-suggestion';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { MultiTargetTypeData, SingleTargetTypeData, TargetTypeData } from '../../models/target-type-data.interface';
import { OWL, RDFS, SH } from '../../../prefixes';
import { PropertyManagerService } from '../../../shared/services/propertyManager.service';
import { REGEX, SHAPES_STORE_TYPE } from '../../../constants';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { SparqlManagerService } from '../../../shared/services/sparqlManager.service';
import { SPARQLSelectResults } from '../../../shared/models/sparqlSelectResults.interface';
import { splitIRI } from '../../../shared/pipes/splitIRI.pipe';
import { ToastService } from '../../../shared/services/toast.service';
import { ValueOption } from '../../models/value-option.interface';
import { VersionedRdfRecord } from '../../../shared/models/versionedRdfRecord.interface';

/**
 * Represents a strategy for targeting nodes in a SHACL NodeShape.
 * Each strategy corresponds to a SHACL core target predicate.
 * 
 * getTargetValue returns the target value for the given node shape.
 * - `string`: for single-value input fields
 * - `ValueOption[]`: for multi-value chip lists
 */
interface TargetStrategy {
  targetIri: string;
  label: string;
  description: string;
  input: {
    label: string;
    multiSelect: boolean;
  };
  getTargetValue: (nodeShape: JSONLDObject) => string | ValueOption[];
}

/**
 * @class shapes-graph-editor.ShaclTargetComponent
 *
 * A component that displays the 'Target' section for a selected SHACL Node Shape.
 * 
 * SHACL Targets define which RDF nodes a given shape applies to. This component presents
 * a collection of readonly radio buttons for the supported SHACL target types.
 * 
 * Reference: https://www.w3.org/TR/shacl/#targets
 * 
 * @param {VersionedRdfRecord} versionedRdfRecord The full versioned RDF record for the shapes graph.
 * @param {JSONLDObject} nodeShape The selected item containing node shape data to display
 * @param {boolean} canModify Indicates whether the user has permission to modify the nodeShape.
 */
@Component({
  selector: 'app-shacl-target',
  templateUrl: './shacl-target.component.html',
  styleUrls: ['./shacl-target.component.scss']
})
export class ShaclTargetComponent implements OnInit, OnChanges, OnDestroy {
  @Input() versionedRdfRecord: VersionedRdfRecord;
  @Input() nodeShape: JSONLDObject;
  @Input() canModify: boolean;

  chipValues: ValueOption[] = [];

  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  readonly IRI_PATTERN = REGEX.IRI;
  readonly TARGET_NODE = `${SH}targetNode`; // https://www.w3.org/TR/shacl/#targetNode
  readonly TARGET_CLASS = `${SH}targetClass`; // https://www.w3.org/TR/shacl/#targetClass
  readonly TARGET_OBJECTS_OF = `${SH}targetObjectsOf`; // https://www.w3.org/TR/shacl/#targetSubjectsOf
  readonly TARGET_SUBJECTS_OF = `${SH}targetSubjectsOf`; // https://www.w3.org/TR/shacl/#targetObjectsOf
  readonly IMPLICIT_REFERENCE = `${SH}implicitTarget`; // https://www.w3.org/TR/shacl/#implicit-targetClass
  readonly targetStrategies: TargetStrategy[] = [
    {
      targetIri: this.TARGET_NODE,
      label: 'Specific Instance',
      description: 'Applies the shape to a specific node IRI',
      input: {
        label: 'Type a Node IRI',
        multiSelect: false
      },
      getTargetValue: (nodeShape): string =>
        getPropertyId(nodeShape, this.TARGET_NODE) ||
        getPropertyValue(nodeShape, this.TARGET_NODE)
    },
    {
      targetIri: this.TARGET_CLASS,
      label: 'Types of Instance',
      description: 'Applies the shape to all nodes of the given type.',
      input: {
        label: 'Select a Type',
        multiSelect: false
      },
      getTargetValue: (nodeShape): string => getPropertyId(nodeShape, this.TARGET_CLASS)
    },
    {
      targetIri: this.TARGET_OBJECTS_OF,
      label: 'Object of',
      description: 'Applies the shape to all nodes that appear as the value of the given property.',
      input: {
        label: 'Select a Property',
        multiSelect: true
      },
      getTargetValue: (nodeShape): ValueOption[] => {
        const propertyOptions: ValueOption[] = [];
        getPropertyIds(nodeShape, this.TARGET_OBJECTS_OF).forEach(iri => (
          propertyOptions.push({
            label: this.stateService.getEntityName(iri),
            value: iri
          })
        ));
        return propertyOptions;
      }
    },
    {
      targetIri: this.TARGET_SUBJECTS_OF,
      label: 'Subject of',
      description: 'Applies the shape to all nodes that have the given predicate set.',
      input: {
        label: 'Select a Property',
        multiSelect: true
      },
      getTargetValue: (nodeShape): ValueOption[] => {
        const propertyOptions: ValueOption[] = [];
        getPropertyIds(nodeShape, this.TARGET_SUBJECTS_OF).forEach(iri => (
          propertyOptions.push({
            label: this.stateService.getEntityName(iri),
            value: iri
          })
        ));
        return propertyOptions;
      }
    },
    {
      targetIri: this.IMPLICIT_REFERENCE,
      label: 'Implicit',
      description: 'Applies the shape to all nodes defined as a type of the Node Shape\'s IRI.',
      input: {
        label: 'Implicit',
        multiSelect: false
      },
      getTargetValue: (nodeShape): string => nodeShape['@id']
    }
  ];
  readonly targetIdx: { [key: string]: TargetStrategy } = this.targetStrategies.reduce((acc, targetStrategy: TargetStrategy) => {
    acc[targetStrategy.targetIri] = targetStrategy;
    return acc;
  }, {});

  private _destroySub$ = new Subject<void>();

  targetForm: FormGroup;
  targetLabel$: Observable<ValueOption>;

  targetValueSuggestions$: Subscription;
  targetValueSuggestions: GroupedSuggestion[] = [];

  editMode = false;

  constructor(
    private _fb: FormBuilder,
    private _sparql: SparqlManagerService,
    private _pm: PropertyManagerService,
    private _toast: ToastService,
    public stateService: ShapesGraphStateService
  ) {
    this.targetForm = this._fb.group({
      target: ['', Validators.required],
      targetValue: [''],
    });
    this.targetForm.disable();
  }

  /**
   * Initializes subscriptions for target value changes and target type selection.
   */
  ngOnInit(): void {
    this._initializeTargetValueSub();
    this._initializeTargetObservable();
  }

  /**
  * Subscribes to changes in the target type and target value fields to provide dynamic autocomplete suggestions.
  */
  private _initializeTargetValueSub() {
    const targetControl = this.targetForm.get('target');
    const targetValueControl = this.targetForm.get('targetValue');
    if (!targetControl || !targetValueControl) {
      return;
    }
    this.targetValueSuggestions$ = this.targetForm.get('targetValue').valueChanges.pipe(
      takeUntil(this._destroySub$),
      debounceTime(300), // limit request frequency.
      withLatestFrom(targetControl.valueChanges.pipe(
        startWith(targetControl.value),
        pairwise(), // Combines the current target type with the latest target value.
        map(([prevTarget, currentTarget]) => ({ prevTarget, currentTarget }))
      )),
      catchError(() => {
        return of([]); // Prevents unsubscription
      }),
      switchMap(([targetValue, { prevTarget, currentTarget }]) => {
        return this._getSuggestionsForTarget(currentTarget, targetValue);
      })
    ).subscribe((suggestions: string[]) => {
      this.targetValueSuggestions = this._groupSuggestionsByOntologyIri(suggestions);
    });
  }

  /**
   * Initializes the `targetLabel$` observable which emits label metadata for the selected target type.
   */
  private _initializeTargetObservable(): void {
    const targetControl = this.targetForm.get('target');
    if (!targetControl) {
      return;
    }
    this.targetLabel$ = targetControl.valueChanges.pipe(
      startWith(targetControl.value),
      tap((target) => {
        this._updateValidatorsForTarget(target);
      }),
      map((target: string): ValueOption => {
        return {
          label: this.targetIdx[target]?.input?.label || '',
          value: target
        };
      })
    );
  }

  /*
   * Resets edit mode and form status. 
   * If a new nodeShape is provided, the form is updated.
   * 
   * @param changes Object containing the changed input properties.
   */
  ngOnChanges(changes: SimpleChanges): void {
    this.editMode = false;
    this.targetForm.disable();
    if (changes.nodeShape?.currentValue) {
      this._updateForm();
    }
  }

  /**
   * Cleans up all subscriptions to avoid memory leaks.
   */
  ngOnDestroy(): void {
    this._destroySub$.next();
    this._destroySub$.complete();
    if (this.targetValueSuggestions$) {
      this.targetValueSuggestions$.unsubscribe();
    }
  }

  /**
   * Puts the form into edit mode, enabling form controls and applying appropriate validators.
   */
  onEdit(): void {
    this.editMode = true;
    this.targetForm.enable();

    const targetControl = this.targetForm.get('target');
    if (!targetControl) {
      return;
    }
    this._updateValidatorsForTarget(targetControl.value);
  }

  /**
   * Exits edit mode, disabling form controls, updates in InProgressCommit
   */
  onSave(): void {
    if (this.targetForm.valid) {
      this.updateInProgressCommit();
      this.editMode = false;
      this.targetForm.disable();
    } else {
      this._toast.createWarningToast('Can not save an invalid form.')
    }
  }

  /**
   * TODO EDIT TICKET
   * placeholder: appropriate triples are added and removed in the InProgressCommit to reflect the change 
   * from the previous Target to the new Target
   */
  updateInProgressCommit(): void {
    // let deletionJson: JSONLDObject;
    // const targetType = this._detectTargetType();
    // if (targetType && targetType.targetType !== this.IMPLICIT_REFERENCE) {
    //   deletionJson = {
    //     '@id': this.nodeShape['@id']
    //   };
    //   deletionJson[targetType.targetType] = this.nodeShape[targetType.targetType];
    // }
    // if (deletionJson) {
    //   this.stateService.addToDeletions(this.versionedRdfRecord.recordId, deletionJson);
    // }

    // const formData = this.targetForm.value;
    // const target = formData['target'];

    // let additionJson: JSONLDObject 
    // if (target) {
    //   additionJson = {
    //     '@id': this.nodeShape['@id']
    //   };
    // }
    // if (additionJson) {
    //   this.stateService.addToAdditions(this.stateService.listItem.versionedRdfRecord.recordId, additionJson);
    // }
    // if (deletionJson || additionJson) {
    //   this.stateService.saveCurrentChanges().subscribe();
    // }
  }

  /**
   * Updates the validators on the `targetValue` control based on the given target type.
   * 
   * @param target The target type.
   */
  private _updateValidatorsForTarget(target: string): void {
    const targetValueControl = this.targetForm.get('targetValue');
    if (!targetValueControl) {
      return;
    }
    if (this.editMode) {
      if (target === this.IMPLICIT_REFERENCE) {
        targetValueControl.disable();
      } else {
        targetValueControl.enable();
      }
    } else {
      targetValueControl.disable();
    }
    if (target === this.TARGET_NODE) {
      targetValueControl.setValidators([
        Validators.required,
        Validators.pattern(this.IRI_PATTERN)
      ]);
    } else {
      targetValueControl.setValidators([Validators.required]);
    }
    targetValueControl.updateValueAndValidity();
  }

  /**
   * Resolves IRIs for a given SHACL target type and search string using appropriate SPARQL queries.
   *
   * @param target The selected SHACL target type (e.g., sh:targetClass, sh:targetSubjectsOf).
   * @param targetValue The current input value used to filter autocomplete results.
   * @returns An observable emitting a list of matching IRIs (as strings), or an empty list for unsupported target types.
   */
  private _getSuggestionsForTarget(target: string, targetValue: string): Observable<string[]> {
    switch (target) {
      case this.TARGET_NODE:
        return of([]);

      case this.TARGET_CLASS:
        return this._fetchIris(this.getClassesQuery(targetValue));

      case this.TARGET_OBJECTS_OF:
        return this._fetchIris(this.getObjectPropertiesQuery(targetValue));

      case this.TARGET_SUBJECTS_OF:
        return this._fetchIris(this.getPropertiesByTypeQuery(targetValue));

      case this.IMPLICIT_REFERENCE:
        return of([]);

      default:
        return of([]); // Unknown type
    }
  }

  /**
   * Returns a display-friendly label for the selected target value. (`displayWith` function)
   * 
   * @param value The raw value from the form control, usually an IRI string.
   * @returns A formatted label for display in the input field.
   * 
   */
  targetValueDisplay(value: string): string {
    const targetControlValue = this.targetForm.get('target')?.value || '';
    const iriBased = [this.TARGET_CLASS, this.TARGET_OBJECTS_OF, this.TARGET_SUBJECTS_OF];
    if (iriBased.includes(targetControlValue)) {
      return value ? this.stateService.getEntityName(value) : '';
    } else {
      return value;
    }
  }

  /**
   * Updates targetForm with values extracted from the node shape.
   */
  private _updateForm(): void {
    const formData: { [key: string]: string } = {};
    const targetType = this._detectTargetType();
    if (targetType) {
      formData['target'] = targetType.targetType;
      if (targetType.multiSelect) {
        this.chipValues = targetType.values as ValueOption[];
        formData['targetValue'] = '';
      } else {
        formData['targetValue'] = (targetType as SingleTargetTypeData).value;
      }
    } else {
      formData['target'] = '';
      formData['targetValue'] = '';
      this.chipValues = [];
    }
    if (formData) {
      this.targetForm.patchValue(formData);
    }
  }

  /**
   * Adds a chip from text input
   */
  addChipFromInput(event: MatChipInputEvent): void {
    const input = event.input;
    // TODO Uncomment block for MP-3199
    // const value = event.value?.trim();
    // if (value && !this.chipValues.includes(value)) {
    //   this.chipValues.push(value);
    // }
    if (input) {
      input.value = '';
    }
    this.targetForm.get('targetValue')?.setValue('');
  }

  /**
   * Adds a chip from autocomplete selection.
   */
  addChip(value: ValueOption, event: MatOptionSelectionChange): void {
    if (event.isUserInput && value && !this.chipValues.some(chipValue => chipValue.value === value.value)) {
      this.chipValues.push(value);
      this.targetForm.get('targetValue')?.setValue('');
    }
  }

  /**
   * Removes a chip by index.
   */
  removeChip(index: number): void {
    if (index >= 0) {
      this.chipValues.splice(index, 1);
    }
  }

  /**
   * Handles changes to the target type radio buttons.
   * Clears the targetValue field to reset the input and ensure relevant suggestions or validations.
   *
   * @param event - The MatRadioChange event containing the selected target type.
   */
  handleTargetChange(event: MatRadioChange): void {
    // const selectedValue = event.value; //TODO Uncomment block for MP-3199
    this.targetForm.patchValue({ targetValue: '' });
  }

  /**
   * Detects the target type of a given JSON-LD node object.
   * 
   * @param nodeShape - The JSON-LD node object to inspect.
   * @returns The detected target type data or `null` if no target type matches.
   */
  private _detectTargetType(): TargetTypeData | null {
    // Detect implicit reference based on type
    const nodeShapeTypes = this.nodeShape['@type'] || [];
    const indirectImplicitReference = nodeShapeTypes.includes(`${OWL}Class`) || nodeShapeTypes.includes(`${RDFS}Class`);
    if (indirectImplicitReference) {
      return {
        multiSelect: false,
        targetType: this.IMPLICIT_REFERENCE,
        value: this.nodeShape['@id'] || ''
      };
    }
    for (const targetStrategy of this.targetStrategies) {
      if (targetStrategy.targetIri in this.nodeShape) {
        const multiSelect = targetStrategy.input.multiSelect;
        if (multiSelect) {
          return {
            multiSelect: true,
            targetType: targetStrategy.targetIri,
            values: targetStrategy.getTargetValue(this.nodeShape)
          } as MultiTargetTypeData;
        } else {
          return {
            multiSelect: false,
            targetType: targetStrategy.targetIri,
            value: targetStrategy.getTargetValue(this.nodeShape)
          } as SingleTargetTypeData;;
        }
      }
    }
    return null; // No target type detected
  }

  /**
   * Executes a SPARQL SELECT query to retrieve IRIs from usage results.
   *
   * @param query The SPARQL query string to execute.
   * @returns An observable of string IRIs extracted from the query results.
   */
  private _fetchIris(query: string): Observable<string[]> {
    return this._sparql.postQuery(query,
      this.versionedRdfRecord.recordId,
      SHAPES_STORE_TYPE,
      this.versionedRdfRecord.branchId,
      this.versionedRdfRecord.commitId,
      true,
      true
    ).pipe(
      map(response => {
        if (!response) {
          return [];
        }
        return (response as SPARQLSelectResults).results.bindings.map(
          binding => binding['iri'].value
        );
      })
    );
  }

  /**
  * Returns a SPARQL query string that selects all distinct OWL classes in the dataset.
  * 
  * @param searchText Optional search string to filter class IRIs
  * @returns {string} SPARQL query for retrieving all `owl:Class` IRIs.
  */
  getClassesQuery(searchText = ''): string {
    const normalizedSearch = searchText.toLowerCase().trim();
    const filter = searchText
      ? `FILTER(CONTAINS(LCASE(STR(?iri)), "${normalizedSearch}"))`
      : '';
    return `
    PREFIX owl: <http://www.w3.org/2002/07/owl#>
    SELECT DISTINCT ?iri WHERE {
      ?iri a owl:Class .
      FILTER(isIRI(?iri))
      ${filter}
    }
    ORDER BY ?iri
    `;
  }

  /**
   * Returns a SPARQL query string that selects all distinct OWL object properties in the dataset.
   * 
   * @param searchText Optional search string to filter property IRIs
   * @returns {string} SPARQL query for retrieving all `owl:ObjectProperty` IRIs.
   */
  getObjectPropertiesQuery(searchText = ''): string {
    const normalizedSearch = searchText.toLowerCase().trim();
    const filter = searchText
      ? `FILTER(CONTAINS(LCASE(STR(?iri)), "${normalizedSearch}"))`
      : '';
    return `
    PREFIX owl: <http://www.w3.org/2002/07/owl#>
    SELECT DISTINCT ?iri WHERE {
      ?iri a owl:ObjectProperty .
      FILTER(isIRI(?iri))
      ${filter}
    }
    ORDER BY ?iri
    `;
  }

  /**
   * Returns a SPARQL query string that selects all distinct OWL properties of specific types.
   * 
   * @param searchText Optional search string to filter property IRIs
   * @returns {string} SPARQL query for retrieving all OWL property IRIs with their types.
   */
  getPropertiesByTypeQuery(searchText = ''): string {
    const normalizedSearch = searchText.toLowerCase().trim();
    const filter = searchText
      ? `FILTER(CONTAINS(LCASE(STR(?iri)), "${normalizedSearch}"))`
      : '';
    return `
      PREFIX owl: <http://www.w3.org/2002/07/owl#>
      SELECT DISTINCT ?iri ?type WHERE {
        ?iri a ?type .
        FILTER (isIRI(?iri))
        VALUES ?type { owl:ObjectProperty owl:DatatypeProperty owl:AnnotationProperty }
        ${filter}
      }
      ORDER BY ?iri
    `;
  }

  /**
   * Groups suggestions by their ontology IRI prefix (as returned by `splitIRI`),
   * sorts the groups alphabetically by ontology IRI, and sorts suggestions in each group by `label`.
   *
   * @param suggestions The list of suggestions to group.
   * @returns A sorted array of groups, each with an `ontologyIri` and its corresponding sorted suggestions.
   */
  private _groupSuggestionsByOntologyIri(iris: string[]): GroupedSuggestion[] {
    // TODO MP-3199
    // TODO better way would be to utilize the IRI lists/maps available on the ListItem.
    // const subjectImportMap = this.stateService.listItem?.subjectImportMap || {};
    const grouped = iris.reduce<Record<string, string[]>>((acc, iri) => {
      const ontologyIri = splitIRI(iri).begin;
      if (!acc[ontologyIri]) {
        acc[ontologyIri] = [];
      }
      acc[ontologyIri].push(iri);
      return acc;
    }, {});
    return Object.keys(grouped)
      .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
      .map(ontologyIri => ({
        label: ontologyIri,
        suggestions: grouped[ontologyIri]
          .map(iri => ({
            label: this.stateService.getEntityName(iri),
            value: iri
          }))
          .sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()))
      }));
  }
}
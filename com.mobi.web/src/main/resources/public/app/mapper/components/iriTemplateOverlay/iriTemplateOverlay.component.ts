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
import { UntypedFormControl, ValidationErrors, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { get } from 'lodash';

import { DELIM } from '../../../prefixes';
import { DelimitedManagerService } from '../../../shared/services/delimitedManager.service';
import { getPropertyValue } from '../../../shared/utility';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { MapperStateService } from '../../../shared/services/mapperState.service';
import { MappingManagerService } from '../../../shared/services/mappingManager.service';
import { REGEX } from '../../../constants';
import { TriggerMentionOption, TriggerConfig, PatternValidationResult } from '../../../shared/components/triggerMentionInput/triggerMentionInput.component';

/**
 * @class IriTemplateOverlayComponent
 *
 * A component that creates content for a modal that changes the IRI template of the
 * {@link MapperStateService#selectedClassMappingId selected class mapping}. The modal contains a single
 * text field that allows users to enter an IRI template with replacement patterns like ${ColumnName} or ${UUID} using
 * the {@link TriggerMentionInputComponent}. The available columns are pulled from the currently loaded delimited file
 * in the {@link DelimitedManagerService} and the dropdown includes a UUID option. An example IRI is shown below the
 * input that updates as the user types, using data from the first row of the delimited file. Validation ensures that
 * all patterns are valid and that the resulting IRI is well-formed. Meant to be used in conjunction with the
 * `MatDialog` service.
 */
@Component({
  selector: 'iri-template-overlay',
  templateUrl: './iriTemplateOverlay.component.html',
  styleUrls: ['./iriTemplateOverlay.component.scss']
})
export class IriTemplateOverlayComponent implements OnInit, OnDestroy {
  classMapping: JSONLDObject;
  templateControl = new UntypedFormControl('', [Validators.required]);
  columnSuggestions: TriggerMentionOption[] = [];
  exampleIri = '';
  isValid = false;

  triggerConfig: TriggerConfig = {
    trigger: '${',
    closingChar: '}'
  };

  // Column mapping for index/name conversion
  private columnMap: Map<number, string> = new Map();
  private nameToIndexMap: Map<string, number> = new Map();
  private destroySub$ = new Subject<void>();

  constructor(
    private _dialogRef: MatDialogRef<IriTemplateOverlayComponent>,
    private _state: MapperStateService,
    private _mm: MappingManagerService,
    private _dm: DelimitedManagerService
  ) {}

  ngOnInit(): void {
    this.classMapping = this._state.selected.mapping.getClassMapping(this._state.selectedClassMappingId);
    this.buildColumnSuggestions();
    this.fillTemplate();
    this.updateExampleIri();  // Initialize example IRI on load
    this.updateValidity();

    // Subscribe to form value changes to update example IRI
    this.templateControl.valueChanges
      .pipe(takeUntil(this.destroySub$))
      .subscribe(() => {
        this.updateExampleIri();
      });
  }

  ngOnDestroy(): void {
    this.destroySub$.next();
    this.destroySub$.complete();
  }

  /**
   * Builds the list of suggestions for the trigger dropdown from the delimited file columns.
   */
  buildColumnSuggestions(): void {
    const firstRowIndex = this._dm.containsHeaders ? 1 : 0;

    // UUID option
    this.columnSuggestions = [{
      displayText: 'UUID',
      insertValue: 'UUID',
      category: 'Special',
      metadata: { preview: '(Auto-generated)' }
    }];

    // Column options
    if (this._dm.dataRows && this._dm.dataRows[0]) {
      for (let idx = 0; idx < this._dm.dataRows[0].length; idx++) {
        const header = this._dm.getHeader(idx);
        const preview = get(this._dm.dataRows, `[${firstRowIndex}][${idx}]`, '(None)');

        this.columnMap.set(idx, header);
        this.nameToIndexMap.set(header.toLowerCase(), idx);

        this.columnSuggestions.push({
          displayText: header,
          insertValue: header, // Insert the column name, convert to index on save
          category: 'Columns',
          metadata: {
            columnIndex: idx,
            preview: preview
          }
        });
      }
    }
  }

  /**
   * Fills the template field from the class mapping's IRI template properties.
   */
  fillTemplate(): void {
    const iriTemplate = getPropertyValue(this.classMapping, `${DELIM}iriTemplate`);

    if (iriTemplate) {
      // Convert column indices to column names for display
      this.templateControl.setValue(this.convertIndicesToNames(iriTemplate));
    } else {
      // Handle legacy properties
      const prefix = getPropertyValue(this.classMapping, `${DELIM}hasPrefix`) || '';
      const localName = getPropertyValue(this.classMapping, `${DELIM}localName`) || '';
      if (prefix || localName) {
        this.templateControl.setValue(this.convertIndicesToNames(prefix + localName));
      }
    }
  }

  /**
   * Validates a pattern's inner value (e.g., "0", "UUID", or "ColumnName").
   * Returns validation result with resolved display name and preview value.
   * Arrow function to preserve `this` context when passed to child component.
   *
   * @param {string} innerValue The inner value of the pattern to validate
   * @returns {PatternValidationResult} The result of the pattern validation
   */
  validatePattern = (innerValue: string): PatternValidationResult => {
    if (innerValue === 'UUID') {
      return {
        isValid: true,
        resolvedName: 'UUID',
        resolvedValue: '(Auto-generated)'
      };
    }

    // Check if it's a numeric index
    const numericIndex = parseInt(innerValue, 10);
    if (!isNaN(numericIndex)) {
      if (this.columnMap.has(numericIndex)) {
        const header = this.columnMap.get(numericIndex);
        const firstRowIndex = this._dm.containsHeaders ? 1 : 0;
        const preview = get(this._dm.dataRows, `[${firstRowIndex}][${numericIndex}]`, '(None)');
        return {
          isValid: true,
          resolvedName: header,
          resolvedValue: preview
        };
      }
      return { isValid: false };
    }

    // Check if it's a column name
    const lowerValue = innerValue.toLowerCase();
    if (this.nameToIndexMap.has(lowerValue)) {
      const idx = this.nameToIndexMap.get(lowerValue);
      const firstRowIndex = this._dm.containsHeaders ? 1 : 0;
      const preview = get(this._dm.dataRows, `[${firstRowIndex}][${idx}]`, '(None)');
      return {
        isValid: true,
        resolvedName: innerValue,
        resolvedValue: preview
      };
    }

    return { isValid: false };
  };

  /**
   * Validates the resolved IRI template by filling in patterns with actual data.
   * and checking if the result is a valid IRI.
   * Arrow function to preserve `this` context when passed to child component.
   *
   * @param {string} template The IRI template to validate
   * @returns {ValidationErrors | null} Validation errors if invalid; otherwise null
   */
  validateResolvedIri = (template: string): ValidationErrors | null => {
    if (!template) {
      return null;
    }

    // Resolve all patterns with actual values
    const resolved = this._resolveTemplate(template);

    // Check if the resolved value is a valid IRI
    if (resolved && !REGEX.IRI.test(resolved)) {
      return { invalidIri: { resolved } };
    }

    return null;
  };

  /**
   * Updates the example IRI display using the first row of data.
   */
  updateExampleIri(): void {
    const template = this.templateControl.value || '';
    this.exampleIri = this._resolveTemplate(template);
    this.updateValidity();
  }

  /**
   * Updates the form validity state.
   */
  updateValidity(): void {
    const template = this.templateControl.value || '';

    // Check for unclosed patterns
    const openCount = (template.match(/\$\{/g) || []).length;
    const closeCount = (template.match(/\}/g) || []).length;
    if (openCount !== closeCount) {
      this.isValid = false;
      return;
    }

    // Check for invalid patterns
    const patternRegex = /\$\{([^}]+)\}/g;
    let match;
    while ((match = patternRegex.exec(template)) !== null) {
      const result = this.validatePattern(match[1]);
      if (!result.isValid) {
        this.isValid = false;
        return;
      }
    }

    // Check if resolved IRI is valid (only if there's content)
    if (template) {
      const resolved = this._resolveTemplate(template);
      if (!REGEX.IRI.test(resolved)) {
        this.isValid = false;
        return;
      }
    }

    this.isValid = template.length > 0;
  }

  /**
   * Converts column indices in patterns to column names for display
   * e.g., ${0} -> ${ColumnName}
   * 
   * @param {string} template The IRI template to convert
   * @returns {string} The converted IRI template
   */
  convertIndicesToNames(template: string): string {
    return template.replace(/\$\{(\d+)\}/g, (match, indexStr) => {
      const index = parseInt(indexStr, 10);
      if (this.columnMap.has(index)) {
        return `\${${this.columnMap.get(index)}}`;
      }
      return match;
    });
  }

  /**
   * Converts column names in patterns to column indices for storage
   * e.g., ${ColumnName} -> ${0}
   * 
   * @param {string} template The IRI template to convert
   * @returns {string} The converted IRI template
   */
  convertNamesToIndices(template: string): string {
    return template.replace(/\$\{([^}]+)\}/g, (match, name) => {
      if (name === 'UUID') {
        return match;
      }

      // Already a number
      if (!isNaN(parseInt(name, 10))) {
        return match;
      }

      // Find column index by name
      const lowerName = name.toLowerCase();
      if (this.nameToIndexMap.has(lowerName)) {
        return `\${${this.nameToIndexMap.get(lowerName)}}`;
      }

      return match; // Keep as-is if not found
    });
  }

  /**
   * Sets the IRI template of the selected class mapping in the selected mapping based on the form value.
   * Converts column names back to indices before saving.
   * Also updates the mapper state to reflect the change. Removes legacy `hasPrefix` and `localName` properties.
   * Closes the dialog after setting the IRI template.
   */
  set(): void {
    const originalTemplate = getPropertyValue(this.classMapping, `${DELIM}iriTemplate`);
    const originalPrefix = getPropertyValue(this.classMapping, `${DELIM}hasPrefix`);
    const originalLocalName = getPropertyValue(this.classMapping, `${DELIM}localName`);

    // Convert column names to indices for storage
    const storageTemplate = this.convertNamesToIndices(this.templateControl.value);

    this._mm.editIriTemplate(this._state.selected.mapping, this._state.selectedClassMappingId, storageTemplate);
    this._state.changeProp(this._state.selectedClassMappingId, `${DELIM}iriTemplate`, storageTemplate, originalTemplate);
    // Clear hasPrefix and localName since iriTemplate is now set
    this._state.changeProp(this._state.selectedClassMappingId, `${DELIM}hasPrefix`, '', originalPrefix);
    this._state.changeProp(this._state.selectedClassMappingId, `${DELIM}localName`, '', originalLocalName);
    this._dialogRef.close();
  }

  /**
   * Cleans a value for use in an IRI by removing whitespace.
   * Arrow function to ensure it's available when called from other arrow function properties.
   *
   * @param {string} value The value to clean
   * @returns {string} The cleaned value
   */
  private _cleanValueForIri = (value: string): string => {
    return (value || '').replace(/\s/g, '');
  };

  /**
   * Resolves the template by replacing patterns with actual values from the first data row.
   * Arrow function to ensure it's available when called from validateResolvedIri during early initialization.
   *
   * @param {string} template The IRI template to resolve
   * @returns {string} The resolved IRI
   */
  private _resolveTemplate = (template: string): string => {
    const firstRowIndex = this._dm.containsHeaders ? 1 : 0;
    let resolved = template;

    // Replace patterns
    resolved = resolved.replace(/\$\{([^}]+)\}/g, (match, innerValue) => {
      if (innerValue === 'UUID') {
        return 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
      }

      // Check if numeric index
      const numericIndex = parseInt(innerValue, 10);
      if (!isNaN(numericIndex) && this.columnMap.has(numericIndex)) {
        const value = get(this._dm.dataRows, `[${firstRowIndex}][${numericIndex}]`, '');
        return this._cleanValueForIri(value);
      }

      // Check if column name
      const lowerValue = innerValue.toLowerCase();
      if (this.nameToIndexMap.has(lowerValue)) {
        const idx = this.nameToIndexMap.get(lowerValue);
        const value = get(this._dm.dataRows, `[${firstRowIndex}][${idx}]`, '');
        return this._cleanValueForIri(value);
      }

      return match; // Keep as-is if not found
    });

    return resolved;
  };
}

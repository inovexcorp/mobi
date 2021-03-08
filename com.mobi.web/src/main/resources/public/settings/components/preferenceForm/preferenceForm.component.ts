/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
// import { forEach, isEqual, filter } from 'lodash';

// import utilService from '../../../shared/services/util.service';

// const template = require('./preferenceForm.component.html');

import * as angular from 'angular';
import { Component, Input, EventEmitter, Output, OnChanges, Inject, OnInit } from '@angular/core';
import { FormControl, FormBuilder, Validators, FormArray, FormGroup } from '@angular/forms';

@Component({
    selector: 'preference-form',
    templateUrl: './preferenceForm.component.html'
})

export class PreferenceFormComponent implements OnChanges {
    @Input() preference;
    @Output() updateEvent = new EventEmitter<{type:string, preference:unknown}>();
    type: string;
    fields;
    values;
    // myFormControl = new FormControl('');
    // // innerFormGroup = this.fb.group({});
    // outerFormGroup = this.fb.group({});
    // // innerFormArray = this.fb.array([]);
    // outerFormArray = this.fb.array([]);
    // innerFormGroup;// = this.fb.group({form: this.innerFormArray})

    // realFormArray = this.fb.array([]);
    // mainFormGroup = this.fb.group({mainArray: this.realFormArray});

    // errorMessage = '';

    // get mainArray(): FormArray {
    //     return this.mainFormGroup.get('mainArray') as FormArray;
    // }

    // constructor(@Inject('utilService') private util, private fb: FormBuilder) {}

    // ngOnChanges(): void {
    //     console.log('hit onChanges');
    //     this.type = this.preference['@id'];
    //     this.fields = this.preference['formFields'];
    //     this.values = this.preference['values'];

    //     this.mainFormGroup = this.fb.group({
    //         mainArray: this.realFormArray
    //     });

    //     // for (let control in this.expArray) {
    //     //     fg[control] = new FormControl(this.expArray[control]);
    //     //     console.log(fg);
    //     //   }

    //     // this.fields.forEach(field => {
            
    //     // });

    //     // this.values.forEach(value => {

    //     // });

    //     // this.outerFormGroup = this.fb.group({
    //     //     outerForm: this.outerFormArray
    //     // });
    //     // this.innerFormGroup = this.fb.group({
    //     //     innerForm: this.fb.array(this.fields.map((field) => [this.values[0][field['http://www.w3.org/ns/shacl#path'][0]['@id']][0]['@value'], Validators.required]))
    //     // });

    //     // this.fields.forEach(field => {
    //     //     const newFormControl = this.fb.control('');
    //     //     if (Object.keys(this.values[0]).length) {
    //     //         const formValue = this.values[0][field['http://www.w3.org/ns/shacl#path'][0]['@id']][0]['@value'];
    //     //         newFormControl.setValue(formValue);
    //     //     }
    //     //     this.innerFormArray.push(newFormControl);
    //     // });


    //     this.values.forEach((value, index) => {
    //         const innerFormGroup = this.fb.group({});
    //         this.fields.forEach(field => {
    //             const formValue = value[field['http://www.w3.org/ns/shacl#path'][0]['@id']][0]['@value'];
    //             const newFormControl = this.fb.control('');
    //             newFormControl.setValue(formValue);
    //             innerFormGroup.addControl(field['@id'], newFormControl);
    //         });
    //         (<FormArray> this.mainFormGroup.controls.mainArray).push(innerFormGroup);
    //     });


        // this.fields.forEach(field => this.innerFormGroup.addControl(field['@id'], this.fb.control('')));
        // this.values.forEach((value, index) => {
        //     let newFormControl = angular.copy(this.innerFormGroup);
        //     value[field['http://www.w3.org/ns/shacl#path'][0]['@id']][0]['@value']
        //     newFormControl.setValue(value);
        //     this.outerFormGroup.addControl(index.toString(), angular.copy(this.innerFormGroup));
        // }
        
          constructor(@Inject('utilService') private util, private fb: FormBuilder) {}
        
          ngOnChanges() {
            this.experiences.setValue([]);
            this.type = this.preference['@id'];
            this.fields = this.preference['formFields'];
            this.values = this.preference['values'];

            if (this.preference['targetClass']) {
                this.createFormForComplexPreference();
            } else {
                this.createFormForSimplePreference();
            }

            console.log('look here not working');
            this.experiences.controls.forEach(exp => {
                console.log(exp.value);
            });
          }

          createFormForComplexPreference() {
            this.values.forEach((value, index) => {
                const fg: any = {};
                const expArray = {};
                this.fields.forEach(field => {
                    expArray[field['http://www.w3.org/ns/shacl#path'][0]['@id']] = value[field['http://www.w3.org/ns/shacl#path'][0]['@id']][0]['@value'];
                });
                for (const control in expArray) {
                    fg[control] = new FormControl(expArray[control]);
                }
                this.experiences.push(new FormGroup(fg));
            });
          }

          createFormForSimplePreference() {
            this.values[0]['http://mobi.com/ontologies/preference#hasDataValue'].forEach((value, index) => {
                const fg: any = {};
                const expArray = {};
                this.fields.forEach(field => {
                    expArray[field['http://www.w3.org/ns/shacl#path'][0]['@id']] = value['@value'];
                });
                for (const control in expArray) {
                    fg[control] = new FormControl(expArray[control]);
                }
                this.experiences.push(new FormGroup(fg));
            });
          }
        
          form = new FormGroup({
            cities: new FormArray([new FormControl("SF"), new FormControl("NY")]),
            experiences: new FormArray([])
          });
        
          get cities(): FormArray {
            return this.form.get("cities") as FormArray;
          }
        
          get experiences(): FormArray {
            return this.form.get("experiences") as FormArray;
          }
        
          addCity() {
            this.cities.push(new FormControl());
          }

          addValue() {
              this.experiences.push(new FormControl());
          }
        
          onSubmit() {
            if (this.preference.targetClass) {
                this.experiences.value.forEach((value, index) => {
                    Object.keys(value).forEach(field => {
                        this.preference['values'][index][field] = [{'@value': value[field]}];
                    });
                });
            } else {
                this.preference.values[0]['http://mobi.com/ontologies/preference#hasDataValue'] = [];
                this.experiences.value.forEach((value) => {
                    this.preference.values[0]['http://mobi.com/ontologies/preference#hasDataValue'].push({'@value': value['http://mobi.com/ontologies/preference#hasDataValue']});
                });
            }
            this.updateEvent.emit({type: this.type, preference: this.preference});
          }

          setPreset() {
            this.cities.patchValue(["LA", "MTV"]);
          }

        //   deletePreference() {

        //   }
    }

    // addGroup(): void {
    //     // const innerFormGroup = this.fb.group({});
    //     this.fields.forEach(field => {
    //         const newFormControl = this.fb.control('');
    //         this.innerFormGroup.innerFormArray.push(newFormControl);
    //         // innerFormGroup.addControl(field['@id'], newFormControl);
    //     });
    //     // this.outerFormGroup.addControl(Object.keys(this.outerFormGroup).length.toString(), innerFormGroup);
    // }

    // update() {
    //     // this.field
    //     // this.innerFormGroup.controls.innerFormArray = 
    //     // this.fields.forEach(field => {
    //     //     this.values[0][field['http://www.w3.org/ns/shacl#path'][0]['@id']][0]['@value'] =
    //     // });
    //     // this.values[0]
    //     this.updateEvent.emit({type: this.type, preference: this.preference});
    // }

// /**
//  * @ngdoc component
//  * @name settings.component:preferencesTab
//  * @requires shared.service:settingsManagerService
//  *
//  * @description
//  * `preferencesTab` is a component that creates a Bootstrap `row` with a {@link shared.component:block block} containing
//  * a form allowing the current user to change their display preferences. The preferences are displayed using a
//  * {@link settings.component:preferencesContainer preferencesContainer} and several
//  * {@link settings.component:customPreference customPreference}.
//  */
// const preferenceFormComponent = {
//     template,
//     bindings: {
//         preference: '<',
//         updateEvent: '&'
//     },
//     controllerAs: 'dvm',
//     controller: preferenceFormComponentCtrl
// };

// preferenceFormComponentCtrl.$inject = ['utilService', 'preferenceManagerService', 'settingsManagerService'];

// function preferenceFormComponentCtrl(utilService, preferenceManagerService) {
//     const dvm = this;
//     const pm = preferenceManagerService;
//     dvm.util = utilService;
//     dvm.$onChanges = function() {
//         console.log('hit onChanges');
//         dvm.type = dvm.preference['@id'];
//         dvm.fields = dvm.preference['formFields'];
//         dvm.values = dvm.preference['values'];
//     };
//     dvm.update = function() {
//         dvm.updateEvent({type: dvm.type, preference: dvm.preference});
//     };
//     dvm.addFormFields = function() {
//         dvm.values.push({});
//     }
// }

// export default preferenceFormComponent;
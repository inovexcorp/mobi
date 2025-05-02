import {ValidatorFn} from '@angular/forms';

export interface EditIriOverlayData {
  iriBegin: string
  iriThen: string
  iriEnd: string
  validator?: ValidatorFn
  validatorMsg?: string
  validatorKey?: string
}

import { Component, OnInit, Input } from '@angular/core';

import { Router, ActivatedRoute } from '@angular/router';

import { FormBuilder, FormGroup, FormControl, FormArray, NgForm } from '@angular/forms';

import { MasterdataService, NurseService, DoctorService } from '../../../../shared/services';

import { GeneralUtils } from '../../../../shared/utility';

import { ConfirmationService } from "../../../../../core/services/confirmation.service";
import { HttpServiceService } from 'app/app-modules/core/services/http-service.service';
import { SetLanguageComponent } from 'app/app-modules/core/components/set-language.component';

@Component({
  selector: 'app-general-opd-diagnosis',
  templateUrl: './general-opd-diagnosis.component.html',
  styleUrls: ['./general-opd-diagnosis.component.css']
})
export class GeneralOpdDiagnosisComponent implements OnInit {

  utils = new GeneralUtils(this.fb);

  @Input('generalDiagnosisForm')
  generalDiagnosisForm: FormGroup;

  @Input('caseRecordMode')
  caseRecordMode: string;
  current_language_set: any;
  designation: any;
  specialist:boolean;
  constructor(
    private fb: FormBuilder,
    public httpServiceService: HttpServiceService,
    private nurseService: NurseService,
    private doctorService: DoctorService,
    private masterdataService: MasterdataService,
    private confirmationService: ConfirmationService) { }

  ngOnInit() {
    this.assignSelectedLanguage();
    // this.httpServiceService.currentLangugae$.subscribe(response =>this.current_language_set = response);
    this.designation = localStorage.getItem("designation");
     if (this.designation == "TC Specialist") {
       this.generalDiagnosisForm.controls['instruction'].enable();
       this.specialist = true;
     } else {
       this.generalDiagnosisForm.controls['instruction'].disable();
       this.specialist = false;
     }
   }

   ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
    }
    
   get specialistDaignosis() {
    return this.generalDiagnosisForm.get("instruction");
  }

  ngOnChanges() {
    if (this.caseRecordMode == 'view') {
      let beneficiaryRegID = localStorage.getItem('beneficiaryRegID');
      let visitID = localStorage.getItem('visitID');
      let visitCategory = localStorage.getItem('visitCategory');

      if(localStorage.getItem("referredVisitCode") == "undefined" || localStorage.getItem("referredVisitCode") == null)
      {
      this.getDiagnosisDetails(beneficiaryRegID, visitID, visitCategory);
      }
      else
        if(parseInt(localStorage.getItem("specialist_flag")) == 3){
        this.getMMUDiagnosisDetails(beneficiaryRegID, visitID, visitCategory,localStorage.getItem("visitCode"));
        }
      else
      {
        this.getMMUDiagnosisDetails(beneficiaryRegID, localStorage.getItem("referredVisitID"), visitCategory,localStorage.getItem("referredVisitCode"));
      }
    }
  }

  diagnosisSubscription: any;
  getDiagnosisDetails(beneficiaryRegID, visitID, visitCategory) {
    this.diagnosisSubscription = this.doctorService.getCaseRecordAndReferDetails(beneficiaryRegID, visitID, visitCategory)
      .subscribe(res => {
        if (res && res.statusCode == 200 && res.data && res.data.diagnosis) {
          this.generalDiagnosisForm.patchValue(res.data.diagnosis)
          if (res.data.diagnosis.provisionalDiagnosisList) {
            this.patchDiagnosisDetails(res.data.diagnosis.provisionalDiagnosisList);
          }
        }
      })
  }


  MMUdiagnosisSubscription:any;
  getMMUDiagnosisDetails(beneficiaryRegID, visitID, visitCategory,visitCode) {
    this.MMUdiagnosisSubscription = this.doctorService.getMMUCaseRecordAndReferDetails(beneficiaryRegID, visitID, visitCategory,visitCode)
    .subscribe(res => {
      if (res && res.statusCode == 200 && res.data && res.data.diagnosis) {
        this.generalDiagnosisForm.patchValue(res.data.diagnosis)
        if (res.data.diagnosis.provisionalDiagnosisList) {
          this.patchDiagnosisDetails(res.data.diagnosis.provisionalDiagnosisList);
        }
      }
    })

         
   
  }


  // MMUdiagnosisSubscription:any;
  // getMMUDiagnosisDetails(beneficiaryRegID, visitID, visitCategory) {
  //   this.diagnosisSubscription = this.doctorService.getMMUCaseRecordAndReferDetails(beneficiaryRegID, visitID, visitCategory,localStorage.getItem("visitCode"))
  //     .subscribe(res => {
  //       if (res && res.statusCode == 200 && res.data && res.data.diagnosis) {
  //         this.generalDiagnosisForm.patchValue(res.data.diagnosis)
  //         let diagnosisRes;
  //         if(res.data.diagnosis.provisionalDiagnosisList)
  //         {
  //         diagnosisRes = res.data.diagnosis.provisionalDiagnosisList;
  //         }
  //         else{
  //           diagnosisRes=[];
  //         }
  //         this.MMUdiagnosisSubscription = this.doctorService.getMMUCaseRecordAndReferDetails(beneficiaryRegID, localStorage.getItem("referredVisitID"), visitCategory,localStorage.getItem("referredVisitCode"))
  //         .subscribe(response => {

  //           if (response && response.statusCode == 200 && response.data && response.data.diagnosis) {
  //             let diagnosisResponse;
  //             if(response.data.diagnosis.provisionalDiagnosisList)
  //             {
  //           diagnosisResponse = response.data.diagnosis.provisionalDiagnosisList;
  //             }
  //             else{
  //               diagnosisResponse=[];
  //             }

  //             for(let i=0,j=diagnosisRes.length;i<diagnosisResponse.length;i++,j++)
  //             {
  //               diagnosisRes[j]=diagnosisResponse[i];
  //             }

  //             this.patchDiagnosisDetails(diagnosisRes);
  //           }
              
            

  //         })

         
  //       }
  //     })
  // }


  patchDiagnosisDetails(provisionalDiagnosis) {
    let savedDiagnosisData = provisionalDiagnosis;
    let diagnosisArrayList = this.generalDiagnosisForm.controls['provisionalDiagnosisList'] as FormArray;
    console.log("from diagnosis" + provisionalDiagnosis[0].term );
    if(provisionalDiagnosis[0].term != "" && provisionalDiagnosis[0].conceptID != "")
    {
      console.log("from diagnosis second" + provisionalDiagnosis[0].term );
      
      for (let i = 0; i < savedDiagnosisData.length; i++) {

        diagnosisArrayList.at(i).patchValue({
          "viewProvisionalDiagnosisProvided": savedDiagnosisData[i].term,
          "term": savedDiagnosisData[i].term,
          "conceptID": savedDiagnosisData[i].conceptID
        });
        (<FormGroup>diagnosisArrayList.at(i)).controls['viewProvisionalDiagnosisProvided'].disable();
        if (diagnosisArrayList.length < savedDiagnosisData.length)
          this.addDiagnosis();
      }
    }
  }

  addDiagnosis() {
    let diagnosisArrayList = this.generalDiagnosisForm.controls['provisionalDiagnosisList'] as FormArray;
    if (diagnosisArrayList.length <= 29) {
      diagnosisArrayList.push(this.utils.initProvisionalDiagnosisList());
    } else {
      this.confirmationService.alert(this.current_language_set.alerts.info.maxDiagnosis);
    }
  }
  removeDiagnosisFromList(index, diagnosisListForm?: FormGroup) {
    let diagnosisListArray = this.generalDiagnosisForm.controls['provisionalDiagnosisList'] as FormArray;
    if (diagnosisListArray.at(index).valid) {
      this.confirmationService.confirm(`warn`, this.current_language_set.alerts.info.warn).subscribe(result => {
        if (result) {
          let diagnosisListArray = this.generalDiagnosisForm.controls['provisionalDiagnosisList'] as FormArray;
          if (diagnosisListArray.length > 1) {
            diagnosisListArray.removeAt(index);
          }
          else {
            diagnosisListForm.reset();
            diagnosisListForm.controls['viewProvisionalDiagnosisProvided'].enable();
          }
          this.generalDiagnosisForm.markAsDirty();
        }
      });
    } else {
      if (diagnosisListArray.length > 1) {
        diagnosisListArray.removeAt(index);
      }
      else {
        diagnosisListForm.reset();
        diagnosisListForm.controls['viewProvisionalDiagnosisProvided'].enable();
      }
    }

  }
  checkProvisionalDiagnosisValidity(provisionalDiagnosis) {
    let temp = provisionalDiagnosis.value;
    if (temp.term && temp.conceptID) {
      return false;
    } else {
      return true;
    }
  }
}

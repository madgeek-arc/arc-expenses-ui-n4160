import { analiftheiYpoxrewsiDesc, checkFeasibilityDesc, checkLegalityDesc, checkNecessityDesc, checkRegularityDesc,
         commentDesc, fundsAvailableDesc, loanDesc, loanSourceDesc, FieldDescription, stageTitles } from './stageDescriptions';
import { Type } from '@angular/core';
import {
    Stage10Component, Stage11Component, Stage12Component, Stage13Component, Stage2Component,
    Stage3Component, Stage4Component, Stage5aComponent, Stage5bComponent, Stage6Component, Stage7aComponent,
    Stage7Component, Stage8Component, Stage9Component
} from '../request-stage/stages-components';
import { Stage10, Stage11, Stage12, Stage13, Stage2, Stage3, Stage4, Stage5a,
         Stage5b, Stage6, Stage7, Stage7a, Stage8, Stage9 } from './operation';


/* Map of the displayed messages according to the stage's outcome (if submitted) */
export class SubmittedStageResultMap {
    '2': string;    // message if the stage was approved
    '3': string;    // message if the stage was rejected
    '4': string;    // message if the stage was returned to the previous one

    constructor(str2: string, str3: string, str4: string) {
        this['2'] = str2;
        this['3'] = str3;
        this['4'] = str4;
    }
}

/* Information describing a stage */
export class StageInfo {
    title: string;                                      // a title
    prev: string[];                                     // list with the id(s) of the previous stage(s)
    next: string[];                                     // list with the id(s) of the next stage(s)
    stageComponent: Type<any>;                          // the stage-component that corresponds to the stage
    stageFields: FieldDescription [];                   // a list of the stage's fields descriptions
    submittedStageResultMap: SubmittedStageResultMap;   // a map with the displayed text according to a submitted stage's status
    showStage: number;                                  // a numeric code indicating if and how the stage should be displayed in the page

    constructor(title: string,
                prev: string[],
                next: string[],
                stageComponent: Type<any>,
                stageFields: FieldDescription [],
                submittedStageResultMap: SubmittedStageResultMap) {

        this.title = title;
        this.prev = prev;
        this.next = next;
        this.stageComponent = stageComponent;
        this.stageFields = stageFields;
        this.submittedStageResultMap = submittedStageResultMap;
    }
}

export class RequestInfo {

    phaseId: string;
    requestId: string;

    requestedAmount: string;
    supplier: string;

    finalAmount: string;

    previousStage: string;

    '2': StageInfo;
    '3': StageInfo;
    '4': StageInfo;
    '5a': StageInfo;
    '5b': StageInfo;
    '6': StageInfo;
    '7': StageInfo;
    '7a': StageInfo;
    '8': StageInfo;
    '9': StageInfo;
    '10': StageInfo;
    '11': StageInfo;
    '12': StageInfo;
    '13': StageInfo;

    constructor(phaseId: string, requestId: string) {

        this.phaseId = phaseId;
        this.requestId = requestId;
        this.initiateStagesInfo();

    }

    initiateStagesInfo() {
        this['2'] = new StageInfo(
            stageTitles['2'],
            ['1'],
            ['3'],
            Stage2Component,
            [checkNecessityDesc, checkFeasibilityDesc, commentDesc],
            new SubmittedStageResultMap(
                'Εγκρίθηκε από τον επιστημονικό υπεύθυνο',
                'Απορρίφθηκε από τον επιστημονικό υπεύθυνο',
                'Επεστράφη στο προηγούμενο στάδιο από τον επιστημονικό υπεύθυνο'
            )
        );

        this['3'] = new StageInfo(
            stageTitles['3'],
            ['2'],
            ['4'],
            Stage3Component,
            [analiftheiYpoxrewsiDesc, fundsAvailableDesc, loanDesc, loanSourceDesc, commentDesc],
            new SubmittedStageResultMap(
                'Εγκρίθηκε από τον χειριστή του προγράμματος',
                'Απορρίφθηκε από τον χειριστή του προγράμματος',
                'Επεστράφη στο προηγούμενο στάδιο από τον χειριστή του προγράμματος'
            )
        );

        this['4'] = new StageInfo(
            stageTitles['4'],
            ['3'],
            ['5a', '5b', '6'],
            Stage4Component,
            [analiftheiYpoxrewsiDesc, fundsAvailableDesc, commentDesc],
            new SubmittedStageResultMap(
                'Εγκρίθηκε από τον Προϊστάμενο Οικονομικών Υπηρεσιών',
                'Απορρίφθηκε από τον Προϊστάμενο Οικονομικών Υπηρεσιών',
                'Επεστράφη στο προηγούμενο στάδιο από τον Προϊστάμενο Οικονομικών Υπηρεσιών'
            )
        );

        this['5a'] = new StageInfo(
            stageTitles['5a'],
            ['4'],
            ['5b', '6'],
            Stage5aComponent,
            [commentDesc],
            new SubmittedStageResultMap(
                'Εγκρίθηκε από τον Διατάκτη',
                'Απορρίφθηκε από τον Διατάκτη',
                'Επεστράφη στο προηγούμενο στάδιο από τον Διατάκτη'
            )
        );

        this['5b'] = new StageInfo(
            stageTitles['5b'],
            ['5a', '4'],
            ['6'],
            Stage5bComponent,
            [commentDesc],
            new SubmittedStageResultMap(
                'Εγκρίθηκε από το Διοικητικό Συμβούλιο',
                'Απορρίφθηκε από το Διοικητικό Συμβούλιο',
                'Επεστράφη στο προηγούμενο στάδιο από το Διοικητικό Συμβούλιο'
            )
        );

        this['6'] = new StageInfo(
            stageTitles['6'],
            ['5b', '5a', '4'],
            [],
            Stage6Component,
            [commentDesc],
            new SubmittedStageResultMap(
                'Αναρτήθηκε στην ΔΙΑΥΓΕΙΑ',
                'Απορρίφθηκε πριν αναρτηθεί στην ΔΙΑΥΓΕΙΑ',
                'Επεστράφη στο προηγούμενο στάδιο πριν αναρτηθεί στην ΔΙΑΥΓΕΙΑ'
            )
        );

        this['7'] = new StageInfo(
            stageTitles['7'],
            [],
            ['7a', '8'],
            Stage7Component,
            [commentDesc],
            new SubmittedStageResultMap(
                'Καταχωρήθηκε το συνοδεύτικό υλικό',
                'Απορρίφθηκε',
                'Επεστράφη στο προηγούμενο στάδιο'
            )
        );

        this['7a'] = new StageInfo(
            stageTitles['7a'],
            ['7'],
            ['8'],
            Stage7aComponent,
            [commentDesc],
            new SubmittedStageResultMap(
                'Εγκρίθηκε από το Διοικητικό Συμβούλιο',
                'Απορρίφθηκε από το Διοικητικό Συμβούλιο',
                'Επεστράφη στο προηγούμενο στάδιο από το Διοικητικό Συμβούλιο'
            )
        );

        this['8'] = new StageInfo(
            stageTitles['8'],
            ['7a', '7'],
            ['9'],
            Stage8Component,
            [checkRegularityDesc, checkLegalityDesc, commentDesc],
            new SubmittedStageResultMap(
                'Εγκρίθηκε από την Ομάδα Ελέγχου',
                'Απορρίφθηκε από την Ομάδα Ελέγχου',
                'Επεστράφη στο προηγούμενο στάδιο από την Ομάδα Ελέγχου'
            )
        );

        this['9'] = new StageInfo(
            stageTitles['9'],
            ['8'],
            ['10'],
            Stage9Component,
            [checkRegularityDesc, checkLegalityDesc, commentDesc],
            new SubmittedStageResultMap(
                'Εγκρίθηκε από τον Προϊστάμενο Οικονομικών Υπηρεσιών',
                'Απορρίφθηκε από τον Προϊστάμενο Οικονομικών Υπηρεσιών',
                'Επεστράφη στο προηγούμενο στάδιο από τον Προϊστάμενο Οικονομικών Υπηρεσιών'
            )
        );

        this['10'] = new StageInfo(
            stageTitles['10'],
            ['9'],
            ['11'],
            Stage10Component,
            [commentDesc],
            new SubmittedStageResultMap(
                'Εγκρίθηκε από τον Διατάκτη',
                'Απορρίφθηκε από τον Διατάκτη',
                'Επεστράφη στο προηγούμενο στάδιο από τον Διατάκτη'
            )
        );

        this['11'] = new StageInfo(
            stageTitles['11'],
            ['10'],
            ['12'],
            Stage11Component,
            [commentDesc],
            new SubmittedStageResultMap(
                'Αναρτήθηκε στην ΔΙΑΥΓΕΙΑ',
                'Απορρίφθηκε πριν αναρτηθεί στην ΔΙΑΥΓΕΙΑ',
                'Επεστράφη στο προηγούμενο στάδιο πριν αναρτηθεί στην ΔΙΑΥΓΕΙΑ'
            )
        );

        this['12'] = new StageInfo(
            stageTitles['12'],
            ['11'],
            ['13'],
            Stage12Component,
            [commentDesc],
            new SubmittedStageResultMap(
                'Εγκρίθηκε από τον Υπεύθυνο Λογιστικής Καταχώρησης',
                'Απορρίφθηκε από τον Υπεύθυνο Λογιστικής Καταχώρησης',
                'Επεστράφη στο προηγούμενο στάδιο από τον Υπεύθυνο Λογιστικής Καταχώρησης'
            )
        );

        this['13'] = new StageInfo(
            stageTitles['13'],
            ['12'],
            [],
            Stage13Component,
            [commentDesc],
            new SubmittedStageResultMap(
                'Εγκρίθηκε από τον Υπεύθυνο Πληρωμών',
                'Απορρίφθηκε από τον Υπεύθυνο Πληρωμών',
                'Επεστράφη στο προηγούμενο στάδιο από τον Υπεύθυνο Πληρωμών'
            )
        );


    }

    createNewStageObject(stageid: string) {
        switch (stageid) {
            case '2':
                return new Stage2();
            case '3':
                return new Stage3();
            case '4':
                return new Stage4();
            case '5a':
                return new Stage5a();
            case '5b':
                return new Stage5b();
            case '6':
                return new Stage6();
            case '7':
                return new Stage7();
            case '7a':
                return new Stage7a();
            case '8':
                return new Stage8();
            case '9':
                return new Stage9();
            case '10':
                return new Stage10();
            case '11':
                return new Stage11();
            case '12':
                return new Stage12();
            case '13':
                return new Stage13();
            default:
                return null;
        }

    }

}

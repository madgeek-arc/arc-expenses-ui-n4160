// Generated using typescript-generator version 2.1.406 on 2019-02-27 14:27:04.

export class Executive {
    firstname: string;
    lastname: string;
    email: string;
}

export class RequestResponse {
    baseInfo: BaseInfo;
    requesterPosition: RequesterPosition;
    type: Type;
    requestStatus: RequestStatus;
    stages: { [index: string]: Stage };
    projectAcronym: string;
    instituteName: string;
    requesterFullName: string;
    requesterEmail: string;
    onBehalfFullName: string;
    onBehalfEmail: string;
    tripDestination: string;
    canEdit: boolean;
    canEditPrevious: boolean;
}

export class RequestSummary {
    baseInfo: BaseInfo;
    requestType: string;
    projectAcronym: string;
    instituteName: string;
    requestFullName: string;
    canEdit: boolean;
}

export class Vocabulary {
    projectID: string;
    projectAcronym: string;
    instituteId: string;
    instituteName: string;
}

export class Attachment {
    filename: string;
    mimetype: string;
    size: number;
    url: string;
}


export class BaseInfo {
    id: string;
    requestId: string;
    creationDate: number;
    stage: string;
    status: Status;
}

export class ContactUsMail {
    name: string;
    surname: string;
    email: string;
    subject: string;
    message: string;
}

export class Delegate {
    email: string;
    firstname: string;
    lastname: string;
    hidden: boolean;
}

export class Institute {
    id: string;
    name: string;
    organizationId: string;
    director: PersonOfInterest;
    accountingRegistration: PersonOfInterest;
    accountingPayment: PersonOfInterest;
    accountingDirector: PersonOfInterest;
    diaugeia: PersonOfInterest;
    suppliesOffice: PersonOfInterest;
    travelManager: PersonOfInterest;
    diataktis: PersonOfInterest;
}

export class Organization {
    id: string;
    name: string;
    poy: PersonOfInterest;
    director: PersonOfInterest;
    viceDirector: PersonOfInterest;
    inspectionTeam: PersonOfInterest[];
    dioikitikoSumvoulio: PersonOfInterest;
}

export class PersonOfInterest {
    email: string;
    firstname: string;
    lastname: string;
    delegates: Delegate[];
}

export class Project {
    id: string;
    name: string;
    acronym: string;
    instituteId: string;
    parentProject: string;
    scientificCoordinator: PersonOfInterest;
    operator: PersonOfInterest[];
    startDate: string;
    endDate: string;
    totalCost: number;
    scientificCoordinatorAsDiataktis: boolean;
}

export class Request {
    currentStage: string;
    id: string;
    type: Type;
    archiveId: string;
    finalAmount: number;
    paymentCycles: number;
    projectId: string;
    user: User;
    onBehalfOf: PersonOfInterest;
    diataktis: PersonOfInterest;
    requesterPosition: RequesterPosition;
    requestStatus: RequestStatus;
    pois: string[];
    trip: Trip;
}

export class RequestApproval extends BaseInfo {
    currentStage: string;
    stage1: Stage1;
    stage2: Stage2;
    stage3: Stage3;
    stage4: Stage4;
    stage5a: Stage5a;
    stage5b: Stage5b;
    stage6: Stage6;
}

export class RequestPayment extends BaseInfo {
    currentStage: string;
    stage7: Stage7;
    stage7a: Stage7a;
    stage8: Stage8;
    stage9: Stage9;
    stage10: Stage10;
    stage11: Stage11;
    stage12: Stage12;
    stage13: Stage13;
}

export class Stage {
    type: string;
    user: User;
    date: number;
    comment: string;
    attachments: Attachment[];
}

export class Stage1 extends Stage {
    requestDate: string;
    subject: string;
    supplier: string;
    supplierSelectionMethod: SupplierSelectionMethod;
    amountInEuros: number;
    finalAmount: number;
}

export class Stage10 extends Stage {
    approved: boolean;
}

export class Stage11 extends Stage {
}

export class Stage12 extends Stage {
    approved: boolean;
}

export class Stage13 extends Stage {
    approved: boolean;
}

export class Stage2 extends Stage {
    checkFeasibility: boolean;
    checkNecessity: boolean;
    approved: boolean;
}

export class Stage3 extends Stage {
    analiftheiYpoxrewsi: boolean;
    fundsAvailable: boolean;
    loan: boolean;
    loanSource: string;
    approved: boolean;
}

export class Stage4 extends Stage {
    analiftheiYpoxrewsi: boolean;
    fundsAvailable: boolean;
    approved: boolean;
}

export class Stage5a extends Stage {
    approved: boolean;
}

export class Stage5b extends Stage {
    approved: boolean;
}

export class Stage6 extends Stage {
}

export class Stage7 extends Stage {
    approved: boolean;
}

export class Stage7a extends Stage {
    approved: boolean;
}

export class Stage8 extends Stage {
    checkRegularity: boolean;
    checkLegality: boolean;
    approved: boolean;
}

export class Stage9 extends Stage {
    checkRegularity: boolean;
    checkLegality: boolean;
    approved: boolean;
}

export class Trip {
    firstname: string;
    lastname: string;
    email: string;
    destination: string;
}

export class User {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
    firstnameLatin: string;
    lastnameLatin: string;
    receiveEmails: string;
    immediateEmails: string;
}

export type Type = 'REGULAR' | 'CONTRACT' | 'SERVICES_CONTRACT' | 'TRIP';

export type RequesterPosition = 'RESEARCHER' | 'COLLABORATIVE_RESEARCHER' | 'ADMINISTRATIVE';

export type RequestStatus = 'CANCELLED' | 'PENDING' | 'ACCEPTED' | 'REJECTED';

export type Status = 'CANCELLED' | 'PENDING' | 'ACCEPTED' | 'UNDER_REVIEW' | 'REJECTED';

export type SupplierSelectionMethod = 'DIRECT' | 'MARKET_RESEARCH' | 'AWARD_PROCEDURE';

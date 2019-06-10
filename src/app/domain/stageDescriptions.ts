/* shared constants */

export const requestTypes = {REGULAR: 'Προμήθεια', TRIP: 'Ταξίδι', CONTRACT: 'Σύμβαση έργου', SERVICES_CONTRACT: 'Σύμβαση υπηρεσίας'};

export const requesterPositions = {RESEARCHER: 'Ερευνητής-ΕΛΕ',
                                   COLLABORATIVE_RESEARCHER: 'Συνεργαζόμενος Ερευνητής',
                                   ADMINISTRATIVE: 'Διοικητικό-Τεχνικό-Βοηθητικό Προσωπικό'};

export const statesList = ['accepted', 'pending', 'under_review', 'rejected', 'cancelled'];
export const statusNamesMap = {
    PENDING: 'βρίσκεται σε εξέλιξη',
    UNDER_REVIEW: 'βρίσκεται σε εξέλιξη',
    REJECTED: 'έχει απορριφθεί',
    ACCEPTED: 'έχει ολοκληρωθεί',
    CANCELLED: 'έχει ακυρωθεί'
};

export const supplierSelectionMethods = ['Απ\' ευθείας ανάθεση', 'Έρευνα αγοράς', 'Διαγωνισμός'];
export const supplierSelectionMethodsMap = {
    DIRECT: 'Απ\' ευθείας ανάθεση', MARKET_RESEARCH: 'Έρευνα αγοράς', AWARD_PROCEDURE: 'Διαγωνισμός' };

/* field descriptions for the stages forms */
export class FieldDescription {
    id: string;
    label: string;
    type: string;
    description: string;
    required: boolean;
}

export const commentDesc = {
    id: 'comment',
    label: 'Σχόλια',
    type: 'textarea',
    description: '',
    required: true
};

export const fundsAvailableDesc = {
    id: 'fundsAvailable',
    label: 'Υπάρχει διαθέσιμη πίστωση',
    type: 'checkbox',
    description: '',
    required: true
};

export const analiftheiYpoxrewsiDesc = {
    id: 'analiftheiYpoxrewsi',
    label: 'Έχει αναληφθεί η υποχρέωση',
    type: 'checkbox',
    description: '',
    required: true
};

export const checkRegularityDesc = {
    id: 'checkRegularity',
    label: 'Έγινε έλεγχος κανονικότητας',
    type: 'checkbox',
    description: '',
    required: true
};

export const checkLegalityDesc = {
    id: 'checkLegality',
    label: 'Έγινε έλεγχος νομιμότητας',
    type: 'checkbox',
    description: '',
    required: true
};

export const checkNecessityDesc = {
    id: 'checkNecessity',
    label: 'Έγινε έλεγχος αναγκαιότητας',
    type: 'checkbox',
    description: '',
    required: true
};

export const checkFeasibilityDesc = {
    id: 'checkFeasibility',
    label: 'Έγινε έλεγχος σκοπιμότητας',
    type: 'checkbox',
    description: '',
    required: true
};

export  const loanDesc = {
    id: 'loan',
    label: 'Ταμειακή διευκόλυνση',
    type: 'checkbox',
    description: '',
    required: true
};

export  const loanSourceDesc = {
    id: 'loanSource',
    label: 'Από',
    type: 'text',
    description: '',
    required: true
};

export class StageDescription {
    title: string;
    prev: string[];
    next: string[];
    stageFields: FieldDescription [];
}

/* stages descriptions */
export const stageIds = ['1', '2', '3', '4', '5a', '5b', '6', '7', '8', '9', '10', '11', '12', '13'];
export const approvalStages = ['1', '2', '3', '4', '5a', '5b', '6'];
export const paymentStages = ['7', '7a', '8', '9', '10', '11', '12', '13'];

export const stageTitles = {
    '1': 'Υποβολή αιτήματος',
    '2': 'Έγκριση επιστημονικού υπευθύνου',
    '3': 'Έλεγχος χειριστή έργου',
    '4': 'Βεβαίωση Π.Ο.Υ.',
    '5a': 'Έγκριση Διατάκτη',
    '5b': 'Έγκριση Διοικητικού Συμβουλίου',
    '6': 'Ανάρτηση στην Διαύγεια',
    '7': 'Καταχώρηση συνοδευτικού υλικού',
    '7a': 'Έλεγχος από Διοικητικό Συμβούλιο',
    '8': 'Έλεγχος από ομάδα ελέγχου',
    '9': 'Έλεγχος από Π.Ο.Υ',
    '10': 'Έλεγχος Διατάκτη',
    '11': 'Ανάρτηση εξόφλησης στη Διαύγεια',
    '12': 'Λογιστική καταχώρηση',
    '13': 'Οικονομική διεκπεραίωση'
};

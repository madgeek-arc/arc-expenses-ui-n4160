import * as jspdf from 'jspdf';
import html2canvas from 'html2canvas';

export function printRequestPage(reqId: string) {
    /*
    *  HOW IT WORKS:
    *  - install html2canvas and jspdf [https://www.npmjs.com/package/html2canvas, https://www.npmjs.com/package/jspdf]
    *  - add 'printable-section' id to the div that wraps all the html elements you want to print
    *  - add an data-html2canvas-ignore attribute (no value needed) to each html element you want to exclude
    *  - the script below also uses an extra html element with id 'requestTitle' to include the div with the page title
    */
    const data = document.getElementById('printable-section');
    const titleNode = document.getElementById('requestTitle');
    data.insertBefore(titleNode, data.childNodes[0]);

    const imgDiv = document.createElement('div');
    imgDiv.setAttribute('id', 'logoimg');
    const logo = document.createElement('img');
    logo.setAttribute('src', '../../assets/imgs/ARCLogo.png');
    logo.setAttribute('width', '400');
    logo.setAttribute('style', 'display:inline-block; margin-right: 20px;');
    imgDiv.appendChild(logo);

    const appTitle = document.createElement('h4');
    appTitle.setAttribute('style', 'text-align: right; float:right;');
    appTitle.innerText = 'Εφαρμογή διαχείρισης πρωτογενών αιτημάτων';
    imgDiv.appendChild(appTitle);

    data.insertBefore(imgDiv, data.childNodes[0]);

    /* if windowWidth/Height are not set then the canvas is created according to the current browser aspect ratio */
    html2canvas(data, {windowWidth: 1240, windowHeight: 1754, scale: 2}).then(canvas => {
        // Few necessary setting options
        const imgWidth = 190;
        const imgHeight = canvas.height * imgWidth / canvas.width;
        const contentDataURL = canvas.toDataURL('image/png');
        const pdf = new jspdf(); // A4 size page of PDF, portrait, using millimeters
        pdf.addImage(contentDataURL, 'PNG', 8, 10, imgWidth, imgHeight, '', 'FAST');
        const filename = reqId + '.pdf';
        pdf.save(filename, {usePromise: true}); // Generated PDF

        /* THE POPUP WINDOW IS BLOCKED BY THE BROWSER */
        // const file = new Blob([pdf.output('blob', {filename: filename})], {type: 'application/pdf'});
        // const fileURL = URL.createObjectURL(file);
        // window.open(fileURL, '_blank');

        data.removeChild(document.getElementById('logoimg'));
    });

}

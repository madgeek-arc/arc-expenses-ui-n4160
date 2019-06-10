import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AsideHelpContentComponent, HelpContentComponent } from './help-content/help-content.component';
import { ReadMoreComponent } from './read-more/read-more.component';
import { Stage1FormComponent } from '../request-stage/stage1-form/stage1-form.component';
import { FilterByTerm } from './search-term.pipe';
import { AnchorDirective } from './dynamic-loader-anchor-components/anchor.directive';
import {
    DropdownSearchComponent,
    FormFieldComponent,
    FormUploadFileComponent,
    FormUploadFilesComponent
} from './form-wrappers/form-wrappers.component';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule
    ],
    declarations: [
        HelpContentComponent,
        AsideHelpContentComponent,
        ReadMoreComponent,
        AnchorDirective,
        FilterByTerm,
        FormFieldComponent,
        FormUploadFileComponent,
        FormUploadFilesComponent,
        DropdownSearchComponent
    ],
    exports: [
        HelpContentComponent,
        AsideHelpContentComponent,
        ReadMoreComponent,
        AnchorDirective,
        FilterByTerm,
        FormFieldComponent,
        FormUploadFileComponent,
        FormUploadFilesComponent,
        DropdownSearchComponent
    ]
})
export class SharedComponentsModule {}

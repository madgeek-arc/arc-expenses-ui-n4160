import { Component, ComponentFactoryResolver, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { AnchorInterfaceComponent } from '../../shared/dynamic-loader-anchor-components/anchor-interface.component';
import { AnchorItem } from '../../shared/dynamic-loader-anchor-components/anchor-item';
import { AnchorDirective } from '../../shared/dynamic-loader-anchor-components/anchor.directive';

@Component({
    selector: 'app-stage-loader',
    template: `<ng-template anchor-host></ng-template>`
})
export class StagesLoaderComponent implements OnInit {
    @Input() stage: AnchorItem;
    @ViewChild(AnchorDirective) stageHost: AnchorDirective;

    @Output() emitStage: EventEmitter<any> = new EventEmitter<any>();
    @Output() newValues: EventEmitter<string[]> = new EventEmitter<string[]>();
    @Output() promptEdit: EventEmitter<boolean> = new EventEmitter<boolean>();

    constructor(private componentFactoryResolver: ComponentFactoryResolver) { }

    ngOnInit() {
        if (this.stage) {
            this.loadComponent();
        }
    }

    loadComponent() {
        const anchorItem = this.stage;

        const componentFactory = this.componentFactoryResolver.resolveComponentFactory(anchorItem.component);

        const viewContainerRef = this.stageHost.viewContainerRef;
        viewContainerRef.clear();

        const componentRef = viewContainerRef.createComponent(componentFactory);
        componentRef.instance['emitStage'].subscribe(emitted => this.emitStage.emit(emitted));
        componentRef.instance['newValues'].subscribe(emitted => this.newValues.emit(emitted));
        componentRef.instance['promptEdit'].subscribe(emitted => this.promptEdit.emit(emitted));

        (<AnchorInterfaceComponent>componentRef.instance).data = anchorItem.data;
    }
}

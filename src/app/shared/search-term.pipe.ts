import { Pipe, PipeTransform } from '@angular/core';

@Pipe ({ name: 'filterByTerm' })
export class FilterByTerm implements PipeTransform {
    transform (items: any[], searchTerm: string, fieldName: string): any[] {
        if (!items) { return []; }
        if (!searchTerm) { return items; }

        searchTerm = searchTerm.trim();
        searchTerm = searchTerm.toLowerCase();

        return items.filter(item => item[fieldName].toLowerCase().includes(searchTerm));
    }
}


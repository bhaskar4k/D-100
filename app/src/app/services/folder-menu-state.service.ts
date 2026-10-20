// file-menu-state.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FolderMenuStateService {
    private openId$ = new BehaviorSubject<string | null>(null);
    openId = this.openId$.asObservable();

    toggle(id: string) {
        this.openId$.next(this.openId$.value === id ? null : id);
    }

    close() {
        this.openId$.next(null);
    }

    isOpen(id: string): boolean {
        return this.openId$.value === id;
    }
}
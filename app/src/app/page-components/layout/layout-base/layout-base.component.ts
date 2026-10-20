import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { SidePanelComponent } from '../side-panel/side-panel.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-layout-base',
  imports: [RouterOutlet, NavbarComponent, SidePanelComponent, FooterComponent],
  templateUrl: './layout-base.component.html',
  styleUrl: './layout-base.component.css'
})
export class LayoutBaseComponent {

}

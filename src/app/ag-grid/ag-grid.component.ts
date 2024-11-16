import { Component, OnInit } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { AgGridAngular } from 'ag-grid-angular';
import { SpotifyService } from '../spotify.service'; // Assurez-vous que le chemin est correct

@Component({
  selector: 'app-ag-grid',
  standalone: true,
  imports: [AgGridAngular],
  templateUrl: './ag-grid.component.html',
  styleUrls: ['./ag-grid.component.css'],
})
export class AgGridComponent implements OnInit {
  rowData: any[] = []; // Initialiser le tableau vide
  colDefs: ColDef[] = [
    {
      headerName: 'Playlist',
      cellRenderer: (params: any) => {
        return `
          <div style="display: flex; align-items: center;">
            <img src="${params.data.images[0]?.url}" style="width: 25%; height: 100%;" />
            <p>${params.data.name}</p>
          </div>
        `;
      },
    },
    {
      headerName: 'Sélectionner',
      field: 'selected',
      cellRenderer: (params: any) => {
        return `<input type="checkbox" ${params.data.selected ? 'checked' : ''}/>`;
      },
    },
  ];

  constructor(private spotifyService: SpotifyService) {}

  ngOnInit() {
    this.spotifyService.getUserPlaylists('yohannlc').subscribe((data) => {
      this.rowData = data.items.map((playlist: any) => ({
        name: playlist.name,
        images: playlist.images,
        selected: false,
      }));
    });
  }
}

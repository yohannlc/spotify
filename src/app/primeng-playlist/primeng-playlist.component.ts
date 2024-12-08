import { Component, OnInit, Output, EventEmitter  } from '@angular/core';
import { SpotifyService } from '../spotify.service'; // Assurez-vous que le chemin est correct
import { TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';
import {  map, catchError, filter, of } from 'rxjs';

@Component({
  selector: 'app-primeng-playlist',
  templateUrl: './primeng-playlist.component.html',
  styleUrls: ['./primeng-playlist.component.css'],
  standalone: true,
  imports: [TableModule, CheckboxModule, FormsModule],
})

export class PrimengPlaylistComponent implements OnInit {
  @Output() selectedPlaylistsChange = new EventEmitter<any[]>(); // Émetteur pour les playlists sélectionnées

  playlists: any[] = [];

  constructor(private spotifyService: SpotifyService) {}

  ngOnInit(): void {
    this.loadPlaylists();
    this.restoreSelectedPlaylists();
  }

  loadPlaylists() {
    this.spotifyService.getUserPlaylists()
    .pipe(
      catchError((err) => {
        console.error('Erreur lors de la récupération des playlists', err);
        return of({ items: [] }); // Retourne une liste vide si l'API échoue
      }),
      map(response => response.items || []), // Assure que items est toujours une liste (data.items ou une liste vide)
      map(items =>
        items.filter((item: any) => item && item.id) // Conserve uniquement les items (playlists) non null et avec un ID
          .map((item: any) => ({
            id: item.id,
            name: item.name,
            image: item.images[0]?.url || 'default-image-url',
            selected: false,
          }))
      )
    )
    .subscribe((items) => {
      this.playlists = items;
    });
  }
  

  restoreSelectedPlaylists() {
    const storedPlaylists = localStorage.getItem('selectedPlaylists');
    if (storedPlaylists) {
      const selectedIds = JSON.parse(storedPlaylists);
      this.playlists.forEach(playlist => {
        playlist.selected = selectedIds.includes(playlist.id);
      });
      this.onPlaylistSelectionChange(); // Émettre l'état restauré
    }
  }
  
  onPlaylistSelectionChange() {
    const selectedPlaylists = this.playlists.filter(playlist => playlist.selected);
    this.selectedPlaylistsChange.emit(selectedPlaylists);
    // Sauvegarder les playlists sélectionnées
    const selectedIds = selectedPlaylists.map(playlist => playlist.id);
    localStorage.setItem('selectedPlaylists', JSON.stringify(selectedIds));
  }
}

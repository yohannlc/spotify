import { Component, OnInit, Output, EventEmitter  } from '@angular/core';
import { SpotifyService } from '../spotify.service'; // Assurez-vous que le chemin est correct
import { TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';

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
    this.spotifyService.getUserPlaylists().subscribe((data) => {
      this.playlists = data.items.map((playlist: any) => ({
        id: playlist.id,
        name: playlist.name,
        image: playlist.images[0]?.url || 'default-image-url',
        selected: false,
      }));
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

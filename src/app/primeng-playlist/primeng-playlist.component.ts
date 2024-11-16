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
  }

  loadPlaylists() {
    const userId = 'yohannlc';
    this.spotifyService.getUserPlaylists(userId).subscribe((data) => {
      this.playlists = data.items.map((playlist: any) => ({
        id: playlist.id,
        name: playlist.name,
        image: playlist.images[0]?.url || 'default-image-url',
        selected: false,
      }));
    });
  }

  // Méthode appelée lorsqu'une playlist est sélectionnée
  onPlaylistSelectionChange() {
    const selectedPlaylists = this.playlists.filter(playlist => playlist.selected);
    this.selectedPlaylistsChange.emit(selectedPlaylists);
  }
}

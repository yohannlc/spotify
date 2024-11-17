import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpotifyService } from '../spotify.service';
import { TableModule } from 'primeng/table';

interface Track {
  id: string;
  name: string;
  artist: string;
  albumImage: string;
  previewUrl: string;
}

interface Playlist {
  id: string;
  name: string;
  image: string;
}

@Component({
  selector: 'app-primeng-music',
  templateUrl: './primeng-music.component.html',
  styleUrls: ['./primeng-music.component.css'],
  standalone: true,
  imports: [TableModule, CommonModule],
})
export class PrimengMusicComponent implements OnInit {
  @Input() selectedPlaylists: Playlist[] = [];
  likedTracks: Track[] = [];
  trackPlaylistSelections: { [trackId: string]: { [playlistId: string]: boolean } } = {}; // Suivre l'état des cases à cocher

  constructor(private spotifyService: SpotifyService) {}

  ngOnInit() {
    this.loadLikedTracks();
  }

  ngOnChanges(): void {
    console.log('Playlists sélectionnées mises à jour :', this.selectedPlaylists);
    this.loadTracksForSelectedPlaylists();
  }

  loadLikedTracks() {
    this.spotifyService.getUserLikedTracks().subscribe((response: any) => {
      this.likedTracks = response.items.map((item: any) => ({
        id: item.track.id,
        name: item.track.name,
        artist: item.track.artists[0].name,
        albumImage: item.track.album.images[0]?.url,
        songUrl: item.track.external_urls.spotify,
        previewUrl: item.track.preview_url,
      }));
    });
  }

  loadTracksForSelectedPlaylists() {
    // Implémenter une logique pour charger les morceaux des playlists sélectionnées
  }

  // Retourne l'état de la case à cocher pour une musique et une playlist
  isSelected(trackId: string, playlistId: string): boolean {
    return this.trackPlaylistSelections[trackId]?.[playlistId] || false;
  }

  onTrackPlaylistSelectionChange(trackId: string, playlistId: string, event: any) {
    const isChecked = event.checked;
    if (!this.trackPlaylistSelections[trackId]) {
      this.trackPlaylistSelections[trackId] = {};
    }
    this.trackPlaylistSelections[trackId][playlistId] = isChecked;
  }
}

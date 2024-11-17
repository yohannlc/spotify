import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpotifyService } from '../spotify.service';
import { TableModule } from 'primeng/table';
import { CustomAudioComponent } from '../customaudio/customaudio.component';

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
  imports: [TableModule, CommonModule, CustomAudioComponent],
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

      this.updateTrackPlaylistSelections();
    });
  }

  updateTrackPlaylistSelections() {
    this.likedTracks.forEach(track => {
      this.selectedPlaylists.forEach(playlist => {
        // Vous pouvez ici vérifier si le morceau appartient à une playlist
        // Par exemple, en utilisant un service qui récupère les morceaux d'une playlist
        // ou simplement par une logique qui associe un morceau à une playlist
        if (this.isTrackInPlaylist(track.id, playlist.id)) {
          if (!this.trackPlaylistSelections[track.id]) {
            this.trackPlaylistSelections[track.id] = {};
          }
          this.trackPlaylistSelections[track.id][playlist.id] = true;
        } else {
          if (!this.trackPlaylistSelections[track.id]) {
            this.trackPlaylistSelections[track.id] = {};
          }
          this.trackPlaylistSelections[track.id][playlist.id] = false;
        }
      });
    });
  }

  // Exemple de méthode pour vérifier si un morceau est dans une playlist
  isTrackInPlaylist(trackId: string, playlistId: string): boolean {
    // Vous devrez adapter cette logique pour vérifier si le morceau est réellement
    // dans la playlist en question (peut-être via une API Spotify ou autre logique)
    // Par exemple, vous pourriez utiliser une méthode qui vous donne la liste des morceaux
    // d'une playlist donnée et faire une comparaison.
    return Math.random() > 0.5; // À adapter avec une logique réelle
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

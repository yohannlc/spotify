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
  total: number;
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
  playlistsTracks: { [playlistId: string]: string[] } = {};
  constructor(private spotifyService: SpotifyService) {}

  ngOnInit() {
    this.loadLikedTracks();
  }

  ngOnChanges(): void {
    console.log('Playlists sélectionnées mises à jour :', this.selectedPlaylists);
    // Charger les morceaux pour chaque playlist sélectionnée
    this.selectedPlaylists.forEach((playlist) => {
      if (!this.playlistsTracks[playlist.id]) {
        this.loadPlaylistsTracks(playlist); // Charger uniquement si non déjà chargé
      }
    });
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

  loadPlaylistsTracks(playlist: Playlist) {
    const storedTracks = localStorage.getItem(`playlistTracks_${playlist.id}`);
    if (storedTracks) {
      // Restaurer les morceaux depuis localStorage
      this.playlistsTracks[playlist.id] = JSON.parse(storedTracks);
      // Console.log les noms des morceaux
      console.log('Noms des morceaux de la playlist', playlist.name, ':', this.playlistsTracks[playlist.id].map((trackId: string) => this.likedTracks.find((track) => track.id === trackId)?.name));
    } else {
      // Charger depuis l'API si non sauvegardé
      this.spotifyService.getPlaylistTracks(playlist.id).subscribe((response: any) => {
        const tracks = response.items.map((item: any) => ({
          id: item.track.id,
        }));
        this.selectedPlaylists.find((p) => p.id === playlist.id)!.total = response.total;
        console.log('Nombre total de morceaux dans la playlist', playlist.name, ':', response.total);
        console.log('Morceaux de la playlist', playlist.name, ':', tracks);
        this.playlistsTracks[playlist.id] = tracks.map((track: any) => track.id);
        // Sauvegarder les morceaux dans localStorage
        localStorage.setItem(`playlistTracks_${playlist.id}`, JSON.stringify(this.playlistsTracks[playlist.id]));
      });
    }
  }

  isSelected(playlistId: string, trackId: string): boolean {
    return this.playlistsTracks[playlistId]?.includes(trackId);
  }

  // onCheckboxChange($event, playlist.id, track.id)
  onCheckboxChange(event: any, playlistId: string, trackId: string) {
    if (event.target.checked) {
      this.spotifyService.addTrackToPlaylist(playlistId, trackId).subscribe(() => {
        console.log(`Piste ${trackId} ajoutée à la playlist ${playlistId}`);
      });
    } else {
      this.spotifyService.removeTrackFromPlaylist(playlistId, trackId).subscribe(() => {
        console.log(`Piste ${trackId} retirée de la playlist ${playlistId}`);
      });
    }
  }
}

import { Component, Input, OnInit } from '@angular/core';
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
}

@Component({
  selector: 'app-primeng-music',
  templateUrl: './primeng-music.component.html',
  styleUrls: ['./primeng-music.component.css'],
  standalone: true,
  imports: [TableModule],
})
export class PrimengMusicComponent implements OnInit {
  @Input() selectedPlaylists: Playlist[] = [];
  likedTracks: Track[] = [];
  trackPlaylistSelections: { [trackId: string]: { [playlistId: string]: boolean } } = {};

  constructor(private spotifyService: SpotifyService) {}

  ngOnInit() {
    this.loadLikedTracks();
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
      console.log(this.likedTracks);  // Vérifiez la sortie dans la console
    });
  }
  

  // onMusicSelect(musicId: string, playlistId: string, event: CheckboxChangeEvent) {
  //   const isChecked = event.checked;
  //   if (isChecked) {
  //     console.log(`Ajouter la musique ${musicId} à la playlist ${playlistId}`);
  //   } else {
  //     console.log(`Retirer la musique ${musicId} de la playlist ${playlistId}`);
  //   }

  //   // Mettre à jour l'état de la case à cocher
  //   if (!this.trackPlaylistSelections[musicId]) {
  //     this.trackPlaylistSelections[musicId] = {};
  //   }
  //   this.trackPlaylistSelections[musicId][playlistId] = isChecked;
  // }

  // isChecked(trackId: string, playlistId: string): boolean {
  //   return this.trackPlaylistSelections[trackId]?.[playlistId] || false;
  // }
}

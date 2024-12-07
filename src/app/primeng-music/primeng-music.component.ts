import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpotifyService } from '../spotify.service';
import { TableModule } from 'primeng/table';
import { CustomAudioComponent } from '../customaudio/customaudio.component';
import {  map, catchError, filter, of } from 'rxjs';

interface Track {
  id: string;
}

interface Playlist {
  id: string;
  name: string;
  image: string;
  total: number;
  lastUpdate: Date;
  lastChange: Date;
  tracks: Track[];
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
  constructor(private spotifyService: SpotifyService) {}

  ngOnInit() {
    this.loadLikedTracks();
  }

  ngOnChanges(): void {
    this.selectedPlaylists.forEach((playlist) => {
      this.loadPlaylistsTracks(playlist);
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
    // On reload PAS les tracks si la playlist a déjà été mise à jour ou si elle n'a pas été modifiée depuis ou si la dernière mise à jour date de moins de 10 secondes
    // On relad la playlist au bout de 10 secondes dans tous les cas pour récupérer les éventuelles modifications apportées hors de l'application (sur l'app Spotify directement par exemple)
    if (playlist.lastUpdate &&
        (!playlist.lastChange || playlist.lastUpdate > playlist.lastChange) &&
        (Date.now() - playlist.lastUpdate.getTime() <= 10000)) {
      return;
    }
  
    this.spotifyService.getPlaylistTracks(playlist.id)
      .pipe(
        catchError((err) => {
          console.error(`Erreur lors de la récupération des pistes pour la playlist ${playlist.id}`, err);
          return of({ items: [], total: 0 }); // Retourne une réponse vide en cas d'erreur
        }),
        map(response => response.items || []), // Garantit que `items` est une liste (vide par défaut)
        filter((items: any[]) => Array.isArray(items)), // Vérifie que `items` est bien un tableau
        map(items =>
          items
            .filter(item => item?.track?.id) // Conserve uniquement les éléments valides avec un ID de piste
            .map(item => ({
              id: item.track.id,
            }))
        )
      )
      .subscribe((tracks) => {
        playlist.lastUpdate = new Date();
        playlist.total = tracks.length;
        playlist.tracks = tracks;
      });
  }
  

  isSelected(playlistId: string, trackId: string): boolean {
    return this.selectedPlaylists.some((playlist) => playlist.id === playlistId && playlist.tracks?.some((track) => track.id === trackId)); // Vérifie si la piste est dans la playlist
  }

  // onCheckboxChange($event, playlist.id, track.id)
  onCheckboxChange(event: any, playlistId: string, trackId: string) {
    const playlist = this.selectedPlaylists.find((playlist) => playlist.id === playlistId); // Changement, on met à jour la valeur lastChange de la playlist actuelle
    if (playlist) {
      playlist.lastChange = new Date();
    } else {
      console.error(`Playlist ${playlistId} non trouvée`);
    }

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
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpotifyService } from '../spotify.service';
import { TableModule } from 'primeng/table';
import { CustomAudioComponent } from '../customaudio/customaudio.component';
import { map, catchError, filter, of } from 'rxjs';

interface Track {
  id: string;
}

interface Playlist {
  id: string;
  name: string;
  image: string;
  total: number;
  loadedTracks: number;
  lastUpdate: Date;
  lastChange: Date;
  nextUrl: string | null;
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

  isLoading: boolean = false;
  nextUrl: string | null = null;
  total: number = 0;
  loadedTracks: number = 0;
  likedTracks: Track[] = [];
  maxTracks: number = 400;

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
    if (this.isLoading || this.total > 0 && this.loadedTracks >= this.total || this.likedTracks.length >= this.maxTracks) {
      return;
    }
  
    this.isLoading = true;
    
    this.spotifyService.getUserLikedTracks(this.nextUrl)
      .pipe(
        catchError((err) => {
          console.error('Erreur lors de la récupération des pistes aimées', err);
          this.isLoading = false; // Réinitialise immédiatement en cas d'erreur
          return of({ items: [], next: null, total: 0 });
        }),
        map(({ items, next, total }) => {
          const likedTracks = items
          ?.filter((item: any) => item) // Conserve uniquement les éléments non nuls
          ?.map((item: any) => ({
            id: item.track.id,
            name: item.track.name,
            artist: item.track.artists[0].name,
            albumImage: item.track.album.images[0].url,
            songUrl: item.track.external_urls.spotify,
            previewUrl: item.track.preview_url,
          })) || [];
          return { likedTracks, nextUrl: next, total }; // Retourne un objet structuré
        })
      )
      .subscribe(({ likedTracks, nextUrl, total }) => {
        this.likedTracks = [...this.likedTracks, ...likedTracks]; // Ajoute les nouvelles pistes
        this.total = total;
        this.loadedTracks = this.likedTracks.length;
        this.nextUrl = nextUrl;
        
        this.isLoading = false;
      });
  }
  

  loadPlaylistsTracks(playlist: Playlist) {
    // Pour ne pas recharger inutilement les pistes il faut que :
    if (playlist.lastUpdate // la playlist ait déjà été mise à jour
        && (!playlist.lastChange || playlist.lastChange < playlist.lastUpdate) // ET que la playlist n'ait pas été modifiée depuis
        && (Date.now() - playlist.lastUpdate.getTime() <= 10000) // ET que la dernière mise à jour date de moins de 10 secondes
        && this.isLoading // ET que le chargement soit déjà en cours
        ) {
        return;
    }

    this.isLoading = true;
  
    this.spotifyService.getPlaylistTracks(playlist.id, playlist.nextUrl)
      .pipe(
        catchError((err) => {
          console.error(`Erreur lors de la récupération des pistes pour la playlist ${playlist.id}`, err);
          return of({ items: [], next: null, total: 0 });
        }),
        map(({ items, next, total }) => {
          const playlistTracks = items
            ?.filter((item: any) => item) // Conserve uniquement les éléments non nuls
            .map((item: any) => ({
              id: item.track.id,
              name: item.track.name,
              artist: item.track.artists[0]?.name,
              albumImage: item.track.album.images[0]?.url,
              songUrl: item.track.external_urls?.spotify,
              previewUrl: item.track?.preview_url,
            })) || [];
          return { playlistTracks, nextUrl: next, total }; // Retourne un objet structuré
        })
      )
      .subscribe(({ playlistTracks, nextUrl, total }) => {
        playlist.tracks = [...(playlist.tracks || []), ...playlistTracks];
        playlist.total = total;
        playlist.loadedTracks = playlist.tracks.length;
        playlist.nextUrl = nextUrl;

        this.isLoading = false;
        playlist.lastUpdate = new Date();

        if (nextUrl) {
          this.loadPlaylistsTracks(playlist);
        }
      });
  }
  

  isSelected(playlistId: string, trackId: string): boolean {
    return this.selectedPlaylists.some((playlist) => playlist.id === playlistId && playlist.tracks?.some((track) => track.id === trackId)); // Vérifie si la piste est dans la playlist
  }


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
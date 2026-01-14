import { Component, Input, OnInit, OnChanges, SimpleChanges, signal, computed, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { SpotifyService } from '../spotify.service';
import { TableModule } from 'primeng/table';
import { CustomAudioComponent } from '../customaudio/customaudio.component';
import { map, catchError, of } from 'rxjs';

interface Track {
  id: string;
  name?: string;
  artist?: string;
  albumImage?: string;
  songUrl?: string;
  previewUrl?: string;
}

interface Playlist {
  id: string;
  name: string;
  image: string;
  total: number;
  loadedTracks: number;
  lastUpdate: Date;
  lastChange?: Date;
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
export class PrimengMusicComponent implements OnInit, OnChanges {
  // --- INPUTS & SIGNALS ---
  @Input() selectedPlaylists: Playlist[] = [];

  isLoading = signal(false);
  likedTracks = signal<Track[]>([]);
  nextUrl = signal<string | null>(null);
  total = signal(0);
  maxTracks: number = 1500;

  // Cache de performance pour les cases cochées : "playlistId|trackId"
  trackMembership = signal<Set<string>>(new Set());

  private spotifyService = inject(SpotifyService);
  private destroyRef = inject(DestroyRef);

  // Signal calculé automatiquement
  loadedTracksCount = computed(() => this.likedTracks().length);

  ngOnInit() {
    this.loadLikedTracks();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedPlaylists'] && this.selectedPlaylists) {
      this.selectedPlaylists.forEach((playlist) => {
        this.loadPlaylistsTracks(playlist);
      });
    }
  }

  // --- CHARGEMENT DES TITRES LIKÉS ---
  loadLikedTracks() {
    if (this.isLoading() || (this.total() > 0 && this.loadedTracksCount() >= this.total()) || this.likedTracks().length >= this.maxTracks) {
      return;
    }

    this.isLoading.set(true);
    
    this.spotifyService.getUserLikedTracks(this.nextUrl())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((err) => {
          console.error('Erreur lors de la récupération des pistes aimées', err);
          this.isLoading.set(false);
          return of({ items: [], nextUrl: null, total: 0 });
        }),
        map(({ items, nextUrl, total }) => {
          const processedTracks = items?.filter((item: any) => item?.track).map((item: any) => ({
            id: item.track.id,
            name: item.track.name,
            artist: item.track.artists?.[0]?.name || 'Unknown Artist',
            albumImage: item.track.album?.images?.[0]?.url || '',
            songUrl: item.track.external_urls?.spotify || '',
            previewUrl: item.track.preview_url || '',
          })) || [];
          return { processedTracks, nextUrl, total };
        })
      )
      .subscribe(({ processedTracks, nextUrl, total }) => {
        this.likedTracks.update(current => [...current, ...processedTracks]);
        this.total.set(total);
        this.nextUrl.set(nextUrl);
        this.isLoading.set(false);
      });
  }

  // --- CHARGEMENT DES TITRES DES PLAYLISTS ---
  loadPlaylistsTracks(playlist: Playlist) {
    // Garde : on ne charge pas si mis à jour il y a moins de 10s ou si tout est chargé
    const isRecentlyUpdated = playlist.lastUpdate && (Date.now() - playlist.lastUpdate.getTime() <= 10000);
    if (isRecentlyUpdated && (!playlist.lastChange || playlist.lastChange < playlist.lastUpdate)) {
      return;
    }

    this.spotifyService.getPlaylistTracks(playlist.id, playlist.nextUrl)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((err) => {
          console.error(`Erreur playlist ${playlist.id}`, err);
          return of({ items: [], next: null, total: 0 });
        }),
        map(({ items, next, total }) => {
          const tracks = items?.filter((item: any) => item?.track).map((item: any) => ({
            id: item.track.id
          })) || [];
          return { tracks, next, total };
        })
      )
      .subscribe(({ tracks, next, total }) => {
        playlist.tracks = [...(playlist.tracks || []), ...tracks];
        playlist.total = total;
        playlist.nextUrl = next;
        playlist.lastUpdate = new Date();

        // On précise que t est de type Track (ou au moins possède une propriété id)
        this.trackMembership.update(currentSet => {
          const newSet = new Set(currentSet);
          tracks.forEach((t: { id: string }) => newSet.add(`${playlist.id}|${t.id}`));
          return newSet;
        });

        if (next) this.loadPlaylistsTracks(playlist);
      });
  }

  // --- ACTIONS ---
  isSelected(playlistId: string, trackId: string): boolean {
    return this.trackMembership().has(`${playlistId}|${trackId}`);
  }

  onCheckboxChange(event: any, playlistId: string, trackId: string) {
    const isChecked = event.target.checked;
    const key = `${playlistId}|${trackId}`;
    const playlist = this.selectedPlaylists.find(p => p.id === playlistId);

    if (playlist) playlist.lastChange = new Date();

    // Mise à jour optimiste de l'UI
    this.trackMembership.update(set => {
      const newSet = new Set(set);
      isChecked ? newSet.add(key) : newSet.delete(key);
      return newSet;
    });

    const request$ = isChecked 
      ? this.spotifyService.addTrackToPlaylist(playlistId, trackId)
      : this.spotifyService.removeTrackFromPlaylist(playlistId, trackId);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      error: () => {
        // Rollback en cas d'erreur réseau
        this.trackMembership.update(set => {
          const newSet = new Set(set);
          !isChecked ? newSet.add(key) : newSet.delete(key);
          return newSet;
        });
      }
    });
  }
}
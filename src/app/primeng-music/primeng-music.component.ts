import { Component, Input, OnInit, OnChanges, SimpleChanges, signal, computed, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { SpotifyService } from '../spotify.service';
import { TableModule } from 'primeng/table';
import { CustomAudioComponent } from '../customaudio/customaudio.component';
import { map, catchError, of, Subject, debounceTime } from 'rxjs';

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
  next: string | null;
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
  next = signal<string | null>(null);
  total = signal(0);
  maxTracks: number = 1500;

  // Cache de performance pour les cases cochées : "playlistId|trackId"
  trackMembership = signal<Set<string>>(new Set());

  private spotifyService = inject(SpotifyService);
  private destroyRef = inject(DestroyRef);

  trackByPlaylistId(index: number, playlist: Playlist): string {
    return playlist.id;
  }
  
  trackByTrackId(index: number, track: Track): string {
    return track.id;
  }
  
  loadedTracksCount = computed(() => this.likedTracks().length);

  private scrollLoadSubject = new Subject<void>();

  constructor() {
    this.scrollLoadSubject.pipe(
      debounceTime(150), // Attend 150ms de silence avant d'exécuter
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.executeActualLoad(); // Appelle la logique de chargement
    });
  }

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
  
  // --- DÉCLENCHEUR DE CHARGEMENT ---
  loadLikedTracks() {
    this.scrollLoadSubject.next();
  }

  // --- CHARGEMENT DES TITRES LIKÉS ---
  private executeActualLoad() {
    if (this.isLoading() || (this.total() > 0 && this.loadedTracksCount() >= this.total()) || this.likedTracks().length >= this.maxTracks) {
      return;
    }

    this.isLoading.set(true);
    
    this.spotifyService.getUserLikedTracks(this.next())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((err) => {
          console.error('Erreur', err);
          this.isLoading.set(false);
          return of({ items: [], next: null, total: 0 });
        }),
        map((res: any) => {
          const processedTracks = res.items?.filter((item: any) => item?.track).map((item: any) => ({
            id: item.track.id,
            name: item.track.name,
            artist: item.track.artists?.[0]?.name || 'Unknown',
            albumImage: item.track.album?.images?.[0]?.url || '',
            songUrl: item.track.external_urls?.spotify || '',
            previewUrl: item.track.preview_url || '',
          })) || [];

          return { processedTracks, next: res.next, total: res.total };
        })
      )
      .subscribe(({ processedTracks, next, total }) => {
        this.likedTracks.update(current => [...current, ...processedTracks]);
        this.total.set(total);
        this.next.set(next);
        this.isLoading.set(false);
      });
    }

  // --- CHARGEMENT DES TITRES DES PLAYLISTS ---
  loadPlaylistsTracks(playlist: Playlist) {
    // 1. Initialisation sécurisée : si tracks est undefined, on le crée
    if (!playlist.tracks) {
      playlist.tracks = [];
    }

    const urlToFetch = playlist.next;

    // 2. Sécurité : on n'arrête que si on a déjà des titres ET qu'il n'y a plus de page suivante
    if (playlist.tracks.length > 0 && !urlToFetch) {
      return;
    }

    this.spotifyService.getPlaylistTracks(playlist.id, urlToFetch)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((err) => {
          console.error(`Erreur playlist ${playlist.id}`, err);
          return of({ items: [], next: null, total: 0 });
        })
      )
      .subscribe((res: any) => {
        const newTracks = res.items
          ?.filter((item: any) => item?.track?.id)
          .map((item: any) => ({ id: item.track.id })) || [];

        // Mise à jour de l'objet
        playlist.tracks = [...playlist.tracks, ...newTracks];
        playlist.total = res.total;
        playlist.next = res.next;
        playlist.lastUpdate = new Date();

        this.trackMembership.update(currentSet => {
          const newSet = new Set(currentSet);
          newTracks.forEach((t: any) => newSet.add(`${playlist.id}|${t.id}`));
          return newSet;
        });

        // 3. Récursion propre
        if (res.next) {
          setTimeout(() => this.loadPlaylistsTracks(playlist), 0);
        }
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
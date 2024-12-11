import { Component, OnInit, Output, EventEmitter  } from '@angular/core';
import { SpotifyService } from '../spotify.service'; // Assurez-vous que le chemin est correct
import { TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';
import {  map, catchError, filter, of } from 'rxjs';

@Component({
  selector: 'app-primeng-playlist',
  templateUrl: './primeng-playlist.component.html',
  styleUrls: ['./primeng-playlist.component.css'],
  standalone: true,
  imports: [TableModule, CheckboxModule, FormsModule],
})

export class PrimengPlaylistComponent implements OnInit {
  @Output() selectedPlaylistsChange = new EventEmitter<any[]>(); // Émetteur pour les playlists sélectionnées

  userId: string = '';

  isLoading: boolean = false;
  nextUrl: string | null = null;
  total: number = 0;
  playlists: any[] = [];
  maxPlaylists: number = 200;

  constructor(private spotifyService: SpotifyService) {}

  ngOnInit(): void {
    this.loadPlaylists();
    this.restoreSelectedPlaylists();
    this.getUserId();
  }

  getUserId() {
    this.spotifyService.getUserProfile()
      .pipe(
        catchError((err) => {
          console.error('Erreur lors de la récupération du profil utilisateur', err);
          return of({ id: '' });
        }),
        map(({ id }) => {
          return id;
        })
      )
      .subscribe((id) => {
        this.userId = id;
      });
  }

  loadPlaylists() {
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;

    this.spotifyService.getUserPlaylists(this.nextUrl)
      .pipe(
        catchError((err) => {
          console.error('Erreur lors de la récupération des playlists', err);
          return of({ items: [], next: null, total: 0 });
        }),
        // map(response => {
        //   console.log('Response:', response); // Ajoute un console.log de la response
        //   return response;
        // }),
        map(({ items, next, total }) => {
          const playlists = items
            ?.filter((item: any) => item) // Conserve uniquement les playlists non nulles
            ?.filter((item: any) => item.owner.id === this.userId) // Conserve uniquement les playlists de l'utilisateur actuel
            ?.filter((item: any) => item.images?.length > 0) // Conserve uniquement les playlists avec au moins une image
            .map((item: any) => ({
              id: item.id,
              name: item.name,
              image: item.images?.[0]?.url || 'default-image-url',
              selected: false,
            })) || [];
          return { playlists, nextUrl: next, total };
        })
      )
      .subscribe(({ playlists, nextUrl, total }) => {
        this.playlists = [...this.playlists, ...playlists];
        this.total = total;
        this.nextUrl = nextUrl;

        this.isLoading = false;

        if (nextUrl && this.playlists.length < this.maxPlaylists) {
          this.loadPlaylists();
        }
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

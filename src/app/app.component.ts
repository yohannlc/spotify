import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WelcomeComponent } from './welcome/welcome.component';
import { PrimengPlaylistComponent } from './primeng-playlist/primeng-playlist.component';
import { PrimengMusicComponent } from './primeng-music/primeng-music.component';
import { SpotifyService } from './spotify.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    WelcomeComponent, 
    PrimengPlaylistComponent, 
    PrimengMusicComponent
  ],
})
export class AppComponent  {
  selectedPlaylists: any[] = []; // Stocke les playlists sélectionnées

  constructor(private spotifyService: SpotifyService) {}

  get isAuthenticated(): boolean {
    return !!this.spotifyService.getAccessToken();
  }

  updateSelectedPlaylists(playlists: any[]): void {
    this.selectedPlaylists = playlists; // Mise à jour des playlists sélectionnées
  }

  regenerateAccessToken(): void {
    this.spotifyService.regenerateAccessToken();
  }
}

import { Component, OnInit } from '@angular/core';
import { SpotifyService } from '../spotify.service';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.css'
})

export class WelcomeComponent implements OnInit {
  constructor(private spotifyService: SpotifyService) {}

  ngOnInit(): void {
    const currentUrl = window.location.href;

    // Vérifier si le token est déjà dans LocalStorage
    const token = this.spotifyService.getAccessToken();
    if (token) {
      console.log('Access token found in local storage:', token);
      return; // Évite de rediriger l'utilisateur inutilement
    }

    // Si le token est dans l'URL, on le stocke
    if (currentUrl.includes('access_token')) {
      this.spotifyService.setAccessTokenFromRedirectUrl(currentUrl);

      // Nettoyer l'URL après avoir extrait le token
      window.history.replaceState({}, document.title, '/');
    } else {
      // Sinon, rediriger vers Spotify pour l'autorisation
      window.location.href = this.spotifyService.getAuthorizationUrl();
    }
  }
}